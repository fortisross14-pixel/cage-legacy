/**
 * RankBadge — small label showing a fighter's current ranking.
 *
 *   "C"   → champion (gold box)
 *   "1+"  → ranked contender (white/light box with the number)
 *   null  → unranked (renders nothing)
 *
 * Used in the compact fight row to convey stakes at a glance.
 */
import type { Fighter, GameState } from '@/types';
import { getRankLabel } from '@/sim/rankings';

interface Props {
  fighter: Fighter;
  state: GameState;
  size?: 'sm' | 'md';
}

export function RankBadge({ fighter, state, size = 'sm' }: Props) {
  const label = getRankLabel(state, fighter);
  if (!label) return null;
  const isChamp = label === 'C';
  return (
    <span
      className={`rank-badge ${isChamp ? 'champ' : 'ranked'} ${size === 'md' ? 'rank-badge-md' : ''}`}
      title={isChamp ? 'Champion' : `Ranked #${label}`}
    >
      {label}
    </span>
  );
}
