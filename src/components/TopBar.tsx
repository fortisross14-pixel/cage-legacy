import type { GameState } from '@/types';
import { Icon } from '@/icons';

interface Props {
  state: GameState;
  universeName: string;
  onHome: () => void;
  onReset: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  skipReveal: boolean;
  onToggleSkipReveal: () => void;
}

export function TopBar({
  state,
  universeName,
  onHome,
  onReset,
  audioEnabled,
  onToggleAudio,
  skipReveal,
  onToggleSkipReveal,
}: Props) {
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
          <div className="brand-sub">{universeName}</div>
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
        <button
          className={`btn-toggle ${skipReveal ? 'active' : ''}`}
          onClick={onToggleSkipReveal}
          title={skipReveal ? 'Reveal animation: OFF (one-click sim)' : 'Reveal animation: ON'}
        >
          <Icon name={skipReveal ? 'next' : 'play'} size={12} />
          {skipReveal ? 'Quick sim' : 'Reveal'}
        </button>
        <button
          className={`btn-toggle ${audioEnabled ? 'active' : ''}`}
          onClick={onToggleAudio}
          title={audioEnabled ? 'Audio: ON' : 'Audio: OFF'}
        >
          <Icon name={audioEnabled ? 'hype' : 'close'} size={12} />
          Audio
        </button>
        <button className="btn-home" onClick={onHome} title="Save & switch universe">
          <Icon name="home" size={14} />
          Save & Exit
        </button>
        <button className="btn-reset" onClick={onReset} title="Restart this universe from scratch">
          <Icon name="reset" size={12} />
          Restart
        </button>
      </div>
    </header>
  );
}
