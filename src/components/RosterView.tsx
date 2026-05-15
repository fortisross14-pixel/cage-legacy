import { useMemo, useState } from 'react';
import type { Division, GameState } from '@/types';
import { ARCHETYPES, DIVISION_KEYS, DIVISIONS } from '@/data';
import { fullName, recordStr } from '@/sim/fighter';
import { getDivisionRankings, getP4PRankings } from '@/sim/rankings';
import { Icon } from '@/icons';
import { Flag } from './Flag';

interface Props {
  state: GameState;
  onFighterClick: (id: string) => void;
}

type RosterTab = 'all' | 'p4p';
type StatusFilter = 'all' | 'active' | 'retired' | 'ranked' | 'hof';
type DivisionFilter = Division | 'all';

export function RosterView({ state, onFighterClick }: Props) {
  const [subTab, setSubTab] = useState<RosterTab>('all');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [division, setDivision] = useState<DivisionFilter>('all');

  const rankedSets = useMemo(() => {
    const sets: Partial<Record<Division, Set<string>>> = {};
    for (const d of DIVISION_KEYS) {
      sets[d] = new Set(getDivisionRankings(state, d).slice(0, 10).map((f) => f.id));
    }
    return sets;
  }, [state]);

  const rankIndex = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of DIVISION_KEYS) {
      const ranked = getDivisionRankings(state, d);
      ranked.forEach((f, i) => map.set(f.id, i));
    }
    return map;
  }, [state]);

  // ---- All Fighters tab ----
  const allFiltered = useMemo(() => {
    let arr = state.fighters;
    if (division !== 'all') arr = arr.filter((f) => f.division === division);
    if (status === 'active') arr = arr.filter((f) => !f.retired);
    else if (status === 'retired') arr = arr.filter((f) => f.retired);
    else if (status === 'hof') arr = arr.filter((f) => f.hallOfFame);
    else if (status === 'ranked') {
      arr = arr.filter((f) => f.isChampion || rankedSets[f.division]?.has(f.id));
    }

    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (f) =>
          fullName(f).toLowerCase().includes(q) ||
          (f.nickname && f.nickname.toLowerCase().includes(q))
      );
    }

    return [...arr].sort((a, b) => {
      if (a.isChampion && !b.isChampion) return -1;
      if (!a.isChampion && b.isChampion) return 1;
      if (!a.retired && b.retired) return -1;
      if (a.retired && !b.retired) return 1;
      const ra = rankIndex.get(a.id) ?? 999;
      const rb = rankIndex.get(b.id) ?? 999;
      return ra - rb;
    });
  }, [state.fighters, division, status, search, rankedSets, rankIndex]);

  // ---- P4P tab ----
  const p4pList = useMemo(() => {
    const list = getP4PRankings(state, 15);
    if (division === 'all') return list;
    return list.filter((f) => f.division === division);
  }, [state, division]);

  return (
    <div>
      <div className="roster-header">
        <div className="section-header" style={{ margin: 0 }}>
          <Icon name="roster" size={18} style={{ color: 'var(--gold)' }} />
          <h2>Roster</h2>
        </div>
        <div className="roster-filters">
          {subTab === 'all' && (
            <div className="input-wrap">
              <span className="input-icon"><Icon name="search" size={14} /></span>
              <input
                type="text"
                placeholder="Search fighter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          <select value={division} onChange={(e) => setDivision(e.target.value as DivisionFilter)}>
            <option value="all">All Divisions</option>
            {DIVISION_KEYS.map((d) => (
              <option key={d} value={d}>{DIVISIONS[d].label}</option>
            ))}
          </select>
          {subTab === 'all' && (
            <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="retired">Retired</option>
              <option value="ranked">Ranked Top 10</option>
              <option value="hof">Hall of Fame</option>
            </select>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="sub-tabs">
        <button
          className={`sub-tab ${subTab === 'all' ? 'active' : ''}`}
          onClick={() => setSubTab('all')}
        >
          <Icon name="roster" size={13} /> All Fighters ({allFiltered.length})
        </button>
        <button
          className={`sub-tab ${subTab === 'p4p' ? 'active' : ''}`}
          onClick={() => setSubTab('p4p')}
        >
          <Icon name="star" size={13} /> Pound for Pound
        </button>
      </div>

      {subTab === 'all' && (
        allFiltered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon name="search" size={28} /></div>
            <h3>No fighters match</h3>
            <p>Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="roster-list">
            {allFiltered.map((f) => {
              const classes = ['roster-card'];
              if (f.retired) classes.push('retired');
              if (f.isChampion) classes.push('champion');
              return (
                <div key={f.id} className={classes.join(' ')} onClick={() => onFighterClick(f.id)}>
                  <div className="badge-row">
                    {f.isChampion && <Icon name="champion" size={14} />}
                    {f.hallOfFame && <Icon name="hallOfFame" size={14} />}
                  </div>
                  <div className="rc-name">
                    <Flag code={f.countryCode} size={14} title={f.country} />
                    <span>{fullName(f)}</span>
                  </div>
                  {f.nickname && <div className="rc-nick">"{f.nickname}"</div>}
                  <div className="rc-meta">
                    <span className="rc-record">{recordStr(f)}</span>
                    <span className={`rarity-tag rarity-${f.rarity}`}>{f.rarity}</span>
                  </div>
                  <div className="rc-info-row">
                    <span className="rc-age">
                      {f.retired ? 'Retired' : `Age ${f.age}`} • {ARCHETYPES[f.archetype].label}
                    </span>
                    <span className="div-pill" data-div={f.division}>{DIVISIONS[f.division].shortLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {subTab === 'p4p' && (
        p4pList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon name="star" size={28} /></div>
            <h3>No P4P data yet</h3>
            <p>P4P rankings appear once active fighters accumulate fight ratings.</p>
          </div>
        ) : (
          <div className="p4p-list">
            {p4pList.map((f, i) => (
              <div className="p4p-row" key={f.id} onClick={() => onFighterClick(f.id)}>
                <div className="p4p-rank">{i + 1}</div>
                <Flag code={f.countryCode} size={14} title={f.country} />
                <div className="p4p-info">
                  <div className="p4p-name">
                    {fullName(f)}
                    {f.isChampion && <Icon name="champion" size={12} style={{ color: 'var(--gold)', marginLeft: 6 }} />}
                  </div>
                  <div className="p4p-meta">
                    {recordStr(f)} • {DIVISIONS[f.division].shortLabel} • Fame {Math.round(f.fame)}
                  </div>
                </div>
                <div className="p4p-points">
                  <span className="p4p-points-val">{f.careerPoints.toFixed(1)}</span>
                  <span className="p4p-points-lbl">P4P pts</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
