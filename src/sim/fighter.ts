import type {
  Archetype,
  Division,
  Fighter,
  FighterStats,
  Rarity,
} from '@/types';
import {
  ARCHETYPES,
  ARCHETYPE_KEYS,
  COUNTRIES,
  DIVISIONS,
  FIRST_NAMES,
  LAST_NAMES,
  NICKNAMES,
  RARITIES,
} from '@/data';
import { chance, pick, rand, randInt, uid, weightedPick } from './random';

// ============================================================
// FIGHTER GENERATION
// ============================================================

export interface GenerateOptions {
  rarity?: Rarity;
  archetype?: Archetype;
  age?: number;
  division: Division;
}

export function generateFighter(opts: GenerateOptions): Fighter {
  const rarity = opts.rarity ?? weightedPick(RARITIES);
  const rarityCfg = RARITIES[rarity];
  const archetype = opts.archetype ?? pick(ARCHETYPE_KEYS);
  const country = pick(COUNTRIES);
  const division = opts.division;
  const divCfg = DIVISIONS[division];

  // Potential ceiling (stat cap)
  const potential = randInt(rarityCfg.ceilMin, rarityCfg.ceilMax);

  // Starting age — vary by division, mostly prospects
  const minStartAge = Math.max(19, divCfg.prospectMax - 5);
  const age = opts.age !== undefined
    ? opts.age
    : chance(0.7)
      ? randInt(minStartAge, divCfg.prospectMax)
      : randInt(divCfg.primeMin, Math.min(divCfg.primeMin + 5, divCfg.primeMax));

  // Stat seeding scales with how far along the career path the fighter is
  const ageProgress = Math.min(1, (age - 18) / 12);
  const baseLow = potential * (0.55 + ageProgress * 0.25);
  const baseHigh = potential * (0.7 + ageProgress * 0.25);

  const archCfg = ARCHETYPES[archetype];

  function genStat(weight: number): number {
    const base = rand(baseLow, baseHigh);
    const scaled = base * weight;
    return Math.max(20, Math.min(99, Math.round(scaled + rand(-5, 5))));
  }

  const w = archCfg.weights;
  const stats: FighterStats = {
    striking: genStat(w.striking),
    grappling: genStat(w.grappling),
    submission: genStat(w.submission),
    cardio: genStat(w.cardio),
    durability: genStat(w.durability),
    fightIQ: genStat(w.fightIQ),
  };

  return {
    id: uid('f'),
    firstName: pick(FIRST_NAMES),
    lastName: pick(LAST_NAMES),
    nickname: chance(0.75) ? pick(NICKNAMES) : null,
    country: country.name,
    flag: country.flag,
    age,
    debutAge: age,
    rarity,
    potential,
    archetype,
    division,
    stats,
    wins: 0,
    losses: 0,
    draws: 0,
    koWins: 0,
    subWins: 0,
    decWins: 0,
    koLosses: 0,
    subLosses: 0,
    decLosses: 0,
    currentStreak: 0,
    longestWinStreak: 0,
    longestLossStreak: 0,
    titleReigns: 0,
    titleDefenses: 0,
    isChampion: false,
    becameChampAge: null,
    retired: false,
    retirementReason: null,
    retiredAtEvent: null,
    hallOfFame: false,
    inactive: 0,
    fightLog: [],
  };
}

// ============================================================
// DISPLAY HELPERS
// ============================================================

export function fullName(f: Fighter): string {
  return `${f.firstName} ${f.lastName}`;
}

export function displayName(f: Fighter): string {
  return f.nickname ? `${f.firstName} "${f.nickname}" ${f.lastName}` : fullName(f);
}

export function recordStr(f: Fighter): string {
  return f.draws > 0 ? `${f.wins}-${f.losses}-${f.draws}` : `${f.wins}-${f.losses}`;
}

// ============================================================
// AGING & DEVELOPMENT
// ============================================================

export function ageFighter(fighter: Fighter, currentEvent: number): void {
  if (fighter.retired) return;
  fighter.age += 1;

  const age = fighter.age;
  const divCfg = DIVISIONS[fighter.division];
  const stats = fighter.stats;

  for (const key of Object.keys(stats) as (keyof FighterStats)[]) {
    let delta = 0;
    if (age <= divCfg.prospectMax) {
      // Prospect: rapid growth toward potential
      const gap = fighter.potential - stats[key];
      delta = randInt(0, Math.max(2, Math.round(gap * 0.25)));
    } else if (age <= divCfg.primeMax) {
      // Prime: small refinement
      const gap = fighter.potential - stats[key];
      delta = gap > 0 ? randInt(-1, Math.min(2, Math.ceil(gap * 0.15))) : randInt(-1, 1);
    } else {
      // Decline: durability and cardio drop faster
      if (key === 'durability' || key === 'cardio') delta = randInt(-3, 0);
      else delta = randInt(-2, 1);
    }
    stats[key] = Math.max(20, Math.min(99, stats[key] + delta));
  }

  // Retirement check
  if (age >= divCfg.retireRiskStart) {
    const yearsPast = age - divCfg.retireRiskStart;
    const baseRisk = 0.05 + yearsPast * 0.08;
    const recentLosses = fighter.fightLog.slice(-3).filter((l) => l.result === 'L').length;
    const lossModifier = recentLosses * 0.1;
    const champModifier = fighter.isChampion ? -0.15 : 0;
    const totalRisk = Math.min(0.85, baseRisk + lossModifier + champModifier);

    if (chance(totalRisk) || age >= divCfg.retireRiskMax) {
      fighter.retired = true;
      fighter.retiredAtEvent = currentEvent;
      fighter.retirementReason = age >= divCfg.retireRiskMax ? 'age' : 'declining performance';
    }
  }
}

// ============================================================
// STATS HELPERS
// ============================================================

export function effectiveStat(fighter: Fighter, stat: keyof FighterStats): number {
  const base = fighter.stats[stat];
  let streakMod = 0;
  if (fighter.currentStreak >= 5) streakMod = 3;
  else if (fighter.currentStreak >= 3) streakMod = 2;
  else if (fighter.currentStreak >= 2) streakMod = 1;
  else if (fighter.currentStreak <= -3) streakMod = -3;
  else if (fighter.currentStreak <= -2) streakMod = -1.5;
  return base + streakMod;
}

export function overall(f: Fighter): number {
  const s = f.stats;
  const w = ARCHETYPES[f.archetype].weights;
  const total =
    s.striking * w.striking +
    s.grappling * w.grappling +
    s.submission * w.submission +
    s.cardio * w.cardio +
    s.durability * w.durability +
    s.fightIQ * w.fightIQ;
  const weightSum = Object.values(w).reduce((a, b) => a + b, 0);
  return Math.round(total / weightSum);
}

// ============================================================
// HALL OF FAME ELIGIBILITY
// ============================================================
// Criteria: retired + (3+ title defenses OR 2+ title reigns OR 30+ career wins)

export function evaluateHallOfFame(f: Fighter): boolean {
  if (!f.retired) return false;
  if (f.titleDefenses >= 3) return true;
  if (f.titleReigns >= 2) return true;
  if (f.wins >= 30) return true;
  return false;
}
