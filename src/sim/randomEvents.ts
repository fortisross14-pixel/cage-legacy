/**
 * Random narrative events.
 *
 * Lifecycle hooks:
 *   - rollPreEventEvents(): called after card built, before fights run.
 *       May mutate the card (pull a fighter, book a replacement, scratch a fight).
 *   - rollPostFightEvents(): called per-fight, after result is applied.
 *       Emits news: hype boosts, retirements, call-outs, milestones.
 *   - rollPostEventEvents(): called once after all fights run.
 *       Tags classic fights, etc.
 *   - rollRosterTickEvents(): called during the aging tick (every N events).
 *       Title strips for inactive champs, comeback rolls for retired fighters.
 *
 * All randomness goes through random.ts so it's seeded by the same RNG as fights.
 */
import type {
  CardFight,
  EventFight,
  Fighter,
  FightOutcome,
  GameState,
} from '@/types';
import { RANDOM_EVENTS } from '@/data';
import { chance, pick, randInt } from './random';
import { fullName, overall } from './fighter';
import { addNews } from './news';
import { getChampion, calculateRankingScore } from './rankings';

// ============================================================
// PRE-EVENT: injury / pullouts
// ============================================================

export interface InjuryReport {
  /** Card index of the affected fight. */
  fightIndex: number;
  /** Was the fight scratched (true) or did we book a replacement (false)? */
  scratched: boolean;
}

/**
 * Roll for at most one injury per card. Mutates the card if necessary:
 *   - If replacement booked: swap in the replacement and update priorMeetings.
 *   - If scratched: remove the fight from the card.
 *
 * Title fights are exempt from injury (we don't want to lose marquee fights
 * to randomness — title fight buildup is the user's reward for matchmaking).
 */
