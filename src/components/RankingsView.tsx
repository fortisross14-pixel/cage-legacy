import type { Division, GameState } from '@/types';
import { ARCHETYPES, DIVISIONS } from '@/data';
import { fullName, recordStr } from '@/sim/fighter';
import { getChampion, getTop10 } from '@/sim/rankings';
import { Icon } from '@/icons';
import { Flag } from './Flag';

interface Props {
  state: GameState;
  division: Division;
  onFighterClick: (id: string) => void;
}

export function RankingsView({ state, division, onFighterClick }: Props) {
  const champ = getChampion(state, division);
  const top10 = getTop10(state, division);
  const reign = champ
    ? state.titleHistory.find((r) => r.fighterId === champ.id && r.division === division && !r.endEvent)
    : null;
  const eventsAsChamp = reign ? state.eventCount - reign.startEvent + 1 : 0;

  return (
    <div>
      {champ ? (
        <div className="champion-banner">
          <div className="champ-mark">
            <div className="champ-mark-bg" />
            <div className="champ-mark-inner">
              <Icon name="champion" size={48} strokeWidth={1.5} />
            </div>
          </div>
          <div className="champ-info">
            <div className="champ-label">
              <Icon name="trophy" size={12} />
              {DIVISIONS[division].label} Champion
            </div>
            <div className="champ-name" onClick={() => onFighterClick(champ.id)}>
              {fullName(champ)}
              <span className="champ-flag-wrap"><Flag code={champ.countryCode} size={22} title={champ.country} /></span>
            </div>
            <div className="champ-meta">
              <span>{recordStr(champ)}</span>
              <span className="meta-divider" />
              <span>Age {champ.age}</span>
              <span className="meta-divider" />
              <span>{ARCHETYPES[champ.archetype].label}</span>
              <span className="meta-divider" />
              <span className="fame-badge">
                <Icon name="star" size={11} />
                Fame {Math.round(champ.fame)}
              </span>
            </div>
          </div>
          <div className="champ-stats">
            <div className="stat-badge">
              <div className="stat-badge-val">{champ.titleDefenses}</div>
              <div className="stat-badge-label">Defenses</div>
            </div>
            <div className="stat-badge">
              <div className="stat-badge-val">{eventsAsChamp}</div>
              <div className="stat-badge-label">Events</div>
            </div>
            <div className="stat-badge">
              <div className="stat-badge-val">
                {champ.currentStreak > 0 ? champ.currentStreak : 0}
              </div>
              <div className="stat-badge-label">Win Streak</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="champion-banner empty">
          <div className="champ-mark empty">
            <div className="champ-mark-bg" />
            <div className="champ-mark-inner">
              <Icon name="champion" size={48} strokeWidth={1.5} />
            </div>
          </div>
          <div className="champ-info">
            <div className="champ-label">{DIVISIONS[division].label} Title</div>
            <div className="champ-name" style={{ cursor: 'default' }}>VACANT</div>
            <div className="champ-meta">The next event will crown a new champion.</div>
          </div>
        </div>
      )}

      <div className="section-header">
        <Icon name="rankings" size={18} style={{ color: 'var(--gold)' }} />
        <h2>{DIVISIONS[division].label} Rankings</h2>
        <div className="accent-line" />
      </div>

      <div className="rankings">
        {top10.length === 0 ? (
          <div className="empty-state">
            <p>No ranked fighters yet.</p>
          </div>
        ) : (
          top10.map((f, i) => (
            <div className="rank-row" key={f.id} onClick={() => onFighterClick(f.id)}>
              <div className="rank-num">{i + 1}</div>
              <div className="rank-info">
                <div className="rank-name-line">
                  <Flag code={f.countryCode} size={14} title={f.country} />
                  <span className="fighter-name">{fullName(f)}</span>
                </div>
                {f.nickname && <div className="fighter-nick">"{f.nickname}"</div>}
              </div>
              <div className="rank-record">{recordStr(f)}</div>
              <div className="rank-archetype">{ARCHETYPES[f.archetype].label}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
