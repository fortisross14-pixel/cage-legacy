/**
 * Year-end roster turnover.
 *
 * Once per game-year (every 36 events at the standard cadence), the two
 * lowest-performing active fighters per division are released, and two new
 * fighters are signed: one veteran (27-35, with an existing record) and one
 * young prospect (≤26, untested, likely to develop).
 *
 * The "worst P4P" metric used here is careerPoints (the same one driving the
 * P4P ranking), which already integrates wins, fight quality, and rating.
 */
import type { Division, Fighter, GameState, Rarity } from '@/types';
import { DIVISION_KEYS, DIVISIONS, RARITIES } from '@/data';
import { generateFighter, overall } from './fighter';
import { addNews } from './news';
import { chance, randInt } from './random';

/** Events per game-year (3 events/month × 12 months). */
export const EVENTS_PER_YEAR = 36;

export function runYearEndTurnover(state: GameState, eventNum: number): void {
  const year = Math.floor(eventNum / EVENTS_PER_YEAR);

  for (const division of DIVISION_KEYS) {
    const active = state.fighters.filter(
      (f) => !f.retired && f.division === division && !f.isChampion
    );

    // Don't release if the active roster is already thin
    if (active.length <= 8) continue;

    // Worst-2 by careerPoints (lower = worse)
    const sortedAsc = [...active].sort((a, b) => a.careerPoints - b.careerPoints);
    const releases = sortedAsc.slice(0, 2);

    for (const f of releases) {
      f.retired = true;
      f.retirementReason = `Released — year ${year} roster cuts`;
      f.retiredAtEvent = eventNum;
      addNews({
        state,
        eventNum,
        kind: 'retirement',
        text: `${f.firstName} ${f.lastName} released from the ${DIVISIONS[division].label} division in year-end roster cuts.`,
        fighterId: f.id,
      });
    }

    // Sign a veteran (27-35) — stats-first generation, rarity derived
    const veteran = generateSignedFighter(division, 'veteran');
    state.fighters.push(veteran);
    addNews({
      state,
      eventNum,
      kind: 'debut',
      text: `${DIVISIONS[division].label}: veteran signing ${veteran.firstName} ${veteran.lastName} (${veteran.country}, ${RARITIES[veteran.rarity].label}) joins the roster.`,
      fighterId: veteran.id,
    });

    // Sign a prospect (≤26, lower current overall, high potential)
    const prospect = generateSignedFighter(division, 'prospect');
    state.fighters.push(prospect);
    addNews({
      state,
      eventNum,
      kind: 'debut',
      text: `${DIVISIONS[division].label}: prospect ${prospect.firstName} ${prospect.lastName} (${prospect.country}, age ${prospect.age}) signs a multi-fight deal.`,
      fighterId: prospect.id,
    });
  }
}

/**
 * Generate a signing — stats are determined first, then rarity is assigned
 * based on where the resulting overall lands.
 */
function generateSignedFighter(division: Division, kind: 'veteran' | 'prospect'): Fighter {
  const divCfg = DIVISIONS[division];

  // Veteran: 27-35, any point in career, broad rarity distribution
  // Prospect: under 26, lower-stats start but high potential
  let age: number;
  let forcedRarity: Rarity | undefined;

  if (kind === 'veteran') {
    age = randInt(27, Math.min(35, divCfg.primeMax + 3));
    // Veterans skew rare/epic occasionally; mostly uncommon/rare
    const roll = Math.random();
    if (roll < 0.05) forcedRarity = 'legendary';
    else if (roll < 0.18) forcedRarity = 'epic';
    else if (roll < 0.45) forcedRarity = 'rare';
    else if (roll < 0.80) forcedRarity = 'uncommon';
    else forcedRarity = 'common';
  } else {
    age = randInt(19, 26);
    // Prospects: rarity weighted toward high potential
    const roll = Math.random();
    if (roll < 0.08) forcedRarity = 'legendary';
    else if (roll < 0.25) forcedRarity = 'epic';
    else if (roll < 0.55) forcedRarity = 'rare';
    else if (roll < 0.85) forcedRarity = 'uncommon';
    else forcedRarity = 'common';
  }

  const f = generateFighter({ division, age, rarity: forcedRarity });

  // For veterans, give them an existing record (5-15 fights, plausibly winning)
  if (kind === 'veteran') {
    const totalFights = randInt(8, 22);
    const winRate = forcedRarity === 'legendary' || forcedRarity === 'epic'
      ? 0.75
      : forcedRarity === 'rare'
        ? 0.65
        : 0.55;
    f.wins = Math.round(totalFights * winRate);
    f.losses = totalFights - f.wins;
    // Distribute finish types
    f.koWins = Math.floor(f.wins * 0.4);
    f.subWins = Math.floor(f.wins * 0.25);
    f.decWins = f.wins - f.koWins - f.subWins;
    f.koLosses = Math.floor(f.losses * 0.35);
    f.subLosses = Math.floor(f.losses * 0.2);
    f.decLosses = f.losses - f.koLosses - f.subLosses;
    // Sprinkle in some fame to reflect their prior career
    const baseFame = forcedRarity === 'legendary' ? 80
      : forcedRarity === 'epic' ? 50
      : forcedRarity === 'rare' ? 30
      : 15;
    f.fame = baseFame + (chance(0.5) ? randInt(0, 20) : 0);
  }

  // Reassign rarity based on actual stats if the generated overall lands far
  // from the rarity's expected range. This keeps rarity labels honest.
  const o = overall(f);
  const corrected = rarityFromOverall(o);
  if (corrected !== f.rarity) {
    f.rarity = corrected;
  }

  return f;
}

/** Map an overall skill rating to its representative rarity tier. */
function rarityFromOverall(o: number): Rarity {
  if (o >= 90) return 'legendary';
  if (o >= 83) return 'epic';
  if (o >= 75) return 'rare';
  if (o >= 65) return 'uncommon';
  return 'common';
}
