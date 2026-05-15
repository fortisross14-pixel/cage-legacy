import { useMemo, useState } from 'react';
import type { ArchivedFight, EventArchiveEntry, EventKind, GameState } from '@/types';
import { DIVISIONS } from '@/data';
import { Icon } from '@/icons';
import { METHOD_LABELS, METHOD_ICONS } from './methodLabels';

interface Props {
  state: GameState;
  onFighterClick: (id: string) => void;
}

type Filter = 'visible' | 'main' | 'normal' | 'prospect' | 'all';

export function EventArchiveView({ state, onFighterClick }: Props) {
  const [filter, setFilter] = useState<Filter>('visible');

  const allEvents = useMemo(
    () => [...state.eventArchive].sort((a, b) => b.num - a.num),
    [state.eventArchive]
  );

  const events = useMemo(() => {
    if (filter === 'visible') return allEvents.filter((e) => e.kind !== 'prospect');
    if (filter === 'all') return allEvents;
    return allEvents.filter((e) => e.kind === filter);
  }, [allEvents, filter]);

  const [selectedNum, setSelectedNum] = useState<number | null>(
    events.length > 0 ? events[0].num : null
  );

  // If the current selection isn't in the filtered list, fall back to first
  const effectiveSelected = useMemo(() => {
    if (selectedNum !== null && events.some((e) => e.num === selectedNum)) {
      return events.find((e) => e.num === selectedNum) ?? null;
    }
    return events[0] ?? null;
  }, [events, selectedNum]);

  const counts = useMemo(
    () => ({
      main: allEvents.filter((e) => e.kind === 'main').length,
      normal: allEvents.filter((e) => e.kind === 'normal').length,
      prospect: allEvents.filter((e) => e.kind === 'prospect').length,
    }),
    [allEvents]
  );

  return (
    <div>
      <div className="section-header">
        <Icon name="archive" size={18} style={{ color: 'var(--gold)' }} />
        <h2>Event Archive</h2>
        <div className="accent-line" />
      </div>

      <div className="archive-filter sub-tabs">
        <button
          className={`sub-tab ${filter === 'visible' ? 'active' : ''}`}
          onClick={() => setFilter('visible')}
        >
          Main + Cage Nights ({counts.main + counts.normal})
        </button>
        <button
          className={`sub-tab ${filter === 'main' ? 'active' : ''}`}
          onClick={() => setFilter('main')}
        >
          Main only ({counts.main})
        </button>
        <button
          className={`sub-tab ${filter === 'normal' ? 'active' : ''}`}
          onClick={() => setFilter('normal')}
        >
          Cage Nights ({counts.normal})
        </button>
        <button
          className={`sub-tab ${filter === 'prospect' ? 'active' : ''}`}
          onClick={() => setFilter('prospect')}
        >
          Prospect Series ({counts.prospect})
        </button>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="archive" size={28} />
          </div>
          <h3>No events yet</h3>
          <p>Once you run events they'll appear here, fully browsable.</p>
        </div>
      ) : (
        <div className="archive-layout">
          {/* Left: list */}
          <div className="archive-list">
            {events.map((e) => (
              <button
                key={e.num}
                className={`archive-row ${effectiveSelected?.num === e.num ? 'active' : ''} kind-${e.kind}`}
                onClick={() => setSelectedNum(e.num)}
              >
                <div className={`archive-row-kind kind-${e.kind}`}>
                  {e.kind === 'main' ? `CL ${e.kindNum}` : e.kind === 'normal' ? `CN ${e.kindNum}` : `PR ${e.kindNum}`}
                </div>
                <div className="archive-row-info">
                  <div className="archive-row-name">{e.name}</div>
                  <div className="archive-row-meta">
                    <Icon name="location" size={10} /> {e.city}
                    <span className="sub-divider" />
                    {e.fightCount} fights
                    {e.titleFightCount > 0 && (
                      <>
                        <span className="sub-divider" />
                        <Icon name="champion" size={10} /> {e.titleFightCount} title
                      </>
                    )}
                  </div>
                </div>
                {e.topRating > 0 && (
                  <div className={`archive-row-rating rating-${ratingTier(e.topRating)}`}>
                    <Icon name="star" size={10} />
                    {e.topRating.toFixed(2)}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Right: detail */}
          <div className="archive-detail">
            {effectiveSelected ? (
              <ArchiveDetail entry={effectiveSelected} onFighterClick={onFighterClick} />
            ) : (
              <div className="empty-state inline">Select an event to view its card.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ArchiveDetail({
  entry,
  onFighterClick,
}: {
  entry: EventArchiveEntry;
  onFighterClick: (id: string) => void;
}) {
  // Same sort order EventView uses
  const sorted = [...entry.fights].sort((a, b) => {
    if (a.isMainEvent && !b.isMainEvent) return -1;
    if (!a.isMainEvent && b.isMainEvent) return 1;
    if (a.isTitleFight && !b.isTitleFight) return -1;
    if (!a.isTitleFight && b.isTitleFight) return 1;
    return 0;
  });

  return (
    <div className="archive-detail-inner">
      <div className="archive-detail-head">
        <h3>{entry.name}</h3>
        <div className="archive-detail-meta">
          <Icon name="location" size={12} />
          <span>{entry.city}</span>
          <span className="sub-divider" />
          <Icon name="fight" size={12} />
          <span>{entry.fightCount} fights</span>
        </div>
      </div>

      {entry.headline && (
        <div className="headline-banner standalone">
          <div className="headline-icon">
            <Icon name="star" size={18} />
          </div>
          <div className="headline-content">
            <div className="headline-label">Story of the Night</div>
            <div className="headline-text">{entry.headline}</div>
          </div>
        </div>
      )}

      <div className="fight-list">
        {sorted.map((f, i) => (
          <ArchivedFightRow key={i} fight={f} onFighterClick={onFighterClick} />
        ))}
      </div>
    </div>
  );
}

function ArchivedFightRow({
  fight,
  onFighterClick,
}: {
  fight: ArchivedFight;
  onFighterClick: (id: string) => void;
}) {
  const fAIsWinner = fight.winnerId === fight.fAId;
  const classes = ['fight-row-compact'];
  if (fight.isMainEvent) classes.push('main-event');
  if (fight.isTitleFight) classes.push('title');

  const tags: { label: string; cls: string }[] = [];
  if (fight.isTitleFight) {
    tags.push({ label: `${DIVISIONS[fight.division].label} Title`, cls: 'tag-title' });
  } else if (fight.isMainEvent) {
    tags.push({ label: 'Main Event', cls: 'tag-main' });
  }
  if (fight.priorMeetings >= 1) {
    const word =
      fight.priorMeetings === 1
        ? 'Rematch'
        : fight.priorMeetings === 2
        ? 'Trilogy'
        : `Meeting ${fight.priorMeetings + 1}`;
    tags.push({ label: word, cls: 'tag-rivalry' });
  }

  return (
    <div className={classes.join(' ')} data-div={fight.division}>
      <div className="frc-top">
        <div className="frc-tags">
          {tags.length === 0 ? (
            <span className="tag-div">{DIVISIONS[fight.division].shortLabel}</span>
          ) : (
            <>
              {tags.map((t, i) => (
                <span key={i} className={`tag ${t.cls}`}>
                  {t.label}
                </span>
              ))}
              <span className="tag-div">{DIVISIONS[fight.division].shortLabel}</span>
            </>
          )}
        </div>
        <div className={`frc-rating rating-${ratingTier(fight.rating)}`}>
          <Icon name="star" size={11} />
          {fight.rating.toFixed(2)}
        </div>
      </div>

      <div className="frc-body">
        <div
          className={`frc-fighter left ${fAIsWinner ? 'winner' : 'loser'}`}
          onClick={() => onFighterClick(fight.fAId)}
        >
          <div className="frc-fighter-name">
            {fight.fAName}
            {fAIsWinner && (
              <span className="winner-dot">
                <Icon name="trophy" size={9} />
              </span>
            )}
          </div>
        </div>
        <div className="frc-mid">
          <div className="frc-method" data-method={fight.method}>
            <Icon name={METHOD_ICONS[fight.method]} size={11} />
            {METHOD_LABELS[fight.method]}
          </div>
          <div className="frc-duration">{fight.duration}</div>
        </div>
        <div
          className={`frc-fighter right ${!fAIsWinner ? 'winner' : 'loser'}`}
          onClick={() => onFighterClick(fight.fBId)}
        >
          <div className="frc-fighter-name">
            {fight.fBName}
            {!fAIsWinner && (
              <span className="winner-dot">
                <Icon name="trophy" size={9} />
              </span>
            )}
          </div>
        </div>
      </div>
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
