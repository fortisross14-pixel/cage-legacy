import { useState } from 'react';
import type { Fighter, FighterStats, GameState } from '@/types';
import { ARCHETYPES, DIVISIONS } from '@/data';
import { fullName } from '@/sim/fighter';
import { rivalriesFor } from '@/sim/rivalry';
import { Icon, type IconName } from '@/icons';
import { Flag } from './Flag';
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

type Tab = 'overview' | 'rivalries';

export function FighterProfile({ fighter, state, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  if (!fighter) return null;

  const reigns = state.titleHistory.filter((r) => r.fighterId === fighter.id);
  const log = [...fighter.fightLog].reverse().slice(0, 25);
  const rivalries = rivalriesFor(state, fighter.id);

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
            <div className="profile-portrait-inner">
              <Flag code={fighter.countryCode} size={36} title={fighter.country} />
            </div>
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
              {!fighter.retired && fighter.injured > 0 && (
                <span className="injury-pill">
                  <Icon name="injury" size={11} />
                  Injured · {fighter.injured} event{fighter.injured === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Headline numbers — fame + P4P prominent */}
        <div className="profile-record-row">
          <Stat label="Wins" value={fighter.wins} color="green" />
          <Stat label="Losses" value={fighter.losses} color="red" />
          <Stat label="KO" value={fighter.koWins} />
          <Stat label="SUB" value={fighter.subWins} />
          <Stat label="DEC" value={fighter.decWins} />
          <Stat label="Fame" value={Math.round(fighter.fame)} color="gold" />
          <Stat label="P4P pts" value={fighter.careerPoints.toFixed(1)} color="gold" />
          <Stat label="Reigns" value={fighter.titleReigns} color="gold" />
          <Stat label="Def." value={fighter.titleDefenses} color="gold" />
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`profile-tab ${tab === 'overview' ? 'active' : ''}`}
            onClick={() => setTab('overview')}
          >
            <Icon name="medal" size={13} /> Overview
          </button>
          <button
            className={`profile-tab ${tab === 'rivalries' ? 'active' : ''}`}
            onClick={() => setTab('rivalries')}
          >
            <Icon name="fight" size={13} /> Rivalries {rivalries.length > 0 && `(${rivalries.length})`}
          </button>
        </div>

        {tab === 'overview' && (
          <>
            <div className="profile-section">
              <h3>
                <Icon name="medal" size={12} />
                Attributes
                <span className="potential-tag">Potential {fighter.potential}</span>
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
              <h3><Icon name="trophy" size={12} /> Career & Title History</h3>
              <div className="career-block">
                <div>
                  Current streak: <strong>{
                    fighter.currentStreak > 0
                      ? `${fighter.currentStreak} wins`
                      : fighter.currentStreak < 0
                        ? `${Math.abs(fighter.currentStreak)} losses`
                        : 'None'
                  }</strong>
                </div>
                <div>Longest win streak: <strong>{fighter.longestWinStreak}</strong></div>
                {fighter.hallOfFame && (
                  <div className="hof-line">
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
              <h3><Icon name="history" size={12} /> Fight Log (Most Recent)</h3>
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
                      <div className="log-rating">
                        <Icon name="star" size={10} />
                        {l.rating.toFixed(2)}
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
          </>
        )}

        {tab === 'rivalries' && (
          <div className="profile-section">
            {rivalries.length === 0 ? (
              <div className="empty-state inline">
                <div className="empty-icon"><Icon name="fight" size={22} /></div>
                <p>No rivalries yet — fighters need to face each other at least once.</p>
              </div>
            ) : (
              <div className="rivalry-list">
                {rivalries.map((r) => {
                  const isFighterA = r.fighterAId === fighter.id;
                  const oppId = isFighterA ? r.fighterBId : r.fighterAId;
                  const opp = state.fighters.find((f) => f.id === oppId);
                  const myWins = isFighterA ? r.aWins : r.bWins;
                  const oppWins = isFighterA ? r.bWins : r.aWins;
                  const meetings = r.meetings.length;
                  const seriesLabel =
                    myWins > oppWins
                      ? `Leads ${myWins}-${oppWins}${r.draws ? `-${r.draws}` : ''}`
                      : myWins < oppWins
                        ? `Trails ${myWins}-${oppWins}${r.draws ? `-${r.draws}` : ''}`
                        : `Tied ${myWins}-${oppWins}`;
                  const avgRating = r.totalRating / meetings;
                  return (
                    <div className="rivalry-card" key={r.id}>
                      <div className="rivalry-card-top">
                        <div className="rivalry-opp">
                          <span className="rivalry-vs">vs.</span>
                          <span className="rivalry-opp-name">{opp ? fullName(opp) : 'Unknown'}</span>
                          {opp && <Flag code={opp.countryCode} size={14} title={opp.country} />}
                        </div>
                        <div className="rivalry-series">{seriesLabel}</div>
                      </div>
                      <div className="rivalry-meta">
                        <span>{meetings} {meetings === 1 ? 'meeting' : 'meetings'}</span>
                        <span className="meta-divider" />
                        <span>Avg rating <strong>{avgRating.toFixed(2)}</strong></span>
                        <span className="meta-divider" />
                        <span>Total rating <strong>{r.totalRating.toFixed(2)}</strong></span>
                      </div>
                      <div className="rivalry-meetings">
                        {r.meetings.map((m, i) => {
                          const won = m.winnerId === fighter.id;
                          return (
                            <div className={`rivalry-meeting ${won ? 'won' : 'lost'}`} key={i}>
                              <span className={`mini-result ${won ? 'W' : 'L'}`}>{won ? 'W' : 'L'}</span>
                              <span className="mini-method">
                                {METHOD_LABELS[m.method]}{m.method !== 'DEC' ? ` R${m.round}` : ''}
                              </span>
                              <span className="mini-rating">{m.rating.toFixed(2)}</span>
                              <span className="mini-event">#{m.eventNum}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number | string; color?: 'green' | 'red' | 'gold' }) {
  return (
    <div className="prr-stat">
      <div className={`prr-val ${color ?? ''}`}>{value}</div>
      <div className="prr-lbl">{label}</div>
    </div>
  );
}
