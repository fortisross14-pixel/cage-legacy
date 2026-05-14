import type { EventData, Fighter } from '@/types';
import { DIVISIONS } from '@/data';
import { fullName, recordStr } from '@/sim/fighter';
import { Icon } from '@/icons';
import { METHOD_LABELS, METHOD_ICONS } from './methodLabels';

interface Props {
  eventData: EventData | null;
  onSimulate: () => void;
  onFighterClick: (id: string) => void;
}

export function EventView({ eventData, onSimulate, onFighterClick }: Props) {
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
        <div className="event-card">
          {eventData.headline && (
            <div className="headline-banner">
              <div className="headline-icon">
                <Icon name="star" size={18} />
              </div>
              <div className="headline-content">
                <div className="headline-label">Story of the Night</div>
                <div className="headline-text">{eventData.headline}</div>
              </div>
            </div>
          )}

          {eventData.fights.map((fight, idx) => {
            const fAIsWinner = fight.result.winnerId === fight.fA.id;
            const classes = ['fight-row'];
            if (fight.isMainEvent) classes.push('main-event');

            return (
              <div className={classes.join(' ')} data-div={fight.division} key={idx}>
                {(fight.isTitleFight || fight.isMainEvent) && (
                  <div className="fight-banner">
                    <span className={fight.isTitleFight ? 'title-tag' : 'main-event-tag'}>
                      {fight.isTitleFight ? (
                        <>
                          <Icon name="champion" size={12} />
                          {DIVISIONS[fight.division].label} Title
                        </>
                      ) : (
                        <>Main Event</>
                      )}
                    </span>
                    <span className="div-tag">{DIVISIONS[fight.division].shortLabel}</span>
                  </div>
                )}
                {!fight.isTitleFight && !fight.isMainEvent && (
                  <div className="fight-banner">
                    <span />
                    <span className="div-tag">{DIVISIONS[fight.division].shortLabel}</span>
                  </div>
                )}
                <FighterBlock fighter={fight.fA} isWinner={fAIsWinner} side="left" onClick={onFighterClick} />
                <div className="vs-block">
                  <div className={`vs-method method-${fight.result.method}`}>
                    <Icon name={METHOD_ICONS[fight.result.method]} size={12} />
                    {METHOD_LABELS[fight.result.method]}
                  </div>
                  <div className="vs-round">
                    {fight.result.method === 'DEC'
                      ? `After ${fight.result.round} rounds`
                      : `Round ${fight.result.round}`}
                  </div>
                </div>
                <FighterBlock fighter={fight.fB} isWinner={!fAIsWinner} side="right" onClick={onFighterClick} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface FighterBlockProps {
  fighter: Fighter;
  isWinner: boolean;
  side: 'left' | 'right';
  onClick: (id: string) => void;
}

function FighterBlock({ fighter, isWinner, side, onClick }: FighterBlockProps) {
  return (
    <div
      className={`fighter-block ${side} ${isWinner ? 'winner' : 'loser'}`}
      onClick={() => onClick(fighter.id)}
    >
      <div className="fighter-name">
        <span>{fullName(fighter)}</span>
        {isWinner && (
          <span className="winner-mark">
            <Icon name="trophy" size={10} />
          </span>
        )}
      </div>
      {fighter.nickname && <div className="fighter-nick">"{fighter.nickname}"</div>}
      <div className="fighter-record">{recordStr(fighter)}</div>
    </div>
  );
}
