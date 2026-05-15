/**
 * EventRevealModal — the preview → reveal → summary flow.
 *
 * Phases (controlled by `phase`):
 *   "preview"  — card visible, fighters and tags, no outcomes. "Start the show" button.
 *   "reveal"   — fights revealed one at a time with ~1s pacing. Each fight enters,
 *                pauses, then unveils winner + method + rating. "Skip" jumps to end.
 *   "summary"  — all results shown statically with the headline. "Close" returns to app.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  CardFight,
  EventData,
  EventFight,
  Fighter,
  GameState,
  PreparedEvent,
} from '@/types';
import { DIVISIONS } from '@/data';
import { fullName, recordStr } from '@/sim/fighter';
import { Icon } from '@/icons';
import { Flag } from './Flag';
import { RankBadge } from './RankBadge';
import { METHOD_LABELS, METHOD_ICONS } from './methodLabels';
import { playFightChime, playClick, playTitleSting } from '@/audio/sounds';

type Phase = 'preview' | 'reveal' | 'summary';

interface Props {
  prepared: PreparedEvent;
  fighterMap: Map<string, Fighter>;
  state: GameState;
  /** Called when the user clicks Start: caller runs executeEvent and returns EventData. */
  onExecute: () => EventData | null;
  /** Called when the modal closes (after summary, or via early dismiss). */
  onClose: () => void;
  /** Whether the user has audio enabled. */
  audioEnabled: boolean;
}

const REVEAL_FIGHT_DELAY_MS = 950;   // delay before unveiling each fight result

