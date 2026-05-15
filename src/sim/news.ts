/**
 * News feed.
 *
 * The news feed surfaces narrative events between fights: injuries, retirements,
 * title strips, hype boosts, milestones, classic-fight tags, comebacks, call-outs.
 *
 * News is bounded (NEWS_FEED_CAP). Newest-first when read.
 */
import type { GameState, NewsEntry, NewsKind } from '@/types';
import { NEWS_FEED_CAP } from '@/data';
import { uid } from './random';

interface AddNewsInput {
  state: GameState;
  eventNum: number;
  kind: NewsKind;
  text: string;
  fighterId?: string | null;
  fighterBId?: string | null;
}

export function addNews({
  state,
  eventNum,
  kind,
  text,
  fighterId = null,
  fighterBId = null,
}: AddNewsInput): NewsEntry {
  const entry: NewsEntry = {
    id: uid('news'),
    eventNum,
    kind,
    text,
    fighterId,
    fighterBId,
  };
  state.news.push(entry);
  // Bound to cap (drop oldest at the front)
  if (state.news.length > NEWS_FEED_CAP) {
    state.news.splice(0, state.news.length - NEWS_FEED_CAP);
  }
  return entry;
}

/** Read the news feed, newest-first. */
export function getRecentNews(state: GameState, limit = 50): NewsEntry[] {
  // News is appended in order, so reverse for newest-first.
  return [...state.news].reverse().slice(0, limit);
}

/** News entries associated with a single event (preserves append order). */
export function getEventNews(state: GameState, eventNum: number): NewsEntry[] {
  return state.news.filter((n) => n.eventNum === eventNum);
}
