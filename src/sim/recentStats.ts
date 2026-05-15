/**
 * Recent-window stats. Computes 12-month aggregates from a fighter's fightLog.
 *
 * "12 months" is operationalised as 72 events back at the standard cadence
 * (6 events/month). This is a rolling window from the current eventCount.
 */
import type { Fighter, GameState } from '@/types';

export const EVENTS_PER_YEAR = 72;

export interface RecentStats {
  wins: number;
  losses: number;
  koWins: number;     // KO/TKO wins in window
  subWins: number;
  decWins: number;
  /** Sum of rating points from wins minus halved sum from losses (matches careerPoints accumulation). */
  p4pPoints: number;
  /** Count of rated fights in window. */
  totalFights: number;
}

export function getRecentStats(
  state: GameState,
  fighter: Fighter,
  windowEvents: number = EVENTS_PER_YEAR
): RecentStats {
  const cutoff = state.eventCount - windowEvents;
  const log = fighter.fightLog.filter((l) => l.eventNum > cutoff);

  let wins = 0,
    losses = 0,
    koWins = 0,
    subWins = 0,
    decWins = 0,
    p4pPoints = 0;

  for (const l of log) {
    if (l.result === 'W') {
      wins++;
      if (l.method === 'KO' || l.method === 'DOC') koWins++;
      else if (l.method === 'SUB') subWins++;
      else if (l.method === 'DEC') decWins++;
      p4pPoints += l.rating;
    } else if (l.result === 'L') {
      losses++;
      p4pPoints -= l.rating * 0.4; // penalty for a loss, scaled by fight quality
    }
  }

  return {
    wins,
    losses,
    koWins,
    subWins,
    decWins,
    p4pPoints: Math.round(p4pPoints * 100) / 100,
    totalFights: log.length,
  };
}

/**
 * Returns active fighters sorted by recent P4P (12-month rolling window),
 * descending. Used for the All-Time → P4P leaderboard.
 */
export function getRecentP4P(state: GameState, limit = 20): Array<{ fighter: Fighter; recent: RecentStats }> {
  const ranked = state.fighters
    .filter((f) => !f.retired)
    .map((f) => ({ fighter: f, recent: getRecentStats(state, f) }))
    .filter((x) => x.recent.totalFights >= 2);
  ranked.sort((a, b) => b.recent.p4pPoints - a.recent.p4pPoints);
  return ranked.slice(0, limit);
}
