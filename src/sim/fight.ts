import type { Fighter, FightMethod, FightOutcome } from '@/types';
import { ARCHETYPES, DIVISIONS, MATCHUP_MATRIX } from '@/data';
import { effectiveStat } from './fighter';
import { chance, rand } from './random';

export interface SimulateFightOptions {
  isTitleFight?: boolean;
  isMainEvent?: boolean;
}

// ============================================================
// FIGHT SIMULATION
// ============================================================

export function simulateFight(
  fA: Fighter,
  fB: Fighter,
  opts: SimulateFightOptions = {}
): FightOutcome {
  const isTitleFight = !!opts.isTitleFight;
  const isFiveRound = isTitleFight || !!opts.isMainEvent;
  const maxRounds = isFiveRound ? 5 : 3;

  const powerA = calculatePower(fA, fB);
  const powerB = calculatePower(fB, fA);

  // Title fights slightly more predictable; non-title more variance
  const variance = isTitleFight ? 0.16 : 0.20;

  // "Off night" — keeps the universe unpredictable
  let offNightA = 1.0;
  let offNightB = 1.0;
  if (chance(0.08)) offNightA = rand(0.65, 0.85);
  if (chance(0.08)) offNightB = rand(0.65, 0.85);

  const rngA = powerA * (1 + rand(-variance, variance)) * offNightA;
  const rngB = powerB * (1 + rand(-variance, variance)) * offNightB;

  let damageA = 0;
  let damageB = 0;
  let roundsWonA = 0;
  let roundsWonB = 0;
  let finishRound: number | null = null;
  let finishMethod: FightMethod | null = null;
  let winnerId: string | null = null;
  let loserId: string | null = null;

  for (let round = 1; round <= maxRounds; round++) {
    // Cardio factor: late rounds amplify cardio advantage
    const cardioFactor = round >= 4 ? 1.4 : round === 3 ? 1.1 : 1.0;
    const aCardio = fA.stats.cardio * cardioFactor;
    const bCardio = fB.stats.cardio * cardioFactor;

    const aRoundPower = rngA * (0.7 + aCardio / 200 + rand(-0.1, 0.1));
    const bRoundPower = rngB * (0.7 + bCardio / 200 + rand(-0.1, 0.1));

    const aEffective = aRoundPower * (1 - damageA * 0.15);
    const bEffective = bRoundPower * (1 - damageB * 0.15);

    if (aEffective > bEffective) {
      roundsWonA++;
      damageB += rand(0.3, 0.7);
    } else {
      roundsWonB++;
      damageA += rand(0.3, 0.7);
    }

    const finish = checkFinish(fA, fB, aEffective, bEffective, damageA, damageB);
    if (finish) {
      finishRound = round;
      finishMethod = finish.method;
      winnerId = finish.winnerId;
      loserId = finish.loserId;
      break;
    }
  }

  // No finish — go to decision
  if (!finishMethod) {
    if (roundsWonA === roundsWonB) {
      if (Math.abs(damageA - damageB) < 0.2) {
        if (rngA > rngB) { winnerId = fA.id; loserId = fB.id; }
        else { winnerId = fB.id; loserId = fA.id; }
      } else if (damageA < damageB) {
        winnerId = fA.id; loserId = fB.id;
      } else {
        winnerId = fB.id; loserId = fA.id;
      }
    } else if (roundsWonA > roundsWonB) {
      winnerId = fA.id; loserId = fB.id;
    } else {
      winnerId = fB.id; loserId = fA.id;
    }
    finishMethod = 'DEC';
    finishRound = maxRounds;
  }

  return {
    winnerId: winnerId!,
    loserId: loserId!,
    method: finishMethod,
    round: finishRound!,
    isTitleFight,
    roundsWonA,
    roundsWonB,
  };
}

// ============================================================
// POWER CALCULATION
// ============================================================

