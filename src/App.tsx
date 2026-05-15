import { useCallback, useEffect, useState } from 'react';
import type { Division, PreparedEvent } from '@/types';
import { useGameState } from '@/state/useGameState';
import { useUniverses } from '@/state/useUniverses';
import { useSettings } from '@/state/useSettings';
import { Icon, type IconName } from '@/icons';
import { TopBar } from '@/components/TopBar';
import { DivisionTabs } from '@/components/DivisionTabs';
import { EventView } from '@/components/EventView';
import { RankingsView } from '@/components/RankingsView';
import { TitleHistoryView } from '@/components/TitleHistoryView';
import { RecordsView } from '@/components/RecordsView';
import { RosterView } from '@/components/RosterView';
import { FighterProfile } from '@/components/FighterProfile';
import { NewsFeedView } from '@/components/NewsFeedView';
import { EventArchiveView } from '@/components/EventArchiveView';
import { CalendarView } from '@/components/CalendarView';
import { HomeScreen } from '@/components/HomeScreen';
import { EventRevealModal } from '@/components/EventRevealModal';
import { resumeAudio } from '@/audio/sounds';

type Tab = 'event' | 'news' | 'calendar' | 'archive' | 'rankings' | 'history' | 'records' | 'roster';

interface TabConfig {
  id: Tab;
  label: string;
  icon: IconName;
}

const TABS: TabConfig[] = [
  { id: 'event',    label: 'Latest Event',     icon: 'home' },
  { id: 'news',     label: 'News',             icon: 'news' },
  { id: 'calendar', label: 'Calendar',         icon: 'calendar' },
  { id: 'archive',  label: 'Archive',          icon: 'archive' },
  { id: 'rankings', label: 'Rankings',         icon: 'rankings' },
  { id: 'history',  label: 'Title History',    icon: 'history' },
  { id: 'records',  label: 'All-Time', icon: 'records' },
  { id: 'roster',   label: 'Roster',           icon: 'roster' },
];

export function App() {
  const universes = useUniverses();
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const { settings, update: updateSetting } = useSettings();

  // If there's only one universe and we have nothing selected, auto-pick it on first mount.
  // (Users with one save shouldn't see a picker every time.)
  useEffect(() => {
    if (activeSlotId === null && universes.universes.length === 1) {
      setActiveSlotId(universes.universes[0].id);
    }
  }, [activeSlotId, universes.universes]);

  // No active slot — show the home screen
  if (activeSlotId === null) {
    return (
      <HomeScreen
        universes={universes.universes}
        onSelect={setActiveSlotId}
        onCreate={universes.createUniverse}
        onRename={universes.renameUniverse}
        onDelete={universes.deleteUniverse}
      />
    );
  }

  return (
    <ActiveUniverse
      slotId={activeSlotId}
      universeName={
        universes.universes.find((u) => u.id === activeSlotId)?.name ?? 'Universe'
      }
      onGoHome={() => setActiveSlotId(null)}
      audioEnabled={settings.audioEnabled}
      skipReveal={settings.skipReveal}
      onToggleAudio={() => {
        const newVal = !settings.audioEnabled;
        updateSetting('audioEnabled', newVal);
        if (newVal) resumeAudio();
      }}
      onToggleSkipReveal={() => updateSetting('skipReveal', !settings.skipReveal)}
      onUniverseUpdate={(eventCount) =>
        universes.updateSlotMeta(activeSlotId, { eventCount })
      }
    />
  );
}

// ============================================================
// ACTIVE UNIVERSE — once a slot is selected
// ============================================================
interface ActiveProps {
  slotId: string;
  universeName: string;
  onGoHome: () => void;
  audioEnabled: boolean;
  skipReveal: boolean;
  onToggleAudio: () => void;
  onToggleSkipReveal: () => void;
  onUniverseUpdate: (eventCount: number) => void;
}

function ActiveUniverse({
  slotId,
  universeName,
  onGoHome,
  audioEnabled,
  skipReveal,
  onToggleAudio,
  onToggleSkipReveal,
  onUniverseUpdate,
}: ActiveProps) {
  const { state, prepareEvent, executeEvent, simulateEvent, reset, fighterMap } =
    useGameState(slotId);
  const [tab, setTab] = useState<Tab>('event');
  const [division, setDivision] = useState<Division>('lightweight');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [pendingPrep, setPendingPrep] = useState<PreparedEvent | null>(null);

  // Push event count back up to the universes index so the home screen shows current.
  useEffect(() => {
    onUniverseUpdate(state.eventCount);
  }, [state.eventCount, onUniverseUpdate]);

  const handleSimulate = useCallback(() => {
    if (skipReveal) {
      simulateEvent();
    } else {
      const prepared = prepareEvent();
      setPendingPrep(prepared);
    }
  }, [skipReveal, simulateEvent, prepareEvent]);

  const handleRevealExecute = useCallback(() => {
    if (!pendingPrep) return null;
    return executeEvent(pendingPrep);
  }, [pendingPrep, executeEvent]);

  const handleRevealClose = useCallback(() => {
    setPendingPrep(null);
  }, []);

  const handleReset = useCallback(() => {
    if (confirm('Reset this universe and start over? This cannot be undone.')) {
      reset();
    }
  }, [reset]);

  // Open archive entry from calendar
  const handleArchiveOpen = useCallback((_eventNum: number) => {
    setTab('archive');
    // EventArchiveView opens to the most recent by default; that's fine for now.
    // (Could thread a selected event num down to it if we wanted exact deep-linking.)
  }, []);

  // Space to sim, Esc to close modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inputFocused = ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName);
      if (e.code === 'Space' && !inputFocused && !profileId && !pendingPrep) {
        e.preventDefault();
        handleSimulate();
      }
      if (e.key === 'Escape') setProfileId(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSimulate, profileId, pendingPrep]);

  const showDivisionTabs = tab === 'rankings' || tab === 'history' || tab === 'records';
  const profileFighter = profileId ? fighterMap.get(profileId) ?? null : null;

  return (
    <div className="app">
      <TopBar
        state={state}
        universeName={universeName}
        onHome={onGoHome}
        onReset={handleReset}
        audioEnabled={audioEnabled}
        onToggleAudio={onToggleAudio}
        skipReveal={skipReveal}
        onToggleSkipReveal={onToggleSkipReveal}
      />

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
            state={state}
            onSimulate={handleSimulate}
            onFighterClick={setProfileId}
          />
        )}
        {tab === 'news' && (
          <NewsFeedView state={state} onFighterClick={setProfileId} />
        )}
        {tab === 'calendar' && (
          <CalendarView state={state} onArchiveClick={handleArchiveOpen} />
        )}
        {tab === 'archive' && (
          <EventArchiveView state={state} onFighterClick={setProfileId} />
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

      {pendingPrep && (
        <EventRevealModal
          prepared={pendingPrep}
          fighterMap={fighterMap}
          state={state}
          onExecute={handleRevealExecute}
          onClose={handleRevealClose}
          audioEnabled={audioEnabled}
        />
      )}
    </div>
  );
}
