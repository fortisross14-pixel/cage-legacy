/**
 * Fame system.
 *
 * Fame is the "narrative weight" of a fighter — it drives base fight ratings,
 * affects which losses are penalized harder ("bad losses"), and accumulates
 * over a career as fighters win, claim belts, finish opponents, headline events,
 * and produce highlight reels.
 *
 * Tune via the FAME constant in @/data.
 */
import type { Fighter, FightOutcome } from '@/types';
import { FAME, CAREER_POINTS } from '@/data';

export interface ApplyFameChangesInput {
  winner: Fighter;
  loser: Fighter;
  result: FightOutcome;
  rating: number;
  isMainEvent: boolean;
}

export function applyFameChanges({
  winner,
  loser,
  result,
  rating,
  isMainEvent,
}: ApplyFameChangesInput): void {
  // -------- WINNER --------
  let winnerDelta = FAME.WIN_BASE;
  if (result.method === 'KO' || result.method === 'SUB' || result.method === 'DOC') {
    winnerDelta += FAME.WIN_FINISH_BONUS;
  }
  if (isMainEvent) {
    winnerDelta += FAME.WIN_MAIN_EVENT_BONUS;
  }
  if (result.isTitleFight) {
    // Distinguish new champ vs defending champ. We can tell from titleDefenses:
    // a freshly-crowned champion has titleDefenses 0 in this exact moment because
    // the title handler increments defenses for *defending* champs only.
    // Simplest: if loser was the champion before the fight, treat winner as new champ.
    // We don't have that here cleanly, so we use a proxy: the winner gained a title
    // reign in this fight iff winner.titleReigns > 0 AND becameChampAge === winner.age.
    // This works because crownChampion sets becameChampAge to the current age, and
    // applyFameChanges runs after applyResult/handleTitleResult.
    const justCrowned = winner.becameChampAge === winner.age && winner.isChampion;
    winnerDelta += justCrowned ? FAME.WIN_TITLE_NEW : FAME.WIN_TITLE_DEFENSE;
  }
  if (rating >= 8.5) {
    winnerDelta += FAME.WIN_RATING_70_BONUS + FAME.WIN_RATING_85_BONUS;
  } else if (rating >= 7.0) {
    winnerDelta += FAME.WIN_RATING_70_BONUS;
  }
  if (winner.currentStreak > 0) {
    winnerDelta += Math.floor(winner.currentStreak / FAME.STREAK_DIVISOR);
  }
  winner.fame = Math.max(FAME.MIN, winner.fame + winnerDelta);

  // -------- LOSER --------
  let loserDelta = FAME.LOSS_BASE;
  // Losing to a much-less-famous opponent stings worse
  if (winner.fame + FAME.LOSS_TO_LOWER_FAME_GAP < loser.fame) {
    loserDelta += FAME.LOSS_TO_LOWER_FAME;
  }
  loser.fame = Math.max(FAME.MIN, loser.fame + loserDelta);

  // -------- CAREER POINTS (drives P4P / GOAT) --------
  // Win = full rating value added
  winner.careerPoints += rating * CAREER_POINTS.WIN_MULT;
  // Loss = small fixed dampener (so spamming losses doesn't help)
  // Dampened if the loss was to a higher-fame opponent (no shame in losing to a star)
  let lossPenalty = CAREER_POINTS.LOSS_FIXED;
  if (CAREER_POINTS.LOSS_HIGH_FAME_OPP_DAMPEN && winner.fame > loser.fame + 30) {
    lossPenalty *= 0.4; // most of the penalty waived
  }
  loser.careerPoints = Math.max(0, loser.careerPoints + lossPenalty);
  // Round career points to 2 decimal places for clean display
  winner.careerPoints = Math.round(winner.careerPoints * 100) / 100;
  loser.careerPoints = Math.round(loser.careerPoints * 100) / 100;
}

/**
 * Annual fame decay for fighters whose prime is behind them but who haven't retired.
 * Called from the periodic age tick.
 */
export function applyAgeFameDecay(fighter: Fighter, primeMax: number): void {
  if (fighter.retired) return;
  if (fighter.age <= primeMax) return;
  fighter.fame = Math.max(FAME.MIN, fighter.fame + FAME.AGE_PAST_PRIME_DECAY);
}
