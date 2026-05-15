import { useState } from 'react';
import type { Division, GameState } from '@/types';
import { DIVISIONS } from '@/data';
import { fullName, recordStr } from '@/sim/fighter';
import { getGOATRankings } from '@/sim/rankings';
import { getRecentP4P } from '@/sim/recentStats';
import { Icon } from '@/icons';
import { Flag } from './Flag';
import { METHOD_LABELS } from './methodLabels';

interface Props {
  state: GameState;
  division: Division | 'all';
  onFighterClick: (id: string) => void;
}

type SubTab = 'p4p' | 'goat' | 'fights';

export function RecordsView({ state, division, onFighterClick }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('p4p');

  return (
    <div>
      <div className="section-header">
        <Icon name="records" size={18} style={{ color: 'var(--gold)' }} />
        <h2>
          All-Time{division !== 'all' && ` — ${DIVISIONS[division as Division].label}`}
        </h2>
        <div className="accent-line" />
      </div>

      <div className="archive-filter sub-tabs">
        <button
          className={`sub-tab ${subTab === 'p4p' ? 'active' : ''}`}
          onClick={() => setSubTab('p4p')}
        >
          P4P (last 12 months)
        </button>
        <button
          className={`sub-tab ${subTab === 'goat' ? 'active' : ''}`}
          onClick={() => setSubTab('goat')}
        >
          GOAT Meter
        </button>
        <button
          className={`sub-tab ${subTab === 'fights' ? 'active' : ''}`}
          onClick={() => setSubTab('fights')}
        >
          Best Fights
        </button>
      </div>

      {subTab === 'p4p' && <P4PSection state={state} division={division} onFighterClick={onFighterClick} />}
      {subTab === 'goat' && <GOATSection state={state} division={division} onFighterClick={onFighterClick} />}
      {subTab === 'fights' && <BestFightsSection state={state} division={division} onFighterClick={onFighterClick} />}
    </div>
  );
}

// ============================================================
// P4P — rolling 12 months
// ============================================================
function P4PSection({ state, division, onFighterClick }: Props) {
  const all = getRecentP4P(state, 30);
  const filtered = division === 'all'
    ? all
    : all.filter((x) => x.fighter.division === division);
  const shown = filtered.slice(0, 15);

  if (shown.length === 0) {
    return (
      <div className="empty-state">
        <p>No P4P-eligible fighters yet — need at least 2 fights in the last year.</p>
      </div>
    );
  }

  return (
    <div className="goat-list">
      {shown.map((x, i) => {
        const f = x.fighter;
        const r = x.recent;
        return (
          <div className="goat-row p4p-row" key={f.id} onClick={() => onFighterClick(f.id)}>
            <div className="goat-num">{i + 1}</div>
            <Flag code={f.countryCode} size={14} title={f.country} />
            <div className="goat-name">
              {fullName(f)}
              {f.isChampion && <Icon name="champion" size={12} style={{ color: 'var(--gold)', marginLeft: 6 }} />}
            </div>
            <div className="goat-record">{r.wins}-{r.losses}</div>
            <div className="goat-div">
              <span className="div-pill" data-div={f.division}>{DIVISIONS[f.division].shortLabel}</span>
            </div>
            <div className="p4p-fame" title="Career fame">
              <Icon name="star" size={10} />
              {Math.round(f.fame)}
            </div>
            <div className="goat-points">
              <span className="goat-points-val">{r.p4pPoints.toFixed(1)}</span>
              <span className="goat-points-lbl">P4P (12mo)</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// GOAT — all-time including retired
// ============================================================
function GOATSection({ state, division, onFighterClick }: Props) {
  const goats = getGOATRankings(state, 25).filter((f) =>
    division === 'all' ? true : f.division === division
  );

  if (goats.length === 0) {
    return (
      <div className="empty-state">
        <p>No careers tracked yet.</p>
      </div>
    );
  }

  return (
    <div className="goat-list">
      {goats.map((f, i) => (
        <div className="goat-row" key={f.id} onClick={() => onFighterClick(f.id)}>
          <div className="goat-num">{i + 1}</div>
          <Flag code={f.countryCode} size={14} title={f.country} />
          <div className="goat-name">
            {fullName(f)}
            {f.hallOfFame && <Icon name="hallOfFame" size={12} style={{ color: 'var(--gold)', marginLeft: 6 }} />}
            {f.retired && <span className="retired-tag">Retired</span>}
          </div>
          <div className="goat-record">{recordStr(f)}</div>
          <div className="goat-div"><span className="div-pill" data-div={f.division}>{DIVISIONS[f.division].shortLabel}</span></div>
          <div className="goat-points">
            <span className="goat-points-val">{f.careerPoints.toFixed(1)}</span>
            <span className="goat-points-lbl">P4P pts</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// BEST FIGHTS
// ============================================================
function BestFightsSection({ state, division, onFighterClick }: Props) {
  const bestFights = (state.bestFightsAllTime ?? [])
    .filter((bf) => (division === 'all' ? true : bf.division === division))
    .slice(0, 20);

  if (bestFights.length === 0) {
    return (
      <div className="empty-state">
        <p>Best fights will appear once events have been simulated.</p>
      </div>
    );
  }

  return (
    <div className="best-fights">
      {bestFights.map((bf, i) => (
        <div className={`best-fight-row rating-${ratingTier(bf.rating)}`} key={`${bf.eventNum}-${i}`}>
          <div className="bf-rank">{i + 1}</div>
          <div className="bf-rating">{bf.rating.toFixed(2)}</div>
          <div className="bf-fighters">
            <span className="bf-winner" onClick={() => onFighterClick(bf.winnerId)}>{bf.winnerName}</span>
            <span className="bf-vs">def.</span>
            <span className="bf-loser" onClick={() => onFighterClick(bf.loserId)}>{bf.loserName}</span>
          </div>
          <div className="bf-method">
            {METHOD_LABELS[bf.method]}{bf.method !== 'DEC' ? ` R${bf.round}` : ''}
          </div>
          <div className="bf-meta">
            {bf.isTitleFight && <Icon name="champion" size={11} style={{ color: 'var(--gold)' }} />}
            <span className="div-pill" data-div={bf.division}>{DIVISIONS[bf.division].shortLabel}</span>
            <span className="bf-event">#{bf.eventNum}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ratingTier(r: number): string {
  if (r >= 9.0) return 'epic';
  if (r >= 8.0) return 'great';
  if (r >= 7.0) return 'strong';
  if (r >= 5.0) return 'good';
  return 'normal';
}
