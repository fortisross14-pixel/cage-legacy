import type { GameState } from '@/types';
import { Icon } from '@/icons';

interface Props {
  state: GameState;
  onReset: () => void;
}

export function TopBar({ state, onReset }: Props) {
  const date = state.lastEvent
    ? new Date(state.lastEvent.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">CL</div>
        <div className="brand-text">
          <div className="brand-title">CAGE LEGACY</div>
          <div className="brand-sub">MMA Universe Simulator</div>
        </div>
      </div>
      <div className="meta">
        <div className="meta-pill">
          <Icon name="fight" size={14} className="meta-icon" />
          <span className="meta-label">Event</span>
          <span className="meta-value">#{state.eventCount}</span>
        </div>
        <div className="meta-pill">
          <Icon name="calendar" size={14} className="meta-icon" />
          <span className="meta-label">Date</span>
          <span className="meta-value">{date}</span>
        </div>
        <button className="btn-reset" onClick={onReset} title="Reset universe">
          <Icon name="reset" size={12} />
          Reset
        </button>
      </div>
    </header>
  );
}