export function rollPreEventInjury(
  state: GameState,
  card: CardFight[],
  eventNum: number
): InjuryReport | null {
  if (!chance(RANDOM_EVENTS.INJURY_PRE_EVENT_CHANCE)) return null;

  // Candidates: non-title fights only
  const eligibleIdxs = card
    .map((f, i) => ({ f, i }))
    .filter((x) => !x.f.isTitleFight)
    .map((x) => x.i);

  if (eligibleIdxs.length === 0) return null;

  const fightIndex = pick(eligibleIdxs);
  const cardFight = card[fightIndex];

  // Pick which of the two fighters gets injured
  const injuredId = chance(0.5) ? cardFight.fAId : cardFight.fBId;
  const otherId = injuredId === cardFight.fAId ? cardFight.fBId : cardFight.fAId;

  const injured = state.fighters.find((f) => f.id === injuredId);
  const other = state.fighters.find((f) => f.id === otherId);
  if (!injured || !other) return null;

  const sidelineEvents = randInt(
    RANDOM_EVENTS.INJURY_MIN_EVENTS,
    RANDOM_EVENTS.INJURY_MAX_EVENTS
  );
  injured.injured = sidelineEvents;

  // Replacement found?
  const usedIds = new Set<string>();
  for (const c of card) {
    usedIds.add(c.fAId);
    usedIds.add(c.fBId);
  }

  const replacementCandidates = state.fighters
    .filter(
      (f) =>
        !f.retired &&
        f.injured === 0 &&
        f.division === cardFight.division &&
        !usedIds.has(f.id) &&
        f.id !== injuredId
    )
    .map((f) => ({ f, score: calculateRankingScore(f, state.fighters) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8); // top 8 available

  if (replacementCandidates.length > 0 && chance(RANDOM_EVENTS.REPLACEMENT_FOUND_CHANCE)) {
    // Book a replacement
    const rep = pick(replacementCandidates).f;
    if (cardFight.fAId === injuredId) cardFight.fAId = rep.id;
    else cardFight.fBId = rep.id;
    // Replacement fight is rarely a rivalry (they didn't have time to develop one)
    cardFight.isRivalry = false;
    cardFight.priorMeetings = 0;

    addNews({
      state,
      eventNum,
      kind: 'injury',
      text: `${fullName(injured)} withdraws from ${eventName(eventNum)} with injury — sidelined ~${sidelineEvents} events.`,
      fighterId: injuredId,
    });
    addNews({
      state,
      eventNum,
      kind: 'replacement',
      text: `${fullName(rep)} steps in on short notice to face ${fullName(other)}.`,
      fighterId: rep.id,
      fighterBId: otherId,
    });
    return { fightIndex, scratched: false };
  }

  // Otherwise, scratch the fight
  card.splice(fightIndex, 1);
  addNews({
    state,
    eventNum,
    kind: 'injury',
    text: `${fullName(injured)} withdraws from ${eventName(eventNum)} with injury — fight scratched. Sidelined ~${sidelineEvents} events.`,
    fighterId: injuredId,
  });
  return { fightIndex, scratched: true };
}

// ============================================================
// POST-FIGHT: per-fight aftermath
// ============================================================

export interface PostFightInput {
  state: GameState;
  fA: Fighter;
  fB: Fighter;
  result: FightOutcome;
  isMainEvent: boolean;
  isTitleFight: boolean;
  eventNum: number;
}

export function rollPostFightEvents(input: PostFightInput): void {
  const { state, fA, fB, result, isTitleFight, eventNum } = input;
  const winner = result.winnerId === fA.id ? fA : fB;
  const loser = result.winnerId === fA.id ? fB : fA;

  // 1. Hype boost: epic win adds bonus fame
  if (result.rating >= RANDOM_EVENTS.HYPE_BOOST_RATING_THRESHOLD) {
    winner.fame += RANDOM_EVENTS.HYPE_BOOST_FAME;
    winner.fame = Math.round(winner.fame * 100) / 100;
    addNews({
      state,
      eventNum,
      kind: 'hype-boost',
      text: `${fullName(winner)}'s stock is rising — that ${result.rating.toFixed(2)}-rated war over ${fullName(loser)} has the cage world buzzing.`,
      fighterId: winner.id,
      fighterBId: loser.id,
    });
  }

  // 2. Classic fight (rating 9.0+)
  if (result.rating >= 9.0) {
    addNews({
      state,
      eventNum,
      kind: 'fight-classic',
      text: `Instant classic — ${fullName(winner)} vs ${fullName(loser)} (${result.rating.toFixed(2)}) goes straight into the all-time best.`,
      fighterId: winner.id,
      fighterBId: loser.id,
    });
  }

  // 3. Retirement after brutal loss (only old fighters, only on KO loss, not in title fights — let the loser have dignity in title fights)
  if (
    !isTitleFight &&
    result.method === 'KO' &&
    loser.age >= RANDOM_EVENTS.RETIREMENT_AFTER_KO_LOSS_AGE &&
    chance(RANDOM_EVENTS.RETIREMENT_AFTER_KO_LOSS_CHANCE)
  ) {
    loser.retired = true;
    loser.retirementReason = `Retired after KO loss at age ${loser.age}`;
    loser.retiredAtEvent = eventNum;
    if (loser.isChampion) loser.isChampion = false;
    addNews({
      state,
      eventNum,
      kind: 'retirement',
      text: `${fullName(loser)} announces retirement (${loser.wins}-${loser.losses}) following tonight's KO defeat.`,
      fighterId: loser.id,
    });
  }

  // 4. Milestones — career wins
  if (RANDOM_EVENTS.MILESTONE_WINS.includes(winner.wins as never)) {
    addNews({
      state,
      eventNum,
      kind: 'milestone',
      text: `${fullName(winner)} notches career win #${winner.wins} (${winner.wins}-${winner.losses}).`,
      fighterId: winner.id,
    });
  }

  // 5. Milestones — title defenses (only fires on the actual defense win)
  if (isTitleFight && result.winnerId === winner.id && winner.isChampion) {
    if (RANDOM_EVENTS.MILESTONE_DEFENSES.includes(winner.titleDefenses as never)) {
      addNews({
        state,
        eventNum,
        kind: 'milestone',
        text: `${fullName(winner)} successfully defends the title for the ${ordinal(winner.titleDefenses)} time.`,
        fighterId: winner.id,
      });
    }
  }

  // 6. Post-fight call-out (sets the table for future rivalry-aware matchmaking)
  if (
    !isTitleFight &&
    result.rating >= RANDOM_EVENTS.CALL_OUT_RATING_THRESHOLD &&
    !winner.isChampion &&
    chance(RANDOM_EVENTS.CALL_OUT_CHANCE)
  ) {
    const champ = getChampion(state, winner.division);
    if (champ && champ.id !== winner.id) {
      addNews({
        state,
        eventNum,
        kind: 'call-out',
        text: `${fullName(winner)} calls out champion ${fullName(champ)} in the post-fight interview.`,
        fighterId: winner.id,
        fighterBId: champ.id,
      });
    }
  }
}

// ============================================================
// ROSTER-TICK: title strips, comebacks
// ============================================================

export function rollRosterTickEvents(state: GameState, eventNum: number): void {
  // 1. Title strip for inactive champions (haven't fought in too long)
  for (const f of state.fighters) {
    if (
      f.isChampion &&
      !f.retired &&
      f.inactive >= RANDOM_EVENTS.TITLE_STRIP_INACTIVE_EVENTS
    ) {
      const reign = state.titleHistory.find(
        (r) => r.fighterId === f.id && r.division === f.division && !r.endEvent
      );
      f.isChampion = false;
      if (reign) {
        reign.endEvent = eventNum;
        reign.endEventName = '(stripped — inactivity)';
        reign.lostTo = '— (stripped)';
      }
      addNews({
        state,
        eventNum,
        kind: 'title-strip',
        text: `${fullName(f)} is stripped of the title due to inactivity (${f.inactive} events).`,
        fighterId: f.id,
      });
    }
  }

  // 2. Comeback rolls: retired (non-HOF) fighters in the comeback age window
  const comebackCandidates = state.fighters.filter(
    (f) =>
      f.retired &&
      !f.hallOfFame &&
      f.age >= RANDOM_EVENTS.COMEBACK_MIN_AGE &&
      f.age <= RANDOM_EVENTS.COMEBACK_MAX_AGE
  );
  for (const f of comebackCandidates) {
    if (chance(RANDOM_EVENTS.COMEBACK_BASE_CHANCE)) {
      f.retired = false;
      f.retirementReason = null;
      f.retiredAtEvent = null;
      f.inactive = 0;
      addNews({
        state,
        eventNum,
        kind: 'comeback',
        text: `${fullName(f)} announces a return to the cage at age ${f.age}.`,
        fighterId: f.id,
      });
    }
  }
}

// ============================================================
// HELPERS
// ============================================================

function eventName(num: number): string {
  return `CL ${num}`;
}

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

// Re-export for potential future use without unused-import warnings:
export const _internal = { overall };
