import type { Fighter, FighterStats, GameState } from '@/types';
import { ARCHETYPES, DIVISIONS } from '@/data';
import { fullName } from '@/sim/fighter';
import { Icon, type IconName } from '@/icons';
import { METHOD_LABELS } from './methodLabels';

interface Props {
  fighter: Fighter | null;
  state: GameState;
  onClose: () => void;
}

const STAT_ICONS: Record<keyof FighterStats, IconName> = {
  striking: 'striking',
  grappling: 'grappling',
  submission: 'submissionStat',
  cardio: 'cardio',
  durability: 'durability',
  fightIQ: 'fightIQ',
};

const STAT_LABELS: Record<keyof FighterStats, string> = {
  striking: 'Striking',
  grappling: 'Grappling',
  submission: 'Submission',
  cardio: 'Cardio',
  durability: 'Durability',
  fightIQ: 'Fight IQ',
};

export function FighterProfile({ fighter, state, onClose }: Props) {
  if (!fighter) return null;

  const reigns = state.titleHistory.filter((r) => r.fighterId === fighter.id);
  const log = [...fighter.fightLog].reverse().slice(0, 25);

  return (
    <div className="modal" onClick={(e) => {
      if ((e.target as HTMLElement).classList.contains('modal')) onClose();
    }}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          <Icon name="close" size={16} />
        </button>

        <div className="profile-header">
          <div className={`profile-portrait ${fighter.isChampion ? 'is-champ' : ''}`}>
            <div className="profile-portrait-bg" />
            <div className="profile-portrait-inner">{fighter.flag}</div>
          </div>
          <div className="profile-info">
            <div className="profile-name">
              {fullName(fighter)}
              {fighter.isChampion && <Icon name="champion" size={20} style={{ color: 'var(--gold)' }} />}
              {fighter.hallOfFame && <Icon name="hallOfFame" size={20} style={{ color: 'var(--gold)' }} />}
            </div>
            {fighter.nickname && <div className="profile-nick">"{fighter.nickname}"</div>}
            <div className="profile-meta">
              <span>{fighter.country}</span>
              <span>•</span>
              <span>{fighter.retired ? `Retired (age ${fighter.age})` : `Age ${fighter.age}`}</span>
              <span>•</span>
              <span>{ARCHETYPES[fighter.archetype].label}</span>
              <span className="div-pill" data-div={fighter.division}>
                {DIVISIONS[fighter.division].shortLabel}
              </span>
              <span className={`rarity-tag rarity-${fighter.rarity}`}>{fighter.rarity}</span>
            </div>
          </div>
        </div>

        <div className="profile-record-row">
          <Stat label="Wins" value={fighter.wins} color="green" />
          <Stat label="Losses" value={fighter.losses} color="red" />
          <Stat label="KO" value={fighter.koWins} />
          <Stat label="SUB" value={fighter.subWins} />
          <Stat label="DEC" value={fighter.decWins} />
          <Stat label="Reigns" value={fighter.titleReigns} color="gold" />
          <Stat label="Defenses" value={fighter.titleDefenses} color="gold" />
        </div>

        <div className="profile-section">
          <h3>
            <Icon name="medal" size={12} />
            Attributes
            <span style={{ color: 'var(--text-faint)', fontWeight: 400, letterSpacing: 'var(--tracking-wide)', textTransform: 'none' }}>
              (Potential {fighter.potential})
            </span>
          </h3>
          <div className="stat-bars">
            {(Object.keys(fighter.stats) as (keyof FighterStats)[]).map((k) => (
              <div className="stat-bar" key={k}>
                <div className="stat-bar-icon"><Icon name={STAT_ICONS[k]} size={14} /></div>
                <div className="stat-bar-label">{STAT_LABELS[k]}</div>
                <div className="stat-bar-track">
                  <div className="stat-bar-fill" style={{ width: `${fighter.stats[k]}%` }} />
                </div>
                <div className="stat-bar-val">{fighter.stats[k]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="profile-section">
          <h3>
            <Icon name="trophy" size={12} />
            Career & Title History
          </h3>
          <div style={{ fontSize: 13, lineHeight: 1.9, fontFamily: 'var(--font-stat)', color: 'var(--text)' }}>
            <div>
              Current streak: <strong style={{ color: 'var(--text-bright)' }}>{
                fighter.currentStreak > 0
                  ? `${fighter.currentStreak} wins`
                  : fighter.currentStreak < 0
                    ? `${Math.abs(fighter.currentStreak)} losses`
                    : 'None'
              }</strong>
            </div>
            <div>
              Longest win streak: <strong style={{ color: 'var(--text-bright)' }}>{fighter.longestWinStreak}</strong>
            </div>
            {fighter.hallOfFame && (
              <div style={{ color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Icon name="hallOfFame" size={14} />
                Hall of Fame inductee
              </div>
            )}
            <div style={{ marginTop: 10 }}>
              {reigns.length === 0 ? (
                <span style={{ color: 'var(--text-dim)' }}>No title reigns.</span>
              ) : (
                reigns.map((r) => {
                  const end = r.endEvent ? `#${r.endEvent}` : 'present';
                  return (
                    <div key={r.reignNum + '-' + r.division} style={{ color: 'var(--text-dim)' }}>
                      {DIVISIONS[r.division].shortLabel} Reign #{r.reignNum}: Event #{r.startEvent} → {end} ({r.defenses} def.)
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>
            <Icon name="history" size={12} />
            Fight Log (Most Recent)
          </h3>
          {log.length === 0 ? (
            <span style={{ color: 'var(--text-dim)' }}>No fights yet.</span>
          ) : (
            <div className="fight-log">
              {log.map((l, i) => (
                <div className="log-row" key={i}>
                  <div className={`log-result ${l.result}`}>{l.result}</div>
                  <div className="log-opp">
                    {l.oppName}
                    {l.isTitleFight && <Icon name="champion" size={12} style={{ color: 'var(--gold)', marginLeft: 6, verticalAlign: 'middle' }} />}
                  </div>
                  <div className="log-method">
                    {METHOD_LABELS[l.method]}{l.method !== 'DEC' ? ` R${l.round}` : ''}
                  </div>
                  <div className="log-event">#{l.eventNum}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: 'green' | 'red' | 'gold' }) {
  return (
    <div className="prr-stat">
      <div className={`prr-val ${color ?? ''}`}>{value}</div>
      <div className="prr-lbl">{label}</div>
    </div>
  );
}
