import type {
  CardFight,
  Division,
  EventArchiveEntry,
  Fighter,
  FightOutcome,
  GameState,
  TitleReign,
} from '@/types';
import { DIVISION_KEYS } from '@/data';
import { fullName, overall } from './fighter';
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

  // Reign numbering is per-division
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
// MATCHMAKING — PER DIVISION
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

  // For each division, build matchups: main event (potentially title), plus undercard
  // We rotate which division gets the "headlining" title fight slot per event
  // by picking the division most "due" for a title fight.
  const eventNum = state.eventCount + 1;

  // Determine main-event division: rotate, but only if that division has a champ + contender
  const mainDivision = chooseMainDivision(state, eventNum);

  // Build per-division
  for (const division of DIVISION_KEYS) {
    const champ = getChampion(state, division);
    const ranked = getDivisionRankings(state, division).filter(
      (f) => !champ || f.id !== champ.id
    );

    let divFightsTarget = opts.targetFightsPerDivision;
    let mainEventBuilt = false;

    // ---- Main event for this division (title fight if main division, else high-ranked) ----
    if (division === mainDivision) {
      if (champ && ranked.length > 0) {
        const recentChampOpps = new Set(champ.fightLog.slice(-3).map((l) => l.oppId));
        const contender = ranked.find((f) => !recentChampOpps.has(f.id)) ?? ranked[0];
        card.push({
          fAId: champ.id,
          fBId: contender.id,
          isTitleFight: true,
          isMainEvent: true,
          division,
        });
        used.add(champ.id);
        used.add(contender.id);
        mainEventBuilt = true;
      } else if (!champ && ranked.length >= 2) {
        // Vacant title
        card.push({
          fAId: ranked[0].id,
          fBId: ranked[1].id,
          isTitleFight: true,
          isMainEvent: true,
          division,
        });
        used.add(ranked[0].id);
        used.add(ranked[1].id);
        mainEventBuilt = true;
      }
    }

    // Undercard: pair similar-tier fighters in this division
    const available = state.fighters.filter(
      (f) => !f.retired && f.division === division && !used.has(f.id)
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
      let oppIdx = scored.findIndex((s) => !recentOpps.has(s.f.id));
      if (oppIdx === -1) oppIdx = 0;
      if (oppIdx + 1 < scored.length && chance(0.3)) {
        oppIdx = Math.min(scored.length - 1, oppIdx + randInt(0, 2));
      }
      const opp = scored.splice(oppIdx, 1)[0];

      card.push({
        fAId: top.f.id,
        fBId: opp.f.id,
        isTitleFight: false,
        isMainEvent: !mainEventBuilt && added === 0, // first non-main division: highlight a fight
        division,
      });
      used.add(top.f.id);
      used.add(opp.f.id);
      added++;
    }
  }

  // Mark inactivity for fighters not used
  for (const f of state.fighters) {
    if (!f.retired && !used.has(f.id)) f.inactive++;
  }

  // Sort card so main event appears first, then by division order, then title fights first
  card.sort((a, b) => {
    if (a.isMainEvent && !b.isMainEvent) return -1;
    if (!a.isMainEvent && b.isMainEvent) return 1;
    if (a.isTitleFight && !b.isTitleFight) return -1;
    if (!a.isTitleFight && b.isTitleFight) return 1;
    return DIVISION_KEYS.indexOf(a.division) - DIVISION_KEYS.indexOf(b.division);
  });

  return card;
}

// Pick which division gets the main event (rotate, biased toward divisions with a champ + contender)
function chooseMainDivision(state: GameState, eventNum: number): Division {
  // Rotate through divisions
  const rotation = DIVISION_KEYS[(eventNum - 1) % DIVISION_KEYS.length];

  // If the rotation division can support a title fight, use it
  const champ = getChampion(state, rotation);
  const ranked = getDivisionRankings(state, rotation).filter((f) => !champ || f.id !== champ.id);
  if ((champ && ranked.length > 0) || ranked.length >= 2) return rotation;

  // Otherwise fall back: pick any division that can support a title fight
  for (const div of DIVISION_KEYS) {
    const c = getChampion(state, div);
    const r = getDivisionRankings(state, div).filter((f) => !c || f.id !== c.id);
    if ((c && r.length > 0) || r.length >= 2) return div;
  }
  return rotation;
}

// ============================================================
// EVENT ARCHIVE
// ============================================================

export function buildEventArchiveEntry(
  state: GameState,
  num: number,
  name: string,
  city: string,
  date: string
): EventArchiveEntry {
  const champions: Partial<Record<Division, string>> = {};
  for (const div of DIVISION_KEYS) {
    const c = getChampion(state, div);
    if (c) champions[div] = fullName(c);
  }
  return { num, name, city, date, champions };
}
