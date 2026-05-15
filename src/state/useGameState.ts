import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameState } from '@/types';
import { runEvent, seedInitialRoster } from '@/sim/event';

const STORAGE_KEY = 'cage_legacy_save_v4';

function createNewGame(): GameState {
  const state: GameState = {
    eventCount: 0,
    fighters: [],
    titleHistory: [],
    eventArchive: [],
    lastEvent: null,
    rivalries: {},
    bestFightsAllTime: [],
    news: [],
  };
  seedInitialRoster(state);
  return state;
}

function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed.fighters || !Array.isArray(parsed.fighters)) return null;
    // Defensive defaults if loading partially-shaped data
    if (!parsed.rivalries) parsed.rivalries = {};
    if (!parsed.bestFightsAllTime) parsed.bestFightsAllTime = [];
    if (!parsed.news) parsed.news = [];
    // Back-fill `injured` for any fighter saved before the field existed
    for (const f of parsed.fighters) {
      if (typeof (f as { injured?: number }).injured !== 'number') {
        (f as { injured: number }).injured = 0;
      }
    }
    return parsed;
  } catch (e) {
    console.warn('Load failed', e);
    return null;
  }
}

function saveGame(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Save failed', e);
  }
}

export function useGameState() {
  const [state, setState] = useState<GameState>(() => loadGame() ?? createNewGame());

  useEffect(() => {
    saveGame(state);
  }, [state]);

  const simulateEvent = useCallback(() => {
    setState((prev) => {
      const next: GameState = JSON.parse(JSON.stringify(prev));
      runEvent(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const fresh = createNewGame();
    setState(fresh);
  }, []);

  const fighterMap = useMemo(() => {
    const m = new Map<string, (typeof state.fighters)[number]>();
    for (const f of state.fighters) m.set(f.id, f);
    return m;
  }, [state.fighters]);

  return { state, simulateEvent, reset, fighterMap };
}
