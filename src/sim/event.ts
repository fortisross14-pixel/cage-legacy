import type {
  Division,
  EventData,
  EventFight,
  GameState,
} from '@/types';
import { CITIES, DIVISION_KEYS, DIVISIONS, EVENT_PREFIXES } from '@/data';
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
import { pick, randInt } from './random';

const ROSTER_PER_DIVISION = 24;
const AGE_EVERY_N_EVENTS = 8;

// ============================================================
// EVENT EXECUTION
// ============================================================

export function runEvent(state: GameState): EventData {
  state.eventCount++;
  const num = state.eventCount;

  // === INJURY COUNTDOWN ===
  // Decrement everyone's injury timer at the START of the event.
  for (const f of state.fighters) {
    if (f.injured > 0) f.injured = Math.max(0, f.injured - 1);
  }

  const eventName = `CL ${num}: ${pick(EVENT_PREFIXES)}`;
  const city = pick(CITIES);
  const date = computeDate(num);
  const eventInfo = { num, name: eventName };

  // Build card (rivalry- + injury-aware)
  const card = buildEventCard(state);

  // === PRE-EVENT RANDOM EVENTS: injuries / pullouts ===
  rollPreEventInjury(state, card, num);

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

    // Fame + rivalry + best-fights AFTER title handling (so champion status is final)
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

    // === POST-FIGHT RANDOM EVENTS ===
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

  // Headline picks the highest-rated fight as the story
  const headline = generateHeadline(fights, state);

  // === ROSTER-TICK RANDOM EVENTS: title strips, comebacks ===
  rollRosterTickEvents(state, num);

  // Periodic aging
  if (num % AGE_EVERY_N_EVENTS === 0) {
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

  // Replenish
  replenishRoster(state);

  // Archive (now includes per-fight snapshot + headline)
  const archiveEntry = buildEventArchiveEntry(state, num, eventName, city, date, fights, headline);
  state.eventArchive.push(archiveEntry);
  if (state.eventArchive.length > 200) state.eventArchive.shift();

  const eventData: EventData = { num, name: eventName, city, date, fights, headline };
  state.lastEvent = eventData;
  return eventData;
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

function computeDate(eventNum: number): string {
  const date = new Date(2025, 0, 1);
  date.setDate(date.getDate() + eventNum * 21);
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