function calculatePower(fighter: Fighter, opponent: Fighter): number {
  const w = ARCHETYPES[fighter.archetype].weights;

  let composite =
    effectiveStat(fighter, 'striking') * w.striking +
    effectiveStat(fighter, 'grappling') * w.grappling +
    effectiveStat(fighter, 'submission') * w.submission +
    effectiveStat(fighter, 'cardio') * w.cardio * 0.8 +
    effectiveStat(fighter, 'durability') * w.durability * 0.7 +
    effectiveStat(fighter, 'fightIQ') * w.fightIQ;

  // Archetype matchup
  composite *= MATCHUP_MATRIX[fighter.archetype][opponent.archetype];

  // Age modifier
  const age = fighter.age;
  let ageMod = 1.0;
  if (age < 22) ageMod = 0.95;
  else if (age >= 35) ageMod = 1.0 - (age - 34) * 0.025;
  composite *= ageMod;

  return composite;
}

// ============================================================
// FINISH CHECK
// ============================================================

interface FinishResult {
  method: FightMethod;
  winnerId: string;
  loserId: string;
}

function checkFinish(
  fA: Fighter,
  fB: Fighter,
  aPower: number,
  bPower: number,
  damageA: number,
  damageB: number
): FinishResult | null {
  const aIsWinning = aPower > bPower;
  const attacker = aIsWinning ? fA : fB;
  const defender = aIsWinning ? fB : fA;
  const defenderDamage = aIsWinning ? damageB : damageA;
  const powerDiff = Math.abs(aPower - bPower);

  const divMult = DIVISIONS[attacker.division].finishRateMultiplier;
  const baseChance = 0.025 + powerDiff / 400 + defenderDamage * 0.04;
  const durPenalty = (100 - defender.stats.durability) / 500;
  const finishChance = Math.min(0.28, (baseChance + durPenalty) * divMult);

  if (!chance(finishChance)) return null;

  // Method based on attacker archetype bias and relevant stats
  const bias = ARCHETYPES[attacker.archetype].finishBias;
  const koWeight = attacker.stats.striking * bias.ko;
  const subWeight = attacker.stats.submission * bias.sub;
  const docWeight = 6; // rare

  const totalW = koWeight + subWeight + docWeight;
  const r = Math.random() * totalW;

  let method: FightMethod;
  if (r < koWeight) method = 'KO';
  else if (r < koWeight + subWeight) method = 'SUB';
  else method = 'DOC';

  return {
    method,
    winnerId: attacker.id,
    loserId: defender.id,
  };
}

// ============================================================
// APPLY RESULT (mutates fighters)
// ============================================================

export interface ApplyResultEventInfo {
  num: number;
  name: string;
}

export function applyResult(
  fA: Fighter,
  fB: Fighter,
  result: FightOutcome,
  eventInfo: ApplyResultEventInfo
): { winner: Fighter; loser: Fighter } {
  const winner = fA.id === result.winnerId ? fA : fB;
  const loser = fA.id === result.winnerId ? fB : fA;

  // Winner
  winner.wins++;
  winner.currentStreak = winner.currentStreak > 0 ? winner.currentStreak + 1 : 1;
  winner.longestWinStreak = Math.max(winner.longestWinStreak, winner.currentStreak);
  if (result.method === 'KO' || result.method === 'DOC') winner.koWins++;
  else if (result.method === 'SUB') winner.subWins++;
  else if (result.method === 'DEC') winner.decWins++;

  // Loser
  loser.losses++;
  loser.currentStreak = loser.currentStreak < 0 ? loser.currentStreak - 1 : -1;
  loser.longestLossStreak = Math.max(loser.longestLossStreak, Math.abs(loser.currentStreak));
  if (result.method === 'KO' || result.method === 'DOC') loser.koLosses++;
  else if (result.method === 'SUB') loser.subLosses++;
  else if (result.method === 'DEC') loser.decLosses++;

  fA.inactive = 0;
  fB.inactive = 0;

  const logBase = {
    eventNum: eventInfo.num,
    eventName: eventInfo.name,
    method: result.method,
    round: result.round,
    isTitleFight: result.isTitleFight,
    division: fA.division,
  };

  winner.fightLog.push({
    ...logBase,
    oppId: loser.id,
    oppName: `${loser.firstName} ${loser.lastName}`,
    result: 'W',
  });
  loser.fightLog.push({
    ...logBase,
    oppId: winner.id,
    oppName: `${winner.firstName} ${winner.lastName}`,
    result: 'L',
  });

  return { winner, loser };
}
