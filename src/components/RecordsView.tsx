import type { Division, Fighter, GameState, TitleReign } from '@/types';
import { DIVISIONS } from '@/data';
import { fullName, recordStr } from '@/sim/fighter';
import { Icon, type IconName } from '@/icons';

interface Props {
  state: GameState;
  division: Division | 'all';
  onFighterClick: (id: string) => void;
}

interface RecordDef {
  label: string;
  icon: IconName;
  getter: (f: Fighter) => number;
  suffix: string;
}

type LongestReign = TitleReign & { duration: number };

export function RecordsView({ state, division, onFighterClick }: Props) {
  const fighters = division === 'all'
    ? state.fighters
    : state.fighters.filter((f) => f.division === division);

  const reigns = division === 'all'
    ? state.titleHistory
    : state.titleHistory.filter((r) => r.division === division);

  const records: RecordDef[] = [
    { label: 'Most Career Wins',     icon: 'trophy',     getter: (f) => f.wins,                       suffix: 'wins' },
    { label: 'Most KO Wins',         icon: 'knockout',   getter: (f) => f.koWins,                     suffix: 'KOs' },
    { label: 'Most Submission Wins', icon: 'submission', getter: (f) => f.subWins,                    suffix: 'subs' },
    { label: 'Longest Win Streak',   icon: 'medal',      getter: (f) => f.longestWinStreak,           suffix: 'fights' },
    { label: 'Most Title Defenses',  icon: 'champion',   getter: (f) => f.titleDefenses,              suffix: 'def.' },
    { label: 'Most Title Reigns',    icon: 'star',       getter: (f) => f.titleReigns,                suffix: 'reigns' },
    { label: 'Most Total Fights',    icon: 'fight',      getter: (f) => f.wins + f.losses + f.draws,  suffix: 'fights' },
  ];

  const longestReign = reigns.reduce<LongestReign | null>((acc, r) => {
    const end = r.endEvent ?? state.eventCount;
    const dur = end - r.startEvent + 1;
    if (!acc || dur > acc.duration) return { ...r, duration: dur };
    return acc;
  }, null);

  const youngest = reigns.reduce<TitleReign | null>((acc, r) => {
    if (!acc || r.startAge < acc.startAge) return r;
    return acc;
  }, null);

  const oldest = reigns.reduce<TitleReign | null>((acc, r) => {
    if (!acc || r.startAge > acc.startAge) return r;
    return acc;
  }, null);

  const cards: JSX.Element[] = [];

  for (const rec of records) {
    if (fighters.length === 0) break;
    const sorted = [...fighters].sort((a, b) => rec.getter(b) - rec.getter(a));
    const top = sorted[0];
    const val = rec.getter(top);
    if (val === 0) continue;
    cards.push(
      <div className="record-card" key={rec.label}>
        <div className="record-icon"><Icon name={rec.icon} size={18} /></div>
        <div className="record-label">{rec.label}</div>
        <div className="record-value">{val}<span className="record-value-suffix">{rec.suffix}</span></div>
        <div className="record-holder" onClick={() => onFighterClick(top.id)}>
          {fullName(top)}
        </div>
        <div className="record-context">
          {recordStr(top)} • {DIVISIONS[top.division].shortLabel}{top.retired ? ' • Retired' : ''}
        </div>
      </div>
    );
  }

  if (longestReign) {
    cards.push(
      <div className="record-card" key="longest-reign">
        <div className="record-icon"><Icon name="champion" size={18} /></div>
        <div className="record-label">Longest Title Reign</div>
        <div className="record-value">{longestReign.duration}<span className="record-value-suffix">events</span></div>
        <div className="record-holder" onClick={() => onFighterClick(longestReign.fighterId)}>
          {longestReign.fighterName}
        </div>
        <div className="record-context">
          {longestReign.defenses} defenses • {DIVISIONS[longestReign.division].shortLabel} reign #{longestReign.reignNum}
        </div>
      </div>
    );
  }

  if (youngest) {
    cards.push(
      <div className="record-card" key="youngest">
        <div className="record-icon"><Icon name="star" size={18} /></div>
        <div className="record-label">Youngest Champion</div>
        <div className="record-value">Age {youngest.startAge}</div>
        <div className="record-holder" onClick={() => onFighterClick(youngest.fighterId)}>
          {youngest.fighterName}
        </div>
        <div className="record-context">
          {DIVISIONS[youngest.division].shortLabel} • Crowned at Event #{youngest.startEvent}
        </div>
      </div>
    );
  }

  if (oldest && (!youngest || oldest.fighterId !== youngest.fighterId)) {
    cards.push(
      <div className="record-card" key="oldest">
        <div className="record-icon"><Icon name="hallOfFame" size={18} /></div>
        <div className="record-label">Oldest Champion</div>
        <div className="record-value">Age {oldest.startAge}</div>
        <div className="record-holder" onClick={() => onFighterClick(oldest.fighterId)}>
          {oldest.fighterName}
        </div>
        <div className="record-context">
          {DIVISIONS[oldest.division].shortLabel} • Crowned at Event #{oldest.startEvent}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <Icon name="records" size={18} style={{ color: 'var(--gold)' }} />
        <h2>
          All-Time Records {division !== 'all' && `— ${DIVISIONS[division as Division].label}`}
        </h2>
        <div className="accent-line" />
      </div>
      {cards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon name="records" size={28} /></div>
          <h3>No records yet</h3>
          <p>Records will appear as fights happen.</p>
        </div>
      ) : (
        <div className="records-grid">{cards}</div>
      )}
    </div>
  );
}