export function EventRevealModal({ prepared, fighterMap, state, onExecute, onClose, audioEnabled }: Props) {
  const [phase, setPhase] = useState<Phase>('preview');
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [revealedIdx, setRevealedIdx] = useState(-1); // -1 = none revealed yet
  const timerRef = useRef<number | null>(null);

  // Sort the displayed card the way EventView does
  const sortedCard = useMemo(() => {
    return [...prepared.card].sort((a, b) => {
      if (a.isMainEvent && !b.isMainEvent) return -1;
      if (!a.isMainEvent && b.isMainEvent) return 1;
      if (a.isTitleFight && !b.isTitleFight) return -1;
      if (!a.isTitleFight && b.isTitleFight) return 1;
      return 0;
    });
  }, [prepared.card]);

  // Reveal-phase fights, sorted to match the card display
  const revealFights = useMemo(() => {
    if (!eventData) return [];
    return [...eventData.fights].sort((a, b) => {
      if (a.isMainEvent && !b.isMainEvent) return -1;
      if (!a.isMainEvent && b.isMainEvent) return 1;
      if (a.isTitleFight && !b.isTitleFight) return -1;
      if (!a.isTitleFight && b.isTitleFight) return 1;
      return 0;
    });
  }, [eventData]);

  // The reveal is in reverse order: undercards first, main event last (climactic)
  const revealOrder = useMemo(() => {
    return [...revealFights].reverse();
  }, [revealFights]);

  // ESC closes the modal (but not mid-reveal — that'd be confusing)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (phase === 'summary') onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, onClose]);

  // Auto-advance reveals
  useEffect(() => {
    if (phase !== 'reveal') return;
    if (revealedIdx >= revealOrder.length - 1) {
      // All fights revealed — wait a beat then transition to summary
      timerRef.current = window.setTimeout(() => {
        setPhase('summary');
      }, 900);
      return () => {
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }
    timerRef.current = window.setTimeout(() => {
      const nextIdx = revealedIdx + 1;
      const nextFight = revealOrder[nextIdx];
      if (nextFight && audioEnabled) {
        if (nextFight.isTitleFight) playTitleSting();
        playFightChime(nextFight.result.method, nextFight.result.rating);
      }
      setRevealedIdx(nextIdx);
    }, REVEAL_FIGHT_DELAY_MS);
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, revealedIdx, revealOrder, audioEnabled]);

  const handleStart = () => {
    if (audioEnabled) playClick();
    const result = onExecute();
    if (result) {
      setEventData(result);
      setPhase('reveal');
      setRevealedIdx(-1);
    }
  };

  const handleSkip = () => {
    if (audioEnabled) playClick();
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setRevealedIdx(revealOrder.length - 1);
    setPhase('summary');
  };

  const handleClose = () => {
    if (audioEnabled) playClick();
    onClose();
  };

  return (
    <div className="reveal-overlay">
      <div className="reveal-modal" data-phase={phase}>
        <div className={`reveal-header kind-${prepared.kind}`}>
          <div>
            <div className={`reveal-eyebrow kind-${prepared.kind}`}>
              {phase === 'preview' ? 'Up Next' : phase === 'reveal' ? 'Live Results' : 'Event Results'}
              <span className="reveal-eyebrow-kind">
                {prepared.kind === 'main' ? '· Main Event' : '· Cage Night'}
              </span>
            </div>
            <h2 className="reveal-title">{prepared.name}</h2>
            <div className="reveal-meta">
              <Icon name="location" size={12} /> {prepared.city}
              <span className="sub-divider" />
              <Icon name="fight" size={12} /> {prepared.card.length} fights
            </div>
          </div>
          {phase === 'summary' && (
            <button className="icon-btn" onClick={handleClose} title="Close">
              <Icon name="close" size={18} />
            </button>
          )}
        </div>

        {phase === 'preview' && (
          <div className="reveal-body">
            <div className="fight-list">
              {sortedCard.map((cf, i) => (
                <PreviewFightRow key={i} cardFight={cf} fighterMap={fighterMap} state={state} />
              ))}
            </div>
            <div className="reveal-actions">
              <button className="btn-ghost" onClick={handleClose}>
                Cancel
              </button>
              <button className="btn-primary btn-large" onClick={handleStart}>
                <Icon name="play" size={16} />
                Start the show
              </button>
            </div>
          </div>
        )}

        {phase === 'reveal' && (
          <div className="reveal-body">
            <div className="fight-list">
              {revealOrder.map((f, i) => {
                const isCurrent = i === revealedIdx;
                const isRevealed = i <= revealedIdx;
                return (
                  <RevealFightRow
                    key={i}
                    fight={f}
                    state={state}
                    revealed={isRevealed}
                    current={isCurrent}
                    rankChanges={eventData?.rankChanges}
                  />
                );
              })}
            </div>
            <div className="reveal-actions">
              <button className="btn-ghost" onClick={handleSkip}>
                <Icon name="next" size={14} />
                Skip to results
              </button>
            </div>
          </div>
        )}

        {phase === 'summary' && eventData && (
          <div className="reveal-body">
            {eventData.headline && (
              <div className="headline-banner standalone">
                <div className="headline-icon">
                  <Icon name="star" size={18} />
                </div>
                <div className="headline-content">
                  <div className="headline-label">Story of the Night</div>
                  <div className="headline-text">{eventData.headline}</div>
                </div>
              </div>
            )}
            <div className="fight-list">
              {revealFights.map((f, i) => (
                <RevealFightRow
                  key={i}
                  fight={f}
                  state={state}
                  revealed={true}
                  current={false}
                  rankChanges={eventData.rankChanges}
                />
              ))}
            </div>
            <div className="reveal-actions">
              <button className="btn-primary" onClick={handleClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// PREVIEW FIGHT ROW (no result yet)
// ============================================================
function PreviewFightRow({
  cardFight,
  fighterMap,
  state,
}: {
  cardFight: CardFight;
  fighterMap: Map<string, Fighter>;
  state: GameState;
}) {
  const fA = fighterMap.get(cardFight.fAId);
  const fB = fighterMap.get(cardFight.fBId);
  if (!fA || !fB) return null;

  const classes = ['fight-row-compact', 'preview'];
  if (cardFight.isMainEvent) classes.push('main-event');
  if (cardFight.isTitleFight) classes.push('title');

  const tags: { label: string; cls: string }[] = [];
  if (cardFight.isTitleFight) {
    tags.push({ label: `${DIVISIONS[cardFight.division].label} Title`, cls: 'tag-title' });
  } else if (cardFight.isMainEvent) {
    tags.push({ label: 'Main Event', cls: 'tag-main' });
  }
  if (cardFight.priorMeetings >= 1) {
    const word =
      cardFight.priorMeetings === 1
        ? 'Rematch'
        : cardFight.priorMeetings === 2
        ? 'Trilogy'
        : `Meeting ${cardFight.priorMeetings + 1}`;
    tags.push({ label: word, cls: 'tag-rivalry' });
  }

  return (
    <div className={classes.join(' ')} data-div={cardFight.division}>
      <div className="frc-top">
        <div className="frc-tags">
          {tags.length === 0 ? (
            <span className="tag-div">{DIVISIONS[cardFight.division].shortLabel}</span>
          ) : (
            <>
              {tags.map((t, i) => (
                <span key={i} className={`tag ${t.cls}`}>
                  {t.label}
                </span>
              ))}
              <span className="tag-div">{DIVISIONS[cardFight.division].shortLabel}</span>
            </>
          )}
        </div>
        <div className="frc-rating rating-pending">
          <Icon name="clock" size={11} />
          ?
        </div>
      </div>
      <div className="frc-body">
        <div className="frc-fighter left preview-side">
          <RankBadge fighter={fA} state={state} />
          <Flag code={fA.countryCode} size={16} title={fA.country} />
          <div className="frc-fighter-name">{fullName(fA)}</div>
          <div className="frc-fighter-record">{recordStr(fA)}</div>
        </div>
        <div className="frc-mid">
          <div className="frc-method method-pending">VS</div>
        </div>
        <div className="frc-fighter right preview-side">
          <RankBadge fighter={fB} state={state} />
          <Flag code={fB.countryCode} size={16} title={fB.country} />
          <div className="frc-fighter-name">{fullName(fB)}</div>
          <div className="frc-fighter-record">{recordStr(fB)}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// REVEAL FIGHT ROW (animated result reveal)
// ============================================================
function RevealFightRow({
  fight,
  state,
  revealed,
  current,
  rankChanges,
}: {
  fight: EventFight;
  state: GameState;
  revealed: boolean;
  current: boolean;
  rankChanges?: Record<string, { before: string | null; after: string | null }>;
}) {
  const fAIsWinner = fight.result.winnerId === fight.fA.id;
  const classes = ['fight-row-compact', 'reveal-row'];
  if (fight.isMainEvent) classes.push('main-event');
  if (fight.isTitleFight) classes.push('title');
  if (revealed) classes.push('revealed');
  if (current) classes.push('current');
  if (!revealed) classes.push('pending');

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
        {revealed ? (
          <div className={`frc-rating rating-${ratingTier(fight.result.rating)}`}>
            <Icon name="star" size={11} />
            {fight.result.rating.toFixed(2)}
          </div>
        ) : (
          <div className="frc-rating rating-pending">
            <Icon name="clock" size={11} />
            ?
          </div>
        )}
      </div>

      <div className="frc-body">
        <div
          className={`frc-fighter left ${revealed ? (fAIsWinner ? 'winner' : 'loser') : 'preview-side'}`}
        >
          <RankBadge fighter={fight.fA} state={state} />
          <Flag code={fight.fA.countryCode} size={16} title={fight.fA.country} />
          <div className="frc-fighter-name">
            {fullName(fight.fA)}
            {revealed && fAIsWinner && (
              <span className="winner-dot">
                <Icon name="trophy" size={9} />
              </span>
            )}
          </div>
          <div className="frc-fighter-record">{recordStr(fight.fA)}</div>
          {revealed && rankChanges?.[fight.fA.id] && (
            <RankChangeChip change={rankChanges[fight.fA.id]} />
          )}
        </div>
        <div className="frc-mid">
          {revealed ? (
            <>
              <div className="frc-method" data-method={fight.result.method}>
                <Icon name={METHOD_ICONS[fight.result.method]} size={11} />
                {METHOD_LABELS[fight.result.method]}
              </div>
              <div className="frc-duration">{fight.result.duration}</div>
            </>
          ) : (
            <div className="frc-method method-pending">VS</div>
          )}
        </div>
        <div
          className={`frc-fighter right ${revealed ? (!fAIsWinner ? 'winner' : 'loser') : 'preview-side'}`}
        >
          <RankBadge fighter={fight.fB} state={state} />
          <Flag code={fight.fB.countryCode} size={16} title={fight.fB.country} />
          <div className="frc-fighter-name">
            {fullName(fight.fB)}
            {revealed && !fAIsWinner && (
              <span className="winner-dot">
                <Icon name="trophy" size={9} />
              </span>
            )}
          </div>
          <div className="frc-fighter-record">{recordStr(fight.fB)}</div>
          {revealed && rankChanges?.[fight.fB.id] && (
            <RankChangeChip change={rankChanges[fight.fB.id]} />
          )}
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

/**
 * Renders a "rank 12 → 8" indicator with up/down arrow.
 * Hidden if both before and after are null (truly unranked, no change).
 * If after === before, shows a neutral "no change" indicator.
 */
function RankChangeChip({
  change,
}: {
  change: { before: string | null; after: string | null };
}) {
  const { before, after } = change;
  if (!before && !after) return null;

  // Convert to comparable numbers (C = 0, "1".."N" = number, null = 99)
  const num = (r: string | null): number => {
    if (r === null) return 99;
    if (r === 'C') return 0;
    return parseInt(r, 10) || 99;
  };
  const nBefore = num(before);
  const nAfter = num(after);

  // Lower number = better rank. So if nAfter < nBefore the fighter went UP.
  const improved = nAfter < nBefore;
  const declined = nAfter > nBefore;

  const display = (r: string | null) => (r === null ? 'UR' : r === 'C' ? 'C' : `#${r}`);

  const cls = improved ? 'rank-up' : declined ? 'rank-down' : 'rank-same';
  const arrow = improved ? '▲' : declined ? '▼' : '·';

  return (
    <div className={`rank-change-chip ${cls}`}>
      <span className="rank-change-before">{display(before)}</span>
      <span className="rank-change-arrow">{arrow}</span>
      <span className="rank-change-after">{display(after)}</span>
    </div>
  );
}
