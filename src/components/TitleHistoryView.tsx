import type { Division, GameState } from '@/types';
import { DIVISIONS } from '@/data';
import { Icon } from '@/icons';

interface Props {
  state: GameState;
  division: Division;
  onFighterClick: (id: string) => void;
}

export function TitleHistoryView({ state, division, onFighterClick }: Props) {
  const reigns = state.titleHistory
    .filter((r) => r.division === division)
    .sort((a, b) => b.reignNum - a.reignNum);

  return (
    <div>
      <div className="section-header">
        <Icon name="history" size={18} style={{ color: 'var(--gold)' }} />
        <h2>{DIVISIONS[division].label} Title Lineage</h2>
        <div className="accent-line" />
      </div>

      {reigns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="champion" size={28} />
          </div>
          <h3>No champion crowned yet</h3>
          <p>Run an event to see the first reign begin.</p>
        </div>
      ) : (
        <div className="title-history">
          {reigns.map((r) => {
            const isCurrent = !r.endEvent;
            const duration = isCurrent
              ? `Event #${r.startEvent} — Present`
              : `Event #${r.startEvent} — #${r.endEvent}`;
            return (
              <div
                key={r.reignNum + '-' + r.fighterId}
                className={`reign-card ${isCurrent ? 'current' : ''}`}
                onClick={() => onFighterClick(r.fighterId)}
              >
                <div className="reign-num">#{r.reignNum}</div>
                <div className="reign-info">
                  <div className="reign-name">
                    {r.fighterName}
                    {isCurrent && <Icon name="champion" size={16} style={{ color: 'var(--gold)' }} />}
                  </div>
                  <div className="reign-meta">{duration} • Crowned at age {r.startAge}</div>
                  {!isCurrent && r.lostTo && (
                    <div className="reign-meta">Lost title to {r.lostTo}</div>
                  )}
                </div>
                <div className="reign-stats">
                  <div className="stat-badge">
                    <div className="stat-badge-val">{r.defenses}</div>
                    <div className="stat-badge-label">Defenses</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
