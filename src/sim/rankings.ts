import type {
  CardFight,
  Division,
  EventArchiveEntry,
  EventFight,
  EventKind,
  Fighter,
  FightOutcome,
  GameState,
  TitleReign,
} from '@/types';
import { CADENCE, DIVISION_KEYS, MATCHMAKING } from '@/data';
import { fullName, overall } from './fighter';
import { priorMeetingsCount } from './rivalry';
import { chance, randInt } from './random';

// ============================================================
// RANKING SCORE
// ============================================================

/**
 * Ranking score — overall skill is the dominant signal, with results and
 * recent momentum as modifiers. Title status and quality wins compound on top.
 *
 * The math is intentionally weighted so a 15-3 veteran with overall 88 will
 * outrank a 4-0 newcomer with overall 72. A 2-2 fighter cannot title-shot.
 */
export function calculateRankingScore(fighter: Fighter, allFighters: Fighter[]): number {
  if (fighter.retired) return -9999;

  const o = overall(fighter); // 0-99
  let score = 0;

  // Skill base: overall skill is the floor of where this fighter ranks.
  // An 85-overall fighter starts at 85*4 = 340; a 65-overall starts at 260.
  score += o * 4;

  // Win/loss ratio modifier (career record matters but is dampened):
  const totalFights = fighter.wins + fighter.losses;
  if (totalFights >= 3) {
    const winRate = fighter.wins / totalFights;
    // win rate 0.5 = neutral, 1.0 = +60, 0.0 = -60
    score += (winRate - 0.5) * 120;
    // Volume bonus: deeper careers get small credit (cap at 25)
    score += Math.min(25, totalFights * 0.8);
  } else {
    // Penalty for tiny sample sizes: untested fighters can't leapfrog veterans
    score -= 40;
  }

  // Recent momentum
  if (fighter.currentStreak > 0) score += Math.min(40, fighter.currentStreak * 6);
  if (fighter.currentStreak < 0) score += Math.max(-30, fighter.currentStreak * 5);

  // Title weight
  if (fighter.isChampion) score += 60;
  score += fighter.titleDefenses * 8;
  score += fighter.titleReigns * 12;

  // Inactivity decay (subtle)
  score -= fighter.inactive * 6;

  // Quality of last-10 wins: caps how much beating-up-on-cans helps
  const recentWins = fighter.fightLog.slice(-10).filter((l) => l.result === 'W');
  for (const win of recentWins) {
    const opp = allFighters.find((f) => f.id === win.oppId);
    if (opp) score += Math.max(0, (overall(opp) - 70) / 2.5);
  }

  // Fame contribution — being a known commodity matters
  score += fighter.fame / 4;

  return score;
}

/**
 * Title-shot eligibility: a fighter must have a real résumé before competing for gold.
 * Used both for the vacant-belt matchup and the champion's contender selection.
 */
