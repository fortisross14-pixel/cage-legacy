/**
 * Rivalry tracking.
 *
 * A rivalry is implicit between any two fighters who have met. We materialize
 * a Rivalry record on first meeting so subsequent meetings can:
 *   - quickly count priorMeetings (for rating bonus)
 *   - show "X leads the series 2-1" on profiles
 *   - power "trilogy", "rubber match" style headlines
 */
import type { Fighter, FightOutcome, GameState, Rivalry } from '@/types';

/** Canonical rivalry id: lexicographically-smaller id, "_", larger id. */
export function rivalryId(idA: string, idB: string): string {
  return idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;
}

/** Get existing rivalry record (or null if these two have never met). */
export function getRivalry(state: GameState, idA: string, idB: string): Rivalry | null {
  return state.rivalries[rivalryId(idA, idB)] ?? null;
}

/** Number of prior meetings between two fighters (before applying current fight). */
export function priorMeetingsCount(state: GameState, idA: string, idB: string): number {
  return getRivalry(state, idA, idB)?.meetings.length ?? 0;
}

/** Apply the rivalry update for a fight that just occurred. */
export interface ApplyRivalryInput {
  state: GameState;
  fA: Fighter;
  fB: Fighter;
  result: FightOutcome;
  rating: number;
  eventInfo: { num: number; name: string };
}

/**
 * Minimum rating required to *initiate* a new rivalry. Forgettable fights
 * (rating < this) won't seed a rivalry record. Once a rivalry exists, every
 * subsequent meeting is recorded regardless of rating — they're already rivals.
 */
const RIVALRY_THRESHOLD = 6.5;

export function applyRivalryUpdate({
  state,
  fA,
  fB,
  result,
  rating,
  eventInfo,
}: ApplyRivalryInput): void {
  const id = rivalryId(fA.id, fB.id);
  const aId = fA.id < fB.id ? fA.id : fB.id;
  const bId = fA.id < fB.id ? fB.id : fA.id;

  const existing = state.rivalries[id];

  // Gate: don't create a rivalry from a forgettable first meeting.
  if (!existing && rating < RIVALRY_THRESHOLD) return;

  let rivalry = existing;
  if (!rivalry) {
    rivalry = {
      id,
      fighterAId: aId,
      fighterBId: bId,
      aWins: 0,
      bWins: 0,
      draws: 0,
      meetings: [],
      totalRating: 0,
      lastEventNum: 0,
    };
    state.rivalries[id] = rivalry;
  }

  // Update record
  if (result.winnerId === aId) rivalry.aWins++;
  else if (result.winnerId === bId) rivalry.bWins++;
  else rivalry.draws++;

  rivalry.meetings.push({
    eventNum: eventInfo.num,
    eventName: eventInfo.name,
    winnerId: result.winnerId,
    method: result.method,
    round: result.round,
    rating,
  });
  rivalry.totalRating = Math.round((rivalry.totalRating + rating) * 100) / 100;
  rivalry.lastEventNum = eventInfo.num;
}

/** All rivalries involving a specific fighter, sorted by most-recent. */
export function rivalriesFor(state: GameState, fighterId: string): Rivalry[] {
  return Object.values(state.rivalries)
    .filter((r) => r.fighterAId === fighterId || r.fighterBId === fighterId)
    .sort((a, b) => b.lastEventNum - a.lastEventNum);
}

/** Top-rated rivalries across the universe (multi-meeting, high cumulative rating). */
export function topRivalries(state: GameState, limit = 10): Rivalry[] {
  return Object.values(state.rivalries)
    .filter((r) => r.meetings.length >= 2)
    .sort((a, b) => b.totalRating - a.totalRating)
    .slice(0, limit);
}
