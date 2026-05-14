import { useMemo, useState } from 'react';
import type { Division, GameState } from '@/types';
import { ARCHETYPES, DIVISION_KEYS, DIVISIONS } from '@/data';
import { fullName, recordStr } from '@/sim/fighter';
import { getDivisionRankings } from '@/sim/rankings';
import { Icon } from '@/icons';

interface Props {
  state: GameState;
  onFighterClick: (id: string) => void;
}

type StatusFilter = 'all' | 'active' | 'retired' | 'ranked' | 'hof';
type DivisionFilter = Division | 'all';

export function RosterView({ state, onFighterClick }: Props) {
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

  const fighters = useMemo(() => {
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

  return (
    <div>
      <div className="roster-header">
        <div className="section-header" style={{ margin: 0 }}>
          <Icon name="roster" size={18} style={{ color: 'var(--gold)' }} />
          <h2>Roster ({fighters.length})</h2>
        </div>
        <div className="roster-filters">
          <div className="input-wrap">
            <span className="input-icon"><Icon name="search" size={14} /></span>
            <input
              type="text"
              placeholder="Search fighter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select value={division} onChange={(e) => setDivision(e.target.value as DivisionFilter)}>
            <option value="all">All Divisions</option>
            {DIVISION_KEYS.map((d) => (
              <option key={d} value={d}>{DIVISIONS[d].label}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="retired">Retired</option>
            <option value="ranked">Ranked Top 10</option>
            <option value="hof">Hall of Fame</option>
          </select>
        </div>
      </div>

      {fighters.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon name="search" size={28} /></div>
          <h3>No fighters match</h3>
          <p>Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="roster-list">
          {fighters.map((f) => {
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
                  {fullName(f)}
                  <span>{f.flag}</span>
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
      )}
    </div>
  );
}
