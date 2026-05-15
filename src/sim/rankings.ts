import type {
  CardFight,
  Division,
  EventArchiveEntry,
  EventFight,
  Fighter,
  FightOutcome,
  GameState,
  TitleReign,
} from '@/types';
import { DIVISION_KEYS, MATCHMAKING } from '@/data';
import { fullName, overall } from './fighter';
import { priorMeetingsCount } from './rivalry';
import { chance, randInt } from './random';

// ============================================================
// RANKING SCORE
// ============================================================

export function calculateRankingScore(fighter: Fighter, allFighters: Fighter[]): number {
  if (fighter.retired) return -9999;
  let score = 0;
  score += fighter.wins * 12;
  score -= fighter.losses * 5;
  if (fighter.currentStreak > 0) score += fighter.currentStreak * 8;
  if (fighter.currentStreak < 0) score += fighter.currentStreak * 6;
  score += fighter.koWins * 2;
  score += fighter.subWins * 2;
  if (fighter.isChampion) score += 80;
  score += fighter.titleDefenses * 12;
  score += fighter.titleReigns * 18;
  score -= fighter.inactive * 8;

  // Quality wins
  const recentWins = fighter.fightLog.slice(-10).filter((l) => l.result === 'W');
  for (const win of recentWins) {
    const opp = allFighters.find((f) => f.id === win.oppId);
    if (opp) score += Math.max(0, (overall(opp) - 70) / 3);
  }
  score += overall(fighter) / 10;
  return score;
}

