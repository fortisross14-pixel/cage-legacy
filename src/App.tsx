import { useCallback, useEffect, useState } from 'react';
import type { Division } from '@/types';
import { useGameState } from '@/state/useGameState';
import { Icon, type IconName } from '@/icons';
import { TopBar } from '@/components/TopBar';
import { DivisionTabs } from '@/components/DivisionTabs';
import { EventView } from '@/components/EventView';
import { RankingsView } from '@/components/RankingsView';
import { TitleHistoryView } from '@/components/TitleHistoryView';
import { RecordsView } from '@/components/RecordsView';
import { RosterView } from '@/components/RosterView';
import { FighterProfile } from '@/components/FighterProfile';

type Tab = 'event' | 'rankings' | 'history' | 'records' | 'roster';

interface TabConfig {
  id: Tab;
  label: string;
  icon: IconName;
}

const TABS: TabConfig[] = [
  { id: 'event',    label: 'Latest Event',     icon: 'home' },
  { id: 'rankings', label: 'Rankings',         icon: 'rankings' },
  { id: 'history',  label: 'Title History',    icon: 'history' },
  { id: 'records',  label: 'All-Time Records', icon: 'records' },
  { id: 'roster',   label: 'Roster',           icon: 'roster' },
];

export function App() {
  const { state, simulateEvent, reset, fighterMap } = useGameState();
  const [tab, setTab] = useState<Tab>('event');
  const [division, setDivision] = useState<Division>('lightweight');
  const [profileId, setProfileId] = useState<string | null>(null);

  const handleReset = useCallback(() => {
    if (confirm('Reset all data and start a new universe? This cannot be undone.')) {
      reset();
    }
  }, [reset]);

  // Space to sim, Esc to close modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inputFocused = ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName);
      if (e.code === 'Space' && !inputFocused && !profileId) {
        e.preventDefault();
        simulateEvent();
      }
      if (e.key === 'Escape') setProfileId(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [simulateEvent, profileId]);

  const showDivisionTabs = tab === 'rankings' || tab === 'history' || tab === 'records';
  const profileFighter = profileId ? fighterMap.get(profileId) ?? null : null;

  return (
    <div className="app">
      <TopBar state={state} onReset={handleReset} />

      <nav className="nav-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </nav>

      {showDivisionTabs && <DivisionTabs selected={division} onSelect={setDivision} />}

      <main>
        {tab === 'event' && (
          <EventView
            eventData={state.lastEvent}
            onSimulate={simulateEvent}
            onFighterClick={setProfileId}
          />
        )}
        {tab === 'rankings' && (
          <RankingsView state={state} division={division} onFighterClick={setProfileId} />
        )}
        {tab === 'history' && (
          <TitleHistoryView state={state} division={division} onFighterClick={setProfileId} />
        )}
        {tab === 'records' && (
          <RecordsView state={state} division={division} onFighterClick={setProfileId} />
        )}
        {tab === 'roster' && (
          <RosterView state={state} onFighterClick={setProfileId} />
        )}
      </main>

      <FighterProfile fighter={profileFighter} state={state} onClose={() => setProfileId(null)} />
    </div>
  );
}
