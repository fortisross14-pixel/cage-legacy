import type {
  CardFight,
  Division,
  EventData,
  EventFight,
  EventKind,
  GameState,
  PreparedEvent,
} from '@/types';
import {
  CADENCE,
  CITIES,
  DIVISION_KEYS,
  DIVISIONS,
  EVENT_PREFIXES_MAIN,
  EVENT_PREFIXES_ALT,
} from '@/data';
import { ageFighter, evaluateHallOfFame, fullName, generateFighter } from './fighter';
import { applyResult, applyPostFightEffects, simulateFight } from './fight';
import {
  buildEventArchiveEntry,
  buildEventCard,
  getChampion,
  handleChampionRetirements,
  handleTitleResult,
} from './rankings';
import { applyAgeFameDecay } from './fame';
import { priorMeetingsCount } from './rivalry';
import {
  rollPreEventInjury,
  rollPostFightEvents,
  rollRosterTickEvents,
} from './randomEvents';
import { EVENTS_PER_YEAR, runYearEndTurnover } from './yearEnd';
import { pick, randInt } from './random';

const ROSTER_PER_DIVISION = 24;
const AGE_EVERY_N_EVENTS = 8;

// ============================================================
// EVENT EXECUTION — split into prepare + execute for the
// preview→reveal UX. `runEvent` calls both back-to-back.
// ============================================================

/** What kind is the *next* event going to be, based on the rotation pattern? */
function nextEventKind(state: GameState): EventKind {
  const idx = state.eventCount % CADENCE.KIND_PATTERN.length;
  return CADENCE.KIND_PATTERN[idx];
}

/**
 * Prepare the next event: increment counter, tick injuries, build the card,
 * roll pre-event injuries. Returns the prepared card without running fights.
 *
 * The state IS mutated (eventCount++, injuries countdown/rolled). The card
 * returned is what will be executed.
 */
export function prepareNextEvent(state: GameState): PreparedEvent {
  // Determine kind BEFORE we bump eventCount (so we look at the current rotation).
  const kind = nextEventKind(state);

  state.eventCount++;
  const num = state.eventCount;

  // Increment the per-kind counter and name accordingly
  let kindNum: number;
  let name: string;
  if (kind === 'main') {
    state.mainEventCount++;
    kindNum = state.mainEventCount;
    name = `CL ${kindNum}: ${pick(EVENT_PREFIXES_MAIN)}`;
  } else {
    state.alternateEventCount++;
    kindNum = state.alternateEventCount;
    name = `Cage Night ${kindNum}: ${pick(EVENT_PREFIXES_ALT)}`;
  }

  // Injury countdown at start of event
  for (const f of state.fighters) {
    if (f.injured > 0) f.injured = Math.max(0, f.injured - 1);
  }

  const city = pick(CITIES);
  const date = computeDate(num);

  const card = buildEventCard(state, { kind });
  rollPreEventInjury(state, card, num);

  return { num, kindNum, kind, name, city, date, card };
}

/**
 * Execute the prepared event: run fights, apply results / fame / rivalry /
 * news / aging / archive. Returns the full EventData.
 */
export function executeEvent(state: GameState, prepared: PreparedEvent): EventData {
  const { num, kindNum, kind, name, city, date, card } = prepared;
  const eventInfo = { num, name };

  // Hydrate fights and run them
  const fights: EventFight[] = card.map((cardFight) => {
    const fA = state.fighters.find((f) => f.id === cardFight.fAId)!;
    const fB = state.fighters.find((f) => f.id === cardFight.fBId)!;
    const priorMeetings = priorMeetingsCount(state, fA.id, fB.id);

    const result = simulateFight(fA, fB, {
      isTitleFight: cardFight.isTitleFight,
      isMainEvent: cardFight.isMainEvent,
      priorMeetings,
    });

    const { winner, loser } = applyResult({
      state,
      fA,
      fB,
      result,
      isMainEvent: cardFight.isMainEvent,
      eventInfo,
    });

    if (cardFight.isTitleFight) {
      handleTitleResult({
        state,
        fightFighters: { fA, fB },
        result,
        eventInfo,
        division: cardFight.division,
      });
    }

    applyPostFightEffects({
      state,
      winner,
      loser,
      fA,
      fB,
      result,
      isMainEvent: cardFight.isMainEvent,
      eventInfo,
      division: cardFight.division,
    });

    rollPostFightEvents({
      state,
      fA,
      fB,
      result,
      isMainEvent: cardFight.isMainEvent,
      isTitleFight: cardFight.isTitleFight,
      eventNum: num,
    });

    return {
      fA,
      fB,
      isTitleFight: cardFight.isTitleFight,
      isMainEvent: cardFight.isMainEvent,
      division: cardFight.division,
      isRivalry: cardFight.isRivalry,
      priorMeetings,
      result,
    };
  });

  const headline = generateHeadline(fights, state);

  rollRosterTickEvents(state, num);

  // Periodic aging (now based on main-event count, not raw event count, so
  // fighters age at roughly the same calendar pace as before).
  if (state.mainEventCount % AGE_EVERY_N_EVENTS === 0 && kind === 'main') {
    state.fighters.forEach((f) => {
      if (!f.retired) {
        ageFighter(f, num);
        applyAgeFameDecay(f, DIVISIONS[f.division].primeMax);
      }
    });
    handleChampionRetirements(state);
    state.fighters.forEach((f) => {
      if (f.retired && !f.hallOfFame && evaluateHallOfFame(f)) {
        f.hallOfFame = true;
      }
    });
  }

  // Year-end roster turnover: every EVENTS_PER_YEAR events, drop worst-2
  // per division and sign a veteran + a prospect.
  if (num > 0 && num % EVENTS_PER_YEAR === 0) {
    runYearEndTurnover(state, num);
  }

  replenishRoster(state);

  const archiveEntry = buildEventArchiveEntry(state, num, kindNum, kind, name, city, date, fights, headline);
  state.eventArchive.push(archiveEntry);
  if (state.eventArchive.length > 500) state.eventArchive.shift();

  const eventData: EventData = { num, kindNum, kind, name, city, date, fights, headline };
  state.lastEvent = eventData;
  return eventData;
}

