import type {
  CardFight,
  Division,
  EventData,
  EventFight,
  Fighter,
  GameState,
} from '@/types';
import { CITIES, DIVISION_KEYS, DIVISIONS, EVENT_PREFIXES } from '@/data';
import { ageFighter, evaluateHallOfFame, fullName, generateFighter } from './fighter';
import { applyResult, simulateFight } from './fight';
import {
  buildEventArchiveEntry,
  buildEventCard,
  getChampion,
  handleChampionRetirements,
  handleTitleResult,
} from './rankings';
import { pick, randInt } from './random';

const ROSTER_PER_DIVISION = 24;
const AGE_EVERY_N_EVENTS = 8;

// ============================================================
// EVENT EXECUTION
// ============================================================

export function runEvent(state: GameState): EventData {
  state.eventCount++;
  const num = state.eventCount;

  const eventName = `CL ${num}: ${pick(EVENT_PREFIXES)}`;
  const city = pick(CITIES);
  const date = computeDate(num);
  const eventInfo = { num, name: eventName };

  // Build card
  const card = buildEventCard(state);

  // Hydrate fights with full fighter refs and run them
  const fights: EventFight[] = card.map((cardFight) => {
    const fA = state.fighters.find((f) => f.id === cardFight.fAId)!;
    const fB = state.fighters.find((f) => f.id === cardFight.fBId)!;
    const result = simulateFight(fA, fB, {
      isTitleFight: cardFight.isTitleFight,
      isMainEvent: cardFight.isMainEvent,
    });
    applyResult(fA, fB, result, eventInfo);
    if (cardFight.isTitleFight) {
      handleTitleResult({
        state,
        fightFighters: { fA, fB },
        result,
        eventInfo,
        division: cardFight.division,
      });
    }
    return { fA, fB, isTitleFight: cardFight.isTitleFight, isMainEvent: cardFight.isMainEvent, division: cardFight.division, result };
  });

  // Headline
  const headline = generateHeadline(fights, state);

  // Age fighters periodically
  if (num % AGE_EVERY_N_EVENTS === 0) {
    state.fighters.forEach((f) => {
      if (!f.retired) ageFighter(f, num);
    });
    // After aging, some fighters may have retired
    handleChampionRetirements(state);
    state.fighters.forEach((f) => {
      if (f.retired && !f.hallOfFame && evaluateHallOfFame(f)) {
        f.hallOfFame = true;
      }
    });
  }

  // Replenish each division roster
  replenishRoster(state);

  // Archive
  const archiveEntry = buildEventArchiveEntry(state, num, eventName, city, date);
  state.eventArchive.push(archiveEntry);
  if (state.eventArchive.length > 200) state.eventArchive.shift();

  const eventData: EventData = { num, name: eventName, city, date, fights, headline };
  state.lastEvent = eventData;
  return eventData;
}

// ============================================================
// ROSTER REPLENISHMENT — per division
// ============================================================

export function seedInitialRoster(state: GameState): void {
  state.fighters = [];
  for (const division of DIVISION_KEYS) {
    for (let i = 0; i < ROSTER_PER_DIVISION; i++) {
      state.fighters.push(generateFighter({ division }));
    }
    // Guarantee at least one epic+ per division so a champ emerges quickly
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
// DATE COMPUTATION
// ============================================================

function computeDate(eventNum: number): string {
  // Universe starts Jan 1 2025, events roughly every 3 weeks
  const date = new Date(2025, 0, 1);
  date.setDate(date.getDate() + eventNum * 21);
  return date.toISOString();
}

// ============================================================
// HEADLINE GENERATION
// ============================================================

function generateHeadline(fights: EventFight[], state: GameState): string | null {
  // Prefer a title fight headline
  const titleFight = fights.find((f) => f.isTitleFight) ?? fights[0];
  if (!titleFight) return null;

  const winner = titleFight.result.winnerId === titleFight.fA.id ? titleFight.fA : titleFight.fB;
  const loser = titleFight.result.winnerId === titleFight.fA.id ? titleFight.fB : titleFight.fA;
  const divLabel = DIVISIONS[titleFight.division].label;
  const methodLabel = methodHeadline(titleFight.result.method);

  if (titleFight.isTitleFight) {
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

  // Non-title interesting storyline
  if (winner.currentStreak >= 5) {
    return `${fullName(winner)} wins his ${winner.currentStreak}th in a row at ${divLabel} — title contention beckons.`;
  }
  if (titleFight.result.method === 'KO' && titleFight.result.round === 1) {
    return `Stunning first-round KO: ${fullName(winner)} ends it early on ${fullName(loser)}.`;
  }
  return `${fullName(winner)} defeats ${fullName(loser)} in the ${divLabel} main event.`;
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