export function isTitleShotEligible(fighter: Fighter): boolean {
  if (fighter.retired) return false;
  if (fighter.injured > 0) return false;
  // Need at least 5 career fights with a winning record OR be already top of overall
  const totalFights = fighter.wins + fighter.losses;
  if (totalFights < 5) return false;
  const winRate = fighter.wins / Math.max(1, totalFights);
  if (winRate < 0.55) return false;
  // Recent: must have won at least 2 of last 4
  const recent = fighter.fightLog.slice(-4);
  const recentW = recent.filter((l) => l.result === 'W').length;
  if (recent.length >= 4 && recentW < 2) return false;
  return true;
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

/**
 * Returns the rank label for a fighter in their division:
 *   "C"     — current champion
 *   "1".."N" — ranked challenger (1 = top contender)
 *   null    — outside the top 15 / unranked
 *
 * The displayed top contenders cap at 15 to keep the UI badge meaningful.
 */
export function getRankLabel(state: GameState, fighter: Fighter, maxRanked = 15): string | null {
  if (fighter.retired) return null;
  if (fighter.isChampion) return 'C';
  const ranked = getDivisionRankings(state, fighter.division);
  const champ = getChampion(state, fighter.division);
  const contenders = ranked.filter((f) => !champ || f.id !== champ.id);
  const idx = contenders.findIndex((f) => f.id === fighter.id);
  if (idx === -1 || idx >= maxRanked) return null;
  return String(idx + 1);
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
// MATCHMAKING — PER DIVISION (rivalry-aware + injury-aware + kind-aware)
// ============================================================

export interface BuildCardOptions {
  kind: EventKind;
}

export function buildEventCard(
  state: GameState,
  opts: BuildCardOptions = { kind: 'main' }
): CardFight[] {
  const { kind } = opts;
  const isMainEventKind = kind === 'main';

  const card: CardFight[] = [];
  const used = new Set<string>();
  const eventNum = state.eventCount + 1;

  // Identify divisions overdue: been more than DIVISION_MAX_GAP_EVENTS without a fight.
  const overdueDivisions = new Set<Division>();
  for (const div of DIVISION_KEYS) {
    const last = state.divisionLastFightEvent[div] ?? 0;
    if (eventNum - last >= CADENCE.DIVISION_MAX_GAP_EVENTS) overdueDivisions.add(div);
  }

  // ──────────────────────────────────────────────────────────────
  // MAIN EVENT cards: title fights + one main event slot + undercard.
  // ALTERNATE cards: no titles, no main event flag; pick fights across
  // divisions weighting toward overdue ones.
  // ──────────────────────────────────────────────────────────────
  if (isMainEventKind) {
    // Pick the main division (its title fight headlines the card).
    const mainDivision = chooseMainDivision(state, eventNum);

    // Possibly book a second title fight in another division.
    const secondTitleDivision = pickSecondTitleDivision(state, mainDivision);

    for (const division of DIVISION_KEYS) {
      const isThisMainDiv = division === mainDivision;
      const isThisSecondTitleDiv = secondTitleDivision === division;
      const wantTitleHere = isThisMainDiv || isThisSecondTitleDiv;

      let mainEventBuilt = false;
      if (wantTitleHere) {
        const champ = getChampion(state, division);
        const eligibleContenders = getDivisionRankings(state, division).filter(
          (f) => (!champ || f.id !== champ.id) && isTitleShotEligible(f)
        );

        if (champ && !isUnavailable(champ)) {
          // Champion is available — find a contender (prefer eligible, fall back to top by score)
          const recentChampOpps = new Set(champ.fightLog.slice(-3).map((l) => l.oppId));
          let contender = eligibleContenders.find((f) => !recentChampOpps.has(f.id))
            ?? eligibleContenders[0];
          if (!contender) {
            // No eligible contender — relax to top non-injured non-recent
            const all = getDivisionRankings(state, division).filter(
              (f) => f.id !== champ.id && !isUnavailable(f) && !recentChampOpps.has(f.id)
            );
            contender = all[0];
          }
          if (contender) {
            card.push(makeCardFight(state, champ, contender, true, isThisMainDiv, division));
            used.add(champ.id);
            used.add(contender.id);
            mainEventBuilt = true;
          }
        } else if (!champ) {
          // Vacant belt — prefer top 2 eligible, fall back to top 2 by score
          let a = eligibleContenders[0];
          let b = eligibleContenders[1];
          if (!a || !b) {
            const all = getDivisionRankings(state, division).filter((f) => !isUnavailable(f));
            a = a ?? all[0];
            b = b ?? all.find((f) => f.id !== a?.id) ?? all[1];
          }
          if (a && b && a.id !== b.id) {
            card.push(makeCardFight(state, a, b, true, isThisMainDiv, division));
            used.add(a.id);
            used.add(b.id);
            mainEventBuilt = true;
          }
        }
      }

      // Undercard for this division: 2 fights total per division on main cards
      const undercardTarget = 2 - (mainEventBuilt ? 1 : 0);
      addUndercardFights(state, division, undercardTarget, card, used, eventNum, false);
    }
  } else {
    // ────────────── ALTERNATE EVENT ──────────────
    // No title fights. Distribute ~5 fights across divisions weighted toward overdue.
    // Each division gets 1 fight base; overdue divisions get priority for extras.
    const target = CADENCE.ALTERNATE_FIGHT_TARGET;

    // Order divisions: overdue first, then by event-gap descending, then default order.
    const divisionsByPriority: Division[] = [...DIVISION_KEYS].sort((a, b) => {
      const gapA = eventNum - (state.divisionLastFightEvent[a] ?? 0);
      const gapB = eventNum - (state.divisionLastFightEvent[b] ?? 0);
      return gapB - gapA;
    });

    // First pass: give each priority division 1 fight.
    for (const division of divisionsByPriority) {
      if (card.length >= target) break;
      addUndercardFights(state, division, 1, card, used, eventNum, false);
    }

    // Second pass: top up with extra fights for the most overdue/active divisions.
    let pass = 0;
    while (card.length < target && pass < divisionsByPriority.length) {
      addUndercardFights(state, divisionsByPriority[pass], 1, card, used, eventNum, false);
      pass++;
    }
  }

  // Tag inactivity (only for fighters not in this card and not injured)
  for (const f of state.fighters) {
    if (!f.retired && !used.has(f.id) && f.injured === 0) f.inactive++;
  }

  // Bump last-fight tracker per division for everyone IN the card
  const divsOnCard = new Set(card.map((c) => c.division));
  for (const div of divsOnCard) {
    state.divisionLastFightEvent[div] = eventNum;
  }
  // Also: forced overdue divisions that ended up empty — log a "skipped" mark anyway?
  // No — only mark divisions that actually fought.

  // Sort: main event first, then title fights, then division order
  card.sort((a, b) => {
    if (a.isMainEvent && !b.isMainEvent) return -1;
    if (!a.isMainEvent && b.isMainEvent) return 1;
    if (a.isTitleFight && !b.isTitleFight) return -1;
    if (!a.isTitleFight && b.isTitleFight) return 1;
    return DIVISION_KEYS.indexOf(a.division) - DIVISION_KEYS.indexOf(b.division);
  });

  // Suppress unused-warning on overdueDivisions: it's currently used implicitly via
  // the divisionsByPriority sort. Keep the variable for future explicit weighting.
  void overdueDivisions;

  return card;
}

/**
 * Add up to `target` fights for `division`, respecting `used` set.
 * Marks the first added fight as main event only if `firstIsMainEvent` is true.
 */
function addUndercardFights(
  state: GameState,
  division: Division,
  target: number,
  card: CardFight[],
  used: Set<string>,
  eventNum: number,
  firstIsMainEvent: boolean
): void {
  if (target <= 0) return;
  const available = state.fighters.filter(
    (f) =>
      !f.retired && !isUnavailable(f) && f.division === division && !used.has(f.id)
  );
  const scored = available.map((f) => ({
    f,
    score: calculateRankingScore(f, state.fighters),
  }));
  scored.sort((a, b) => b.score - a.score);

  let added = 0;
  while (added < target && scored.length >= 2) {
    const top = scored.shift()!;
    const recentOpps = new Set(top.f.fightLog.slice(-2).map((l) => l.oppId));

    let oppIdx = findRematchCandidate(state, top.f, scored, recentOpps, eventNum);
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
        firstIsMainEvent && added === 0,
        division
      )
    );
    used.add(top.f.id);
    used.add(opp.f.id);
    added++;
  }
}

/**
 * 30% chance another division also gets a title fight on a main card,
 * provided its champion is available.
 */
function pickSecondTitleDivision(state: GameState, mainDiv: Division): Division | null {
  if (!chance(CADENCE.MAIN_SECOND_TITLE_CHANCE)) return null;
  const others = DIVISION_KEYS.filter((d) => d !== mainDiv);
  for (const d of others.sort(() => Math.random() - 0.5)) {
    const champ = getChampion(state, d);
    if (champ && !isUnavailable(champ)) {
      const ranked = getDivisionRankings(state, d).filter((f) => f.id !== champ.id && !isUnavailable(f));
      if (ranked.length > 0) return d;
    }
  }
  return null;
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
  kindNum: number,
  kind: EventKind,
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
    kindNum,
    kind,
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