/**
 * Convenience: prepare + execute back-to-back. Used by tests / direct sim.
 */
export function runEvent(state: GameState): EventData {
  const prepared = prepareNextEvent(state);
  return executeEvent(state, prepared);
}

// ============================================================
// ROSTER
// ============================================================

export function seedInitialRoster(state: GameState): void {
  state.fighters = [];
  for (const division of DIVISION_KEYS) {
    for (let i = 0; i < ROSTER_PER_DIVISION; i++) {
      state.fighters.push(generateFighter({ division }));
    }
    const elites = state.fighters.filter(
      (f) => f.division === division && (f.rarity === 'epic' || f.rarity === 'legendary')
    );
    if (elites.length < 1) {
      state.fighters.push(
        generateFighter({
          division,
          rarity: 'epic',
          age: randInt(DIVISIONS[division].primeMin, DIVISIONS[division].primeMin + 3),
        })
      );
    }
  }
}

function replenishRoster(state: GameState): void {
  for (const division of DIVISION_KEYS) {
    const active = state.fighters.filter((f) => !f.retired && f.division === division).length;
    const deficit = ROSTER_PER_DIVISION - active;
    if (deficit > 0) {
      const divCfg = DIVISIONS[division];
      for (let i = 0; i < deficit; i++) {
        state.fighters.push(
          generateFighter({
            division,
            age: randInt(Math.max(19, divCfg.prospectMax - 4), divCfg.prospectMax),
          })
        );
      }
    }
  }
}

// ============================================================
// DATE
// ============================================================

export function computeDate(eventNum: number): string {
  const date = new Date(2025, 0, 1);
  date.setDate(date.getDate() + eventNum * CADENCE.DAYS_BETWEEN_EVENTS);
  return date.toISOString();
}

// ============================================================
// HEADLINE GENERATION — now rating-aware
// ============================================================

function generateHeadline(fights: EventFight[], state: GameState): string | null {
  if (fights.length === 0) return null;

  // Prefer (1) title fight, (2) highest-rated fight if rating >= 7.0
  const titleFight = fights.find((f) => f.isTitleFight);
  const topRated = [...fights].sort((a, b) => b.result.rating - a.result.rating)[0];

  // Trilogy / rivalry headline takes priority if rating is high
  if (topRated && topRated.priorMeetings >= 1 && topRated.result.rating >= 7.0) {
    return rivalryHeadline(topRated);
  }

  // Otherwise: title fight if present
  const focus = titleFight ?? topRated;
  if (!focus) return null;

  const winner = focus.result.winnerId === focus.fA.id ? focus.fA : focus.fB;
  const loser = focus.result.winnerId === focus.fA.id ? focus.fB : focus.fA;
  const divLabel = DIVISIONS[focus.division].label;
  const methodLabel = methodHeadline(focus.result.method);

  if (focus.isTitleFight) {
    const wasChamp =
      loser.titleReigns > 0 &&
      state.titleHistory.some(
        (r) => r.fighterId === loser.id && r.endEvent === state.eventCount
      );
    if (wasChamp) {
      return `${fullName(winner)} dethrones ${fullName(loser)} for the ${divLabel} title via ${methodLabel}.`;
    }
    if (winner.isChampion && winner.titleDefenses > 0) {
      const def = winner.titleDefenses;
      const phrasing =
        def >= 5 ? 'extends a historic title reign' : def >= 3 ? 'cements his championship run' : 'turns away another challenger';
      return `${fullName(winner)} ${phrasing} — ${divLabel} defense #${def} over ${fullName(loser)} (${methodLabel}).`;
    }
    return `${fullName(winner)} claims the vacant ${divLabel} title with a ${methodLabel} victory.`;
  }

  if (focus.result.rating >= 8.5) {
    return `Instant classic — ${fullName(winner)} downs ${fullName(loser)} in a ${focus.result.rating.toFixed(2)}-rated war.`;
  }
  if (winner.currentStreak >= 5) {
    return `${fullName(winner)} wins his ${winner.currentStreak}th in a row at ${divLabel} — title contention beckons.`;
  }
  if (focus.result.method === 'KO' && focus.result.round === 1) {
    return `Stunning first-round KO: ${fullName(winner)} ends it early on ${fullName(loser)}.`;
  }
  return `${fullName(winner)} defeats ${fullName(loser)} in the ${divLabel} main event.`;
}

function rivalryHeadline(fight: EventFight): string {
  const winner = fight.result.winnerId === fight.fA.id ? fight.fA : fight.fB;
  const loser = fight.result.winnerId === fight.fA.id ? fight.fB : fight.fA;
  const meetingNum = fight.priorMeetings + 1;
  const label =
    meetingNum === 2 ? 'in a rematch' :
    meetingNum === 3 ? 'in their trilogy bout' :
    `in their ${ordinal(meetingNum)} meeting`;
  return `${fullName(winner)} beats ${fullName(loser)} ${label} — ${fight.result.rating.toFixed(2)} rating.`;
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

function methodHeadline(method: string): string {
  switch (method) {
    case 'KO': return 'KO/TKO';
    case 'SUB': return 'submission';
    case 'DEC': return 'decision';
    case 'DOC': return 'doctor stoppage';
    default: return method;
  }
}
