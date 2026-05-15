/**
 * Fight rating engine.
 *
 * Produces a number 1.00 → 9.99 capturing how memorable a fight was.
 * Inputs come from fighter state + match metadata + result. Pure function.
 *
 * Tune via the RATING constant in @/data, not by editing this file.
 */
import type { Fighter, FightOutcome, FightMethod } from '@/types';
import { RATING } from '@/data';
import { overall } from './fighter';
import { rand } from './random';

export interface RateFightInput {
  fA: Fighter;
  fB: Fighter;
  result: FightOutcome;        // already-simulated outcome (we need method, round, winner)
  isTitleFight: boolean;
  isMainEvent: boolean;
  priorMeetings: number;       // 0 = first meeting
}

export function rateFight(input: RateFightInput): number {
  const { fA, fB, result, isTitleFight, isMainEvent, priorMeetings } = input;

  // --- Base from combined fame ---
  // Use the higher of the two so a single famous fighter pulls the floor up,
  // but cap returns so a megastar vs nobody isn't automatically a classic.
  const fameAvg = (fA.fame + fB.fame) / 2;
  const fameMax = Math.max(fA.fame, fB.fame);
  const fameEffective = fameAvg * 0.7 + fameMax * 0.3;  // weighted blend
  // Asymptote: base = floor + (peak - floor) * fame / (fame + half)
  const base =
    RATING.FAME_BASE_FLOOR +
    (RATING.FAME_BASE_PEAK - RATING.FAME_BASE_FLOOR) *
      (fameEffective / (fameEffective + RATING.FAME_BASE_HALF));

  // --- Stakes ---
  let stakes = 0;
  if (isTitleFight) stakes += RATING.TITLE_BONUS;
  if (isMainEvent && !isTitleFight) stakes += RATING.MAIN_EVENT_BONUS;
  // Title fights are already main events; don't double-count

  // --- Competitiveness: closer overalls = more bonus ---
  const ovA = overall(fA);
  const ovB = overall(fB);
  const ovGap = Math.abs(ovA - ovB);
  const compRatio = Math.max(0, 1 - ovGap / RATING.COMPETITIVENESS_GAP_AT_FULL);
  const competitiveness = RATING.COMPETITIVENESS_MAX * compRatio;

  // --- Drama from method + round ---
  const drama = dramaFor(result.method, result.round, result.roundsWonA, result.roundsWonB, isTitleFight || isMainEvent);

  // --- Upset: did the lower-overall fighter win? ---
  const winnerId = result.winnerId;
  const winnerOv = winnerId === fA.id ? ovA : ovB;
  const loserOv  = winnerId === fA.id ? ovB : ovA;
  let upset = 0;
  if (winnerOv < loserOv) {
    const gap = loserOv - winnerOv;
    const upRatio = Math.min(1, gap / RATING.UPSET_GAP_AT_FULL);
    upset = RATING.UPSET_MAX_BONUS * upRatio;
  }

  // --- Rivalry from prior meetings ---
  let rivalry = 0;
  if (priorMeetings === 1) rivalry = RATING.RIVALRY_BONUS_1;
  else if (priorMeetings === 2) rivalry = RATING.RIVALRY_BONUS_2;
  else if (priorMeetings === 3) rivalry = RATING.RIVALRY_BONUS_3;
  else if (priorMeetings >= 4) rivalry = RATING.RIVALRY_BONUS_4P;

  // --- Jitter ---
  const jitter = rand(-RATING.JITTER, RATING.JITTER);

  // --- Sum & clamp ---
  const raw = base + stakes + competitiveness + drama + upset + rivalry + jitter;
  const clamped = Math.max(RATING.MIN, Math.min(RATING.MAX, raw));

  // Round to 2 decimal places
  return Math.round(clamped * 100) / 100;
}

function dramaFor(
  method: FightMethod,
  round: number,
  roundsWonA: number,
  roundsWonB: number,
  isFiveRound: boolean
): number {
  if (method === 'KO') {
    if (round === 1) return RATING.DRAMA_KO_EARLY;
    if (round <= 3) return RATING.DRAMA_KO_MID;
    return RATING.DRAMA_KO_LATE;
  }
  if (method === 'SUB') {
    if (round === 1) return RATING.DRAMA_SUB_EARLY;
    if (round <= 3) return RATING.DRAMA_SUB_MID;
    return RATING.DRAMA_SUB_LATE;
  }
  if (method === 'DOC') {
    return RATING.DRAMA_DOC;
  }
  // DEC
  let bonus = isFiveRound ? RATING.DRAMA_DEC_5R : RATING.DRAMA_DEC_3R;
  // Close decision bonus
  if (Math.abs(roundsWonA - roundsWonB) <= 1) {
    bonus += RATING.DRAMA_CLOSE_DEC_BONUS;
  }
  return bonus;
}

/**
 * Render duration from outcome. e.g. "R2 3:12" for finishes; "Full 5R" for DEC.
 * Note: we don't simulate clock time per round, so we generate a plausible
 * mm:ss using the round and rng. For DEC we just say "Full {n}R".
 */
export function formatDuration(method: FightMethod, round: number, isFiveRound: boolean): string {
  if (method === 'DEC') {
    return isFiveRound ? 'Full 5R' : 'Full 3R';
  }
  // Generate plausible minute:second
  const sec = Math.floor(rand(15, 295)); // 0:15 to 4:55
  const mm = Math.floor(sec / 60);
  const ss = sec % 60;
  return `R${round} ${mm}:${ss.toString().padStart(2, '0')}`;
}
