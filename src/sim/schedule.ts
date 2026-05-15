/**
 * Event schedule generator.
 *
 * Anchored to real calendar days:
 *   - Weekends (Fri/Sat/Sun): one event per weekend.
 *       First weekend of the month → MAIN event.
 *       Other weekends → NORMAL events.
 *   - Mid-week (1st + 3rd Wednesday of each month): PROSPECT events.
 *
 * Starting anchor: Jan 1, 2025. The schedule produces events in chronological
 * order indefinitely. Each call to `nextEventSlot(state)` looks at the last
 * event's date in the archive (or the anchor if empty) and computes the next
 * slot after it.
 */
import type { EventKind } from '@/types';

export const ANCHOR_DATE = new Date(2025, 0, 1); // Jan 1, 2025

export interface EventSlot {
  date: Date;
  kind: EventKind;
}

/**
 * Returns the next event slot strictly after the given date.
 */
export function nextSlotAfter(after: Date): EventSlot {
  // Walk day-by-day until we find one of:
  //   - Friday/Saturday/Sunday that is the FIRST such day in the current "weekend"
  //     and there's no earlier weekend-day in the same week with a closer match.
  //     Actually: we pick the EARLIEST weekend day of each weekend.
  //   - 1st or 3rd Wednesday of the month.
  //
  // Algorithm:
  //   For each day starting from after+1:
  //     If it's the 1st or 3rd Wednesday → prospect slot.
  //     If it's a Friday → weekend slot (skip Sat/Sun of same weekend).
  //   Determine kind for weekend: first weekend of month → main, else normal.

  const d = new Date(after);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);

  // Cap the search to avoid infinite loops
  for (let i = 0; i < 60; i++) {
    if (isProspectWednesday(d)) {
      return { date: new Date(d), kind: 'prospect' };
    }
    if (d.getDay() === 5 /* Friday */) {
      const kind: EventKind = isFirstWeekendOfMonth(d) ? 'main' : 'normal';
      return { date: new Date(d), kind };
    }
    d.setDate(d.getDate() + 1);
  }
  // Fallback (shouldn't hit) — return d as a normal event
  return { date: new Date(d), kind: 'normal' };
}

/** True if the given date is the 1st or 3rd Wednesday of its month. */
function isProspectWednesday(d: Date): boolean {
  if (d.getDay() !== 3) return false;
  const day = d.getDate();
  // 1st Wed: day in [1..7], 3rd Wed: day in [15..21]
  return day <= 7 || (day >= 15 && day <= 21);
}

/** True if d (a Friday) is the first Friday of its month. */
function isFirstWeekendOfMonth(d: Date): boolean {
  return d.getDay() === 5 && d.getDate() <= 7;
}

/**
 * Compute the slot for event #N from scratch (used when computing future
 * projections, e.g. for the calendar view).
 */
export function slotForEventNum(eventNum: number): EventSlot {
  let cur = new Date(ANCHOR_DATE);
  cur.setDate(cur.getDate() - 1); // so the first call returns the first slot ≥ Jan 1
  for (let i = 0; i < eventNum; i++) {
    cur = nextSlotAfter(cur).date;
  }
  // Compute the kind for that final date
  if (isProspectWednesday(cur)) return { date: cur, kind: 'prospect' };
  if (cur.getDay() === 5) {
    return { date: cur, kind: isFirstWeekendOfMonth(cur) ? 'main' : 'normal' };
  }
  return { date: cur, kind: 'normal' };
}