export function getDivisionRankings(state: GameState, division: Division): Fighter[] {
  const eligible = state.fighters.filter((f) => !f.retired && f.division === division);
  const scored = eligible.map((f) => ({
    fighter: f,
    score: calculateRankingScore(f, state.fighters),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.fighter);
}

export function getChampion(state: GameState, division: Division): Fighter | null {
  return state.fighters.find((f) => f.isChampion && !f.retired && f.division === division) ?? null;
}

export function getTop10(state: GameState, division: Division): Fighter[] {
  const champ = getChampion(state, division);
  const ranked = getDivisionRankings(state, division).filter((f) => !champ || f.id !== champ.id);
  return ranked.slice(0, 10);
}

// ============================================================
// P4P (active) and GOAT (all-time) — based on careerPoints
// ============================================================

export function getP4PRankings(state: GameState, limit = 15): Fighter[] {
  return [...state.fighters]
    .filter((f) => !f.retired)
    .sort((a, b) => b.careerPoints - a.careerPoints)
    .slice(0, limit);
}

export function getGOATRankings(state: GameState, limit = 15): Fighter[] {
  return [...state.fighters]
    .sort((a, b) => b.careerPoints - a.careerPoints)
    .slice(0, limit);
}

// ============================================================
// CHAMPIONSHIP HANDLING
// ============================================================

interface TitleHandlerInput {
  state: GameState;
  fightFighters: { fA: Fighter; fB: Fighter };
  result: FightOutcome;
  eventInfo: { num: number; name: string };
  division: Division;
}

export function handleTitleResult({
  state,
  fightFighters,
  result,
  eventInfo,
  division,
}: TitleHandlerInput): void {
  const { fA, fB } = fightFighters;
  const champ = fA.isChampion ? fA : fB.isChampion ? fB : null;
  const challenger = champ ? (fA === champ ? fB : fA) : null;

  if (champ && challenger) {
    if (result.winnerId === champ.id) {
      // Successful defense
      champ.titleDefenses++;
      const currentReign = state.titleHistory.find(
        (r) => r.fighterId === champ.id && r.division === division && !r.endEvent
      );
      if (currentReign) {
        currentReign.defenses = champ.titleDefenses;
        currentReign.fights.push({
          eventNum: eventInfo.num,
          oppName: fullName(challenger),
          method: result.method,
          round: result.round,
          result: 'W',
          rating: result.rating,
        });
      }
    } else {
      // Title changes hands
      champ.isChampion = false;
      const oldReign = state.titleHistory.find(
        (r) => r.fighterId === champ.id && r.division === division && !r.endEvent
      );
      if (oldReign) {
        oldReign.endEvent = eventInfo.num;
        oldReign.endEventName = eventInfo.name;
        oldReign.lostTo = fullName(challenger);
      }
      crownChampion(state, challenger, eventInfo, division);
    }
  } else {
    // Vacant title fight
    const winner = result.winnerId === fA.id ? fA : fB;
    crownChampion(state, winner, eventInfo, division);
  }
}

function crownChampion(
  state: GameState,
  fighter: Fighter,
  eventInfo: { num: number; name: string },
  division: Division
): void {
  fighter.isChampion = true;
  fighter.titleReigns++;
  fighter.becameChampAge = fighter.age;

  const divisionReigns = state.titleHistory.filter((r) => r.division === division).length;
  const newReign: TitleReign = {
    reignNum: divisionReigns + 1,
    division,
    fighterId: fighter.id,
    fighterName: fullName(fighter),
    startEvent: eventInfo.num,
    startEventName: eventInfo.name,
    startAge: fighter.age,
    defenses: 0,
    endEvent: null,
    endEventName: null,
    lostTo: null,
    fights: [],
  };
  state.titleHistory.unshift(newReign);
}

export function handleChampionRetirements(state: GameState): void {
  for (const f of state.fighters) {
    if (f.isChampion && f.retired) {
      f.isChampion = false;
      const reign = state.titleHistory.find(
        (r) => r.fighterId === f.id && r.division === f.division && !r.endEvent
      );
      if (reign) {
        reign.endEvent = state.eventCount;
        reign.endEventName = '(vacated on retirement)';
        reign.lostTo = '— (vacated)';
      }
    }
  }
}

// ============================================================
// MATCHMAKING — PER DIVISION (now rivalry-aware + injury-aware)
// ============================================================

export interface BuildCardOptions {
  targetFightsPerDivision: number;
}

export function buildEventCard(
  state: GameState,
  opts: BuildCardOptions = { targetFightsPerDivision: 2 }
): CardFight[] {
  const card: CardFight[] = [];
  const used = new Set<string>();

  const eventNum = state.eventCount + 1;
  const mainDivision = chooseMainDivision(state, eventNum);

  for (const division of DIVISION_KEYS) {
    const champ = getChampion(state, division);
    const ranked = getDivisionRankings(state, division).filter(
      (f) => !champ || f.id !== champ.id
    );

    const divFightsTarget = opts.targetFightsPerDivision;
    let mainEventBuilt = false;

    // Title fight slot for the main division
    if (division === mainDivision) {
      if (champ && !isUnavailable(champ) && ranked.length > 0) {
        const recentChampOpps = new Set(champ.fightLog.slice(-3).map((l) => l.oppId));
        const contender = ranked.find((f) => !recentChampOpps.has(f.id)) ?? ranked[0];
        card.push(makeCardFight(state, champ, contender, true, true, division));
        used.add(champ.id);
        used.add(contender.id);
        mainEventBuilt = true;
      } else if (!champ && ranked.length >= 2) {
        card.push(makeCardFight(state, ranked[0], ranked[1], true, true, division));
        used.add(ranked[0].id);
        used.add(ranked[1].id);
        mainEventBuilt = true;
      }
    }

    // Undercard
    const available = state.fighters.filter(
      (f) =>
        !f.retired && !isUnavailable(f) && f.division === division && !used.has(f.id)
    );
    const scored = available.map((f) => ({
      f,
      score: calculateRankingScore(f, state.fighters),
    }));
    scored.sort((a, b) => b.score - a.score);

    const remaining = divFightsTarget - (mainEventBuilt ? 1 : 0);
    let added = 0;
    while (added < remaining && scored.length >= 2) {
      const top = scored.shift()!;
      const recentOpps = new Set(top.f.fightLog.slice(-2).map((l) => l.oppId));

      // === RIVALRY-AWARE PICK ===
      // Try to find a rematch/trilogy candidate first.
      let oppIdx = findRematchCandidate(state, top.f, scored, recentOpps, eventNum);

      // Fall back to ranking-based pick
      if (oppIdx === -1) {
        oppIdx = scored.findIndex((s) => !recentOpps.has(s.f.id));
        if (oppIdx === -1) oppIdx = 0;
        if (oppIdx + 1 < scored.length && chance(0.3)) {
          oppIdx = Math.min(scored.length - 1, oppIdx + randInt(0, 2));
        }
      }

      const opp = scored.splice(oppIdx, 1)[0];

      card.push(
        makeCardFight(
          state,
          top.f,
          opp.f,
          false,
          !mainEventBuilt && added === 0,
          division
        )
      );
      used.add(top.f.id);
      used.add(opp.f.id);
      added++;
    }
  }

  // Mark inactivity for unused fighters (but don't penalize injured fighters)
  for (const f of state.fighters) {
    if (!f.retired && !used.has(f.id) && f.injured === 0) f.inactive++;
  }

  // Sort: main event first, then title fights, then division order
  card.sort((a, b) => {
    if (a.isMainEvent && !b.isMainEvent) return -1;
    if (!a.isMainEvent && b.isMainEvent) return 1;
    if (a.isTitleFight && !b.isTitleFight) return -1;
    if (!a.isTitleFight && b.isTitleFight) return 1;
    return DIVISION_KEYS.indexOf(a.division) - DIVISION_KEYS.indexOf(b.division);
  });

  return card;
}

/**
 * Find a rematch/trilogy candidate in the scored pool.
 * Returns the index into `scored` if a rivalry pairing is selected, else -1.
 */
function findRematchCandidate(
  state: GameState,
  topFighter: Fighter,
  scored: { f: Fighter; score: number }[],
  recentOpps: Set<string>,
  eventNum: number
): number {
  // Pull all rivalries involving `topFighter` in the scored pool
  const candidates: { idx: number; weight: number; trilogy: boolean }[] = [];

  for (let i = 0; i < scored.length; i++) {
    const opp = scored[i].f;
    if (recentOpps.has(opp.id)) continue; // never rematch the literal last fight
    const rivalry = getRivalryRaw(state, topFighter.id, opp.id);
    if (!rivalry || rivalry.meetings.length === 0) continue;

    const lastMeeting = rivalry.meetings[rivalry.meetings.length - 1];
    const eventsSince = eventNum - lastMeeting.eventNum;

    // Cooldown / recency window
    if (eventsSince < MATCHMAKING.REMATCH_COOLDOWN_EVENTS) continue;
    if (eventsSince > MATCHMAKING.REMATCH_RECENCY_WINDOW) continue;

    // Last fight must have been decent
    if (lastMeeting.rating < MATCHMAKING.REMATCH_MIN_RATING) continue;

    // Compute weight: trilogy (1-1 tie) gets bigger weight
    const isTrilogy = rivalry.meetings.length === 2 && rivalry.aWins === 1 && rivalry.bWins === 1;
    let weight: number = MATCHMAKING.REMATCH_BASE_CHANCE;

    // Close decision in prior bumps weight
    if (lastMeeting.method === 'DEC') weight *= MATCHMAKING.REMATCH_CLOSE_MULT;

    if (isTrilogy) weight = MATCHMAKING.TRILOGY_CHANCE;

    candidates.push({ idx: i, weight, trilogy: isTrilogy });
  }

  if (candidates.length === 0) return -1;

  // Sort: trilogies first, then by weight
  candidates.sort((a, b) => {
    if (a.trilogy && !b.trilogy) return -1;
    if (!a.trilogy && b.trilogy) return 1;
    return b.weight - a.weight;
  });

  const best = candidates[0];
  if (!chance(best.weight)) return -1;
  return best.idx;
}

/** Raw rivalry lookup (avoids circular import; mirrors rivalry.getRivalry). */
function getRivalryRaw(state: GameState, idA: string, idB: string) {
  const id = idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;
  return state.rivalries[id] ?? null;
}

/** A fighter is unavailable to be booked if currently injured (or otherwise). */
function isUnavailable(f: Fighter): boolean {
  return f.injured > 0;
}

function makeCardFight(
  state: GameState,
  fA: Fighter,
  fB: Fighter,
  isTitleFight: boolean,
  isMainEvent: boolean,
  division: Division
): CardFight {
  const prior = priorMeetingsCount(state, fA.id, fB.id);
  return {
    fAId: fA.id,
    fBId: fB.id,
    isTitleFight,
    isMainEvent,
    division,
    isRivalry: prior >= 1,
    priorMeetings: prior,
  };
}

function chooseMainDivision(state: GameState, eventNum: number): Division {
  const isAvailable = (f: Fighter) => !f.retired && f.injured === 0;
  const rotation = DIVISION_KEYS[(eventNum - 1) % DIVISION_KEYS.length];
  const champ = getChampion(state, rotation);
  const ranked = getDivisionRankings(state, rotation).filter(
    (f) => isAvailable(f) && (!champ || f.id !== champ.id)
  );
  if ((champ && isAvailable(champ) && ranked.length > 0) || ranked.length >= 2) return rotation;
  for (const div of DIVISION_KEYS) {
    const c = getChampion(state, div);
    const r = getDivisionRankings(state, div).filter(
      (f) => isAvailable(f) && (!c || f.id !== c.id)
    );
    if ((c && isAvailable(c) && r.length > 0) || r.length >= 2) return div;
  }
  return rotation;
}

// ============================================================
// EVENT ARCHIVE — full per-fight snapshot for archive view
// ============================================================

export function buildEventArchiveEntry(
  state: GameState,
  num: number,
  name: string,
  city: string,
  date: string,
  fights: EventFight[],
  headline: string | null = null
): EventArchiveEntry {
  const champions: Partial<Record<Division, string>> = {};
  for (const div of DIVISION_KEYS) {
    const c = getChampion(state, div);
    if (c) champions[div] = fullName(c);
  }

  // Top fight of the night
  let topRating = 0;
  let topFightSummary: string | null = null;
  if (fights.length > 0) {
    const top = [...fights].sort((a, b) => b.result.rating - a.result.rating)[0];
    topRating = top.result.rating;
    const winner = top.result.winnerId === top.fA.id ? top.fA : top.fB;
    const loser = top.result.winnerId === top.fA.id ? top.fB : top.fA;
    const methodStr = top.result.method === 'DEC'
      ? `DEC`
      : `${top.result.method} R${top.result.round}`;
    topFightSummary = `${fullName(winner)} def. ${fullName(loser)} (${methodStr}) — ${topRating.toFixed(2)}`;
  }

  // Compact per-fight snapshot
  const archivedFights = fights.map((f) => ({
    fAId: f.fA.id,
    fAName: fullName(f.fA),
    fBId: f.fB.id,
    fBName: fullName(f.fB),
    winnerId: f.result.winnerId,
    loserId: f.result.winnerId === f.fA.id ? f.fB.id : f.fA.id,
    method: f.result.method,
    round: f.result.round,
    duration: f.result.duration,
    rating: f.result.rating,
    isTitleFight: f.isTitleFight,
    isMainEvent: f.isMainEvent,
    division: f.division,
    priorMeetings: f.priorMeetings,
  }));

  const titleFightCount = fights.filter((f) => f.isTitleFight).length;

  return {
    num,
    name,
    city,
    date,
    champions,
    topRating,
    topFightSummary,
    fightCount: fights.length,
    titleFightCount,
    headline,
    fights: archivedFights,
  };
}
