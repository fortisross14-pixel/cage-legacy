import { useState } from 'react';
import type { Fighter, FighterStats, GameState } from '@/types';
import { ARCHETYPES, DIVISIONS } from '@/data';
import { fullName } from '@/sim/fighter';
import { getRecentStats } from '@/sim/recentStats';
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
  const recent = getRecentStats(state, fighter);

  // Compute total reign duration in months (assume 6 events/month at standard cadence)
  const totalReignEvents = reigns.reduce((sum, r) => {
    const end = r.endEvent ?? state.eventCount;
    return sum + Math.max(0, end - r.startEvent + 1);
  }, 0);
  const reignDurationMonths = (totalReignEvents / 6).toFixed(1);

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

        {/* Title summary line */}
        <div className="profile-title-line">
          <div className="title-line-item">
            <div className="title-line-val">{fighter.titleReigns}</div>
            <div className="title-line-lbl">Reigns</div>
          </div>
          <div className="title-line-sep" />
          <div className="title-line-item">
            <div className="title-line-val">{fighter.titleDefenses}</div>
            <div className="title-line-lbl">Defenses</div>
          </div>
          <div className="title-line-sep" />
          <div className="title-line-item">
            <div className="title-line-val">{reignDurationMonths}</div>
            <div className="title-line-lbl">Months as champ</div>
          </div>
        </div>

        {/* Period stats table — last 12mo vs career */}
        <div className="period-table">
          <div className="period-row period-header">
            <div className="period-label">Period</div>
            <div className="period-cell">W-L</div>
            <div className="period-cell">Fame</div>
            <div className="period-cell">P4P</div>
            <div className="period-cell">Sub</div>
            <div className="period-cell">KO/TKO</div>
            <div className="period-cell">Dec</div>
          </div>
          <div className="period-row">
            <div className="period-label">Last 12 months</div>
            <div className="period-cell">{recent.wins}-{recent.losses}</div>
            <div className="period-cell">—</div>
            <div className="period-cell">{recent.p4pPoints.toFixed(1)}</div>
            <div className="period-cell">{recent.subWins}</div>
            <div className="period-cell">{recent.koWins}</div>
            <div className="period-cell">{recent.decWins}</div>
          </div>
          <div className="period-row">
            <div className="period-label">Career</div>
            <div className="period-cell">{fighter.wins}-{fighter.losses}</div>
            <div className="period-cell">{Math.round(fighter.fame)}</div>
            <div className="period-cell">{fighter.careerPoints.toFixed(1)}</div>
            <div className="period-cell">{fighter.subWins}</div>
            <div className="period-cell">{fighter.koWins}</div>
            <div className="period-cell">{fighter.decWins}</div>
          </div>
        </div>

        {/* Career rank chart */}
        <RankCareerChart fighter={fighter} state={state} />

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

/**
 * RankCareerChart — visualizes a fighter's rank trajectory over time.
 * X-axis = events (chronological). Y-axis = rank, top to bottom.
 *   Top of chart = Champion ('C')
 *   Next 15 rows = ranks 1-15
 *   Bottom row = "Low rank" (#16+)
 */
function RankCareerChart({ fighter, state }: { fighter: Fighter; state: GameState }) {
  const history = fighter.rankHistory ?? [];
  if (history.length === 0) {
    return (
      <div className="profile-section">
        <h3><Icon name="medal" size={12} /> Career Rank Trajectory</h3>
        <div className="empty-state inline">No fights yet — chart will populate as the fighter competes.</div>
      </div>
    );
  }

  // SVG dimensions
  const W = 600;
  const H = 200;
  const PAD_L = 56;
  const PAD_R = 12;
  const PAD_T = 12;
  const PAD_B = 28;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  // Y rows: 0=C, 1-15=#1..#15, 16=low. Total 17 slots.
  const ROWS = 17;
  const rowHeight = plotH / (ROWS - 1);
  const rankToRow = (rank: string | null): number => {
    if (rank === 'C') return 0;
    if (rank === null) return 16;
    const n = parseInt(rank, 10);
    if (isNaN(n)) return 16;
    if (n <= 15) return n;
    return 16; // ranks below #15 collapse to "low"
  };

  // X axis: from first history entry's eventNum to current eventCount
  const firstEvent = history[0].eventNum;
  const lastEvent = state.eventCount;
  const range = Math.max(1, lastEvent - firstEvent);

  // Build the line: extend last point to current eventCount
  const points: Array<{ x: number; y: number; rank: string | null; eventNum: number }> = [];
  for (const h of history) {
    const x = PAD_L + ((h.eventNum - firstEvent) / range) * plotW;
    const y = PAD_T + rankToRow(h.rank) * rowHeight;
    points.push({ x, y, rank: h.rank, eventNum: h.eventNum });
  }
  // Step interpolation — extend each segment until the next event
  const segments: string[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const nextX = i + 1 < points.length ? points[i + 1].x : PAD_L + plotW;
    segments.push(`M ${p.x.toFixed(1)} ${p.y.toFixed(1)} L ${nextX.toFixed(1)} ${p.y.toFixed(1)}`);
    if (i + 1 < points.length) {
      const next = points[i + 1];
      segments.push(`L ${nextX.toFixed(1)} ${next.y.toFixed(1)}`);
    }
  }
  const pathD = segments.join(' ');

  // Y-axis labels at key rows
  const yLabels: Array<{ row: number; label: string }> = [
    { row: 0, label: 'C' },
    { row: 1, label: '#1' },
    { row: 5, label: '#5' },
    { row: 10, label: '#10' },
    { row: 15, label: '#15' },
    { row: 16, label: 'low' },
  ];

  // X-axis: tick marks every ~3 months (18 events)
  const xTickStep = 18;
  const xTicks: Array<{ x: number; label: string }> = [];
  for (let e = firstEvent; e <= lastEvent; e += xTickStep) {
    const x = PAD_L + ((e - firstEvent) / range) * plotW;
    xTicks.push({ x, label: `E${e}` });
  }

  return (
    <div className="profile-section">
      <h3><Icon name="medal" size={12} /> Career Rank Trajectory</h3>
      <div className="rank-chart-wrap">
        <svg
          className="rank-chart"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Career rank chart"
        >
          {/* gridlines */}
          {yLabels.map((yl) => {
            const y = PAD_T + yl.row * rowHeight;
            return (
              <line
                key={`grid-${yl.row}`}
                x1={PAD_L}
                x2={W - PAD_R}
                y1={y}
                y2={y}
                className={`rank-chart-grid ${yl.row === 0 ? 'is-c' : ''}`}
              />
            );
          })}
          {/* y labels */}
          {yLabels.map((yl) => (
            <text
              key={`ylab-${yl.row}`}
              x={PAD_L - 6}
              y={PAD_T + yl.row * rowHeight + 4}
              className={`rank-chart-ylabel ${yl.row === 0 ? 'is-c' : ''}`}
              textAnchor="end"
            >
              {yl.label}
            </text>
          ))}
          {/* x ticks */}
          {xTicks.map((t, i) => (
            <text
              key={`xt-${i}`}
              x={t.x}
              y={H - PAD_B + 16}
              className="rank-chart-xlabel"
              textAnchor="middle"
            >
              {t.label}
            </text>
          ))}
          {/* The trajectory line */}
          <path d={pathD} className="rank-chart-line" />
          {/* Dots at each transition */}
          {points.map((p, i) => (
            <circle
              key={`pt-${i}`}
              cx={p.x}
              cy={p.y}
              r={p.rank === 'C' ? 4 : 2.5}
              className={`rank-chart-dot ${p.rank === 'C' ? 'is-c' : ''}`}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
