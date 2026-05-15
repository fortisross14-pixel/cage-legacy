import { useMemo } from 'react';
import type { GameState, NewsEntry, NewsKind } from '@/types';
import { Icon, type IconName } from '@/icons';
import { getRecentNews } from '@/sim/news';

interface Props {
  state: GameState;
  onFighterClick: (id: string) => void;
}

interface KindConfig {
  icon: IconName;
  color: string;
  label: string;
}

const KIND_CONFIG: Record<NewsKind, KindConfig> = {
  injury:        { icon: 'injury',     color: 'var(--orange)',      label: 'Injury' },
  replacement:   { icon: 'comeback',   color: 'var(--cyan-bright)', label: 'Replacement' },
  'hype-boost':  { icon: 'hype',       color: 'var(--gold-bright)', label: 'Hype' },
  'title-strip': { icon: 'titleStrip', color: 'var(--red-bright)',  label: 'Title Vacated' },
  retirement:    { icon: 'retire',     color: 'var(--text-dim)',    label: 'Retirement' },
  comeback:      { icon: 'comeback',   color: 'var(--green)',       label: 'Comeback' },
  milestone:     { icon: 'trophy',     color: 'var(--gold-bright)', label: 'Milestone' },
  'fight-classic': { icon: 'star',     color: 'var(--gold-bright)', label: 'Classic' },
  debut:         { icon: 'comeback',   color: 'var(--cyan-bright)', label: 'Debut' },
  'call-out':    { icon: 'callOut',    color: 'var(--purple)',      label: 'Call-out' },
};

export function NewsFeedView({ state, onFighterClick }: Props) {
  const news = useMemo(() => getRecentNews(state, 100), [state]);

  // Group by event num for chronological clarity
  const groups = useMemo(() => groupByEvent(news), [news]);

  return (
    <div>
      <div className="section-header">
        <Icon name="news" size={18} style={{ color: 'var(--gold)' }} />
        <h2>News Feed</h2>
        <div className="accent-line" />
      </div>

      {news.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="news" size={28} />
          </div>
          <h3>The news desk is quiet</h3>
          <p>Run an event or two to see headlines roll in.</p>
        </div>
      ) : (
        <div className="news-feed">
          {groups.map((g) => (
            <div className="news-group" key={g.eventNum}>
              <div className="news-group-header">
                <span className="news-group-event">Event #{g.eventNum}</span>
                <span className="news-group-line" />
              </div>
              <div className="news-group-items">
                {g.items.map((n) => (
                  <NewsRow key={n.id} entry={n} onFighterClick={onFighterClick} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewsRow({
  entry,
  onFighterClick,
}: {
  entry: NewsEntry;
  onFighterClick: (id: string) => void;
}) {
  const cfg = KIND_CONFIG[entry.kind];
  return (
    <div className={`news-row news-kind-${entry.kind}`}>
      <div className="news-icon" style={{ color: cfg.color }}>
        <Icon name={cfg.icon} size={16} />
      </div>
      <div className="news-body">
        <div className="news-kind-label" style={{ color: cfg.color }}>
          {cfg.label}
        </div>
        <div className="news-text">{linkifyFighters(entry, onFighterClick)}</div>
      </div>
    </div>
  );
}

/**
 * The text already has fighter names baked in. To keep the clickable behavior
 * simple, we render plain text but provide a small inline "view profile" link
 * for the primary fighter when present. This keeps the news feed crisp.
 */
function linkifyFighters(
  entry: NewsEntry,
  onFighterClick: (id: string) => void
): React.ReactNode {
  // Render plain text; if the primary fighter is set, append a subtle profile link.
  // The text itself contains the fighter's name, so the link is just a click affordance.
  if (!entry.fighterId) return entry.text;
  return (
    <>
      <span
        className="news-clickable"
        onClick={() => onFighterClick(entry.fighterId!)}
        title="Open profile"
      >
        {entry.text}
      </span>
    </>
  );
}

function groupByEvent(news: NewsEntry[]): { eventNum: number; items: NewsEntry[] }[] {
  const map = new Map<number, NewsEntry[]>();
  for (const n of news) {
    const list = map.get(n.eventNum) ?? [];
    list.push(n);
    map.set(n.eventNum, list);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([eventNum, items]) => ({ eventNum, items }));
}
