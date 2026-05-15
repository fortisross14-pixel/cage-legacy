import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameState, EventData, PreparedEvent } from '@/types';
import {
  prepareNextEvent as engPrepare,
  executeEvent as engExecute,
  seedInitialRoster,
} from '@/sim/event';
import { loadSlotGameState, saveSlotGameState } from './useUniverses';

function createNewGame(): GameState {
  const state: GameState = {
    eventCount: 0,
    mainEventCount: 0,
    normalEventCount: 0,
    prospectEventCount: 0,
    divisionLastFightEvent: {},
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

/**
 * Game state for one universe slot.
 *
 * Two-step event flow:
 *   prepareEvent() — builds the card (mutates state for injuries/eventCount).
 *                    Caller stores the returned PreparedEvent in UI state and
 *                    shows the preview.
 *   executeEvent(prepared) — runs the prepared fights. Returns the EventData.
 *
 * One-step convenience also provided: simulateEvent() does both.
 */
export function useGameState(slotId: string) {
  const [state, setState] = useState<GameState>(() => loadSlotGameState(slotId) ?? createNewGame());

  // Re-load when the active slot changes
  useEffect(() => {
    const loaded = loadSlotGameState(slotId);
    if (loaded) setState(loaded);
    else setState(createNewGame());
  }, [slotId]);

  // Persist on every change
  useEffect(() => {
    saveSlotGameState(slotId, state);
  }, [slotId, state]);

  /**
   * Step 1: build the card for the next user-visible event.
   *
   * Any prospect events that come up first get auto-simmed silently — they
   * happen on the calendar and the results land in the archive, but the user
   * never sees a preview/reveal for them.
   *
   * Returns the prepared event the user should preview (main or normal).
   */
  const prepareEvent = useCallback((): PreparedEvent => {
    const next: GameState = JSON.parse(JSON.stringify(state));
    let prepared = engPrepare(next);
    // Auto-sim any prospect events that come up before a visible event
    while (prepared.kind === 'prospect') {
      engExecute(next, prepared);
      prepared = engPrepare(next);
    }
    setState(next);
    return prepared;
  }, [state]);

  /**
   * Step 2: execute the prepared fights. Uses CURRENT state (post-prepare).
   * The prepared event is passed in; this runs the fights and commits results.
   */
  const executeEvent = useCallback(
    (prepared: PreparedEvent): EventData | null => {
      const next: GameState = JSON.parse(JSON.stringify(state));
      const result = engExecute(next, prepared);
      setState(next);
      return result;
    },
    [state]
  );

  /**
   * Convenience: prepare + execute back-to-back (one-step sim).
   * Auto-sims any prospect events on the way to a user-visible event,
   * then runs the visible event.
   */
  const simulateEvent = useCallback((): EventData | null => {
    const next: GameState = JSON.parse(JSON.stringify(state));
    let prepared = engPrepare(next);
    while (prepared.kind === 'prospect') {
      engExecute(next, prepared);
      prepared = engPrepare(next);
    }
    const result = engExecute(next, prepared);
    setState(next);
    return result;
  }, [state]);

  const reset = useCallback(() => {
    setState(createNewGame());
  }, []);

  const fighterMap = useMemo(() => {
    const m = new Map<string, (typeof state.fighters)[number]>();
    for (const f of state.fighters) m.set(f.id, f);
    return m;
  }, [state.fighters]);

  return { state, prepareEvent, executeEvent, simulateEvent, reset, fighterMap };
}
