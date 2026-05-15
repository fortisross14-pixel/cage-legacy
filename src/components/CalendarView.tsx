/**
 * CalendarView — month-grid showing past + upcoming events.
 *
 * Past events come from state.eventArchive. Upcoming events are derived from
 * the event-cadence math (every 21 days starting Jan 1, 2025). The next ~12
 * upcoming events are projected so users can see what's on deck.
 */
import { useMemo, useState } from 'react';
import type { EventArchiveEntry, EventKind, GameState } from '@/types';
import { CADENCE } from '@/data';
import { Icon } from '@/icons';
import { computeDate } from '@/sim/event';

interface Props {
  state: GameState;
  onArchiveClick: (eventNum: number) => void;
}

interface CalendarEvent {
  num: number;
  kindNum: number;
  kind: EventKind;
  name: string;
  date: Date;
  past: boolean;
  topRating?: number;
  titleFightCount?: number;
}

const UPCOMING_PROJECTION = 12;

export function CalendarView({ state, onArchiveClick }: Props) {
  const events = useMemo<CalendarEvent[]>(() => {
    const past: CalendarEvent[] = state.eventArchive.map((e: EventArchiveEntry) => ({
      num: e.num,
      kindNum: e.kindNum,
      kind: e.kind,
      name: e.name,
      date: new Date(e.date),
      past: true,
      topRating: e.topRating,
      titleFightCount: e.titleFightCount,
    }));

    // Project upcoming events using the rotation pattern
    const upcoming: CalendarEvent[] = [];
    let upcomingMain = state.mainEventCount;
    let upcomingAlt = state.alternateEventCount;
    for (let i = 1; i <= UPCOMING_PROJECTION; i++) {
      const num = state.eventCount + i;
      const rotationIdx = (state.eventCount + i - 1) % CADENCE.KIND_PATTERN.length;
      const kind: EventKind = CADENCE.KIND_PATTERN[rotationIdx];
      let label: string;
      let kindNum: number;
      if (kind === 'main') {
        upcomingMain++;
        kindNum = upcomingMain;
        label = `CL ${upcomingMain}`;
      } else {
        upcomingAlt++;
        kindNum = upcomingAlt;
        label = `Cage Night ${upcomingAlt}`;
      }
      upcoming.push({
        num,
        kindNum,
        kind,
        name: label,
        date: new Date(computeDate(num)),
        past: false,
      });
    }
    return [...past, ...upcoming];
  }, [state.eventArchive, state.eventCount, state.mainEventCount, state.alternateEventCount]);

  // Default month: where the most recent event is, or current real date.
  const initialMonth = useMemo(() => {
    if (events.length === 0) return new Date(2025, 0, 1);
    const lastPast = [...events].reverse().find((e) => e.past) ?? events[0];
    return new Date(lastPast.date.getFullYear(), lastPast.date.getMonth(), 1);
  }, [events]);

  const [viewMonth, setViewMonth] = useState<Date>(initialMonth);

  const monthEvents = useMemo(() => {
    return events.filter(
      (e) =>
        e.date.getFullYear() === viewMonth.getFullYear() &&
        e.date.getMonth() === viewMonth.getMonth()
    );
  }, [events, viewMonth]);

  const monthLabel = viewMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const goPrev = () => {
    const d = new Date(viewMonth);
    d.setMonth(d.getMonth() - 1);
    setViewMonth(d);
  };
  const goNext = () => {
    const d = new Date(viewMonth);
    d.setMonth(d.getMonth() + 1);
    setViewMonth(d);
  };

  const cells = useMemo(() => buildMonthGrid(viewMonth, monthEvents), [viewMonth, monthEvents]);

  return (
    <div>
      <div className="section-header">
        <Icon name="calendar" size={18} style={{ color: 'var(--gold)' }} />
        <h2>Calendar</h2>
        <div className="accent-line" />
      </div>

      <div className="calendar-controls">
        <button className="icon-btn" onClick={goPrev} title="Previous month">
          <Icon name="prev" size={16} />
        </button>
        <div className="calendar-month-label">{monthLabel}</div>
        <button className="icon-btn" onClick={goNext} title="Next month">
          <Icon name="next" size={16} />
        </button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((d) => (
          <div key={d} className="calendar-weekday">{d}</div>
        ))}
        {cells.map((cell, i) => (
          <CalendarCell key={i} cell={cell} onArchiveClick={onArchiveClick} />
        ))}
      </div>

      <div className="calendar-legend">
        <span className="calendar-legend-item">
          <span className="calendar-legend-dot kind-main" /> CL (main, may include title)
        </span>
        <span className="calendar-legend-item">
          <span className="calendar-legend-dot kind-alt" /> Cage Night (no titles)
        </span>
        <span className="calendar-legend-item">
          <span className="calendar-legend-dot upcoming" /> Upcoming
        </span>
      </div>
    </div>
  );
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Cell {
  day: number;            // 0 = padding
  inMonth: boolean;
  events: CalendarEvent[];
}

function buildMonthGrid(viewMonth: Date, monthEvents: CalendarEvent[]): Cell[] {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventsByDay = new Map<number, CalendarEvent[]>();
  for (const e of monthEvents) {
    const day = e.date.getDate();
    const arr = eventsByDay.get(day) ?? [];
    arr.push(e);
    eventsByDay.set(day, arr);
  }

  const cells: Cell[] = [];
  // Leading blanks
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ day: 0, inMonth: false, events: [] });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, inMonth: true, events: eventsByDay.get(day) ?? [] });
  }
  // Pad trailing to multiple of 7
  while (cells.length % 7 !== 0) {
    cells.push({ day: 0, inMonth: false, events: [] });
  }
  return cells;
}

function CalendarCell({
  cell,
  onArchiveClick,
}: {
  cell: Cell;
  onArchiveClick: (n: number) => void;
}) {
  if (!cell.inMonth) {
    return <div className="calendar-cell calendar-cell-blank" />;
  }
  const hasEvent = cell.events.length > 0;
  return (
    <div className={`calendar-cell ${hasEvent ? 'has-event' : ''}`}>
      <div className="calendar-cell-day">{cell.day}</div>
      <div className="calendar-cell-events">
        {cell.events.map((e) => {
          const isPast = e.past;
          const hasTitle = (e.titleFightCount ?? 0) > 0;
          const isMain = e.kind === 'main';
          const classes = ['calendar-event'];
          if (isPast) classes.push('past');
          else classes.push('upcoming');
          if (isMain) classes.push('kind-main');
          else classes.push('kind-alt');
          if (hasTitle) classes.push('has-title');
          const shortLabel = isMain ? `CL ${e.kindNum}` : `CN ${e.kindNum}`;
          const titleAttr =
            e.name +
            (e.topRating ? ` — top fight ${e.topRating.toFixed(2)}` : '') +
            (isMain ? '' : ' (no title fights)');
          return (
            <button
              key={e.num}
              className={classes.join(' ')}
              onClick={() => isPast && onArchiveClick(e.num)}
              disabled={!isPast}
              title={titleAttr}
            >
              <span className="calendar-event-num">{shortLabel}</span>
              {hasTitle && <Icon name="champion" size={9} />}
              {e.topRating !== undefined && e.topRating >= 7.0 && (
                <Icon name="star" size={9} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
