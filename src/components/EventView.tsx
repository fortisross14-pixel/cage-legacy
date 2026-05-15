import type { EventData, EventFight, Fighter, GameState } from '@/types';
import { DIVISIONS } from '@/data';
import { fullName, recordStr } from '@/sim/fighter';
import { Icon } from '@/icons';
import { Flag } from './Flag';
import { RankBadge } from './RankBadge';
import { METHOD_LABELS, METHOD_ICONS } from './methodLabels';

interface Props {
  eventData: EventData | null;
  state: GameState;
  onSimulate: () => void;
  onFighterClick: (id: string) => void;
}

export function EventView({ eventData, state, onSimulate, onFighterClick }: Props) {
  return (
    <div>
      <div className="event-header">
        <div className="event-title-block">
          <h2>{eventData ? eventData.name : 'Welcome to Cage Legacy'}</h2>
          {eventData ? (
            <div className="event-sub">
              <Icon name="location" size={14} />
              <span>{eventData.city}</span>
              <span className="sub-divider" />
              <Icon name="fight" size={14} />
              <span>{eventData.fights.length} fights across 4 divisions</span>
            </div>
          ) : (
            <div className="event-sub">
              <span>Press "Simulate Next Event" to begin the universe.</span>
            </div>
          )}
        </div>
        <button className="btn-primary" onClick={onSimulate}>
          <Icon name="play" size={16} />
          Simulate Next Event
        </button>
      </div>

      {!eventData ? (
        <div className="event-card">
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="fight" size={28} />
            </div>
            <h3>No fights yet</h3>
            <p>A new MMA universe is waiting to be born.</p>
          </div>
        </div>
      ) : (
        <>
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
            {eventData.fights.map((fight, idx) => (
              <FightRow key={idx} fight={fight} state={state} onFighterClick={onFighterClick} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// COMPACT FIGHT ROW
// ============================================================
function FightRow({
  fight,
  state,
  onFighterClick,
}: {
  fight: EventFight;
  state: GameState;
  onFighterClick: (id: string) => void;
}) {
  const fAIsWinner = fight.result.winnerId === fight.fA.id;
  const classes = ['fight-row-compact'];
  if (fight.isMainEvent) classes.push('main-event');
  if (fight.isTitleFight) classes.push('title');

  // Significance tags row
  const tags: { label: string; cls: string; icon?: React.ReactNode }[] = [];
  if (fight.isTitleFight) {
    tags.push({
      label: `${DIVISIONS[fight.division].label} Title`,
      cls: 'tag-title',
      icon: <Icon name="champion" size={11} />,
    });
  } else if (fight.isMainEvent) {
    tags.push({ label: 'Main Event', cls: 'tag-main' });
  }
  if (fight.priorMeetings >= 1) {
    const word = fight.priorMeetings === 1 ? 'Rematch' : fight.priorMeetings === 2 ? 'Trilogy' : `Meeting ${fight.priorMeetings + 1}`;
    tags.push({ label: word, cls: 'tag-rivalry', icon: <Icon name="fight" size={11} /> });
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
                  {t.icon}
                  {t.label}
                </span>
              ))}
              <span className="tag-div">{DIVISIONS[fight.division].shortLabel}</span>
            </>
          )}
        </div>
        <div className={`frc-rating rating-${ratingTier(fight.result.rating)}`}>
          <Icon name="star" size={11} />
          {fight.result.rating.toFixed(2)}
        </div>
      </div>

      <div className="frc-body">
        <FighterSide fighter={fight.fA} state={state} isWinner={fAIsWinner} side="left" onClick={onFighterClick} />
        <div className="frc-mid">
          <div className={`frc-method method-${fight.result.method}`}>
            <Icon name={METHOD_ICONS[fight.result.method]} size={11} />
            {METHOD_LABELS[fight.result.method]}
          </div>
          <div className="frc-duration">{fight.result.duration}</div>
        </div>
        <FighterSide fighter={fight.fB} state={state} isWinner={!fAIsWinner} side="right" onClick={onFighterClick} />
      </div>
    </div>
  );
}

function FighterSide({
  fighter,
  state,
  isWinner,
  side,
  onClick,
}: {
  fighter: Fighter;
  state: GameState;
  isWinner: boolean;
  side: 'left' | 'right';
  onClick: (id: string) => void;
}) {
  return (
    <div
      className={`frc-fighter ${side} ${isWinner ? 'winner' : 'loser'}`}
      onClick={() => onClick(fighter.id)}
    >
      <RankBadge fighter={fighter} state={state} />
      <Flag code={fighter.countryCode} size={16} title={fighter.country} />
      <div className="frc-fighter-name">
        {fullName(fighter)}
        {isWinner && (
          <span className="winner-dot">
            <Icon name="trophy" size={9} />
          </span>
        )}
      </div>
      <div className="frc-fighter-record">{recordStr(fighter)}</div>
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
