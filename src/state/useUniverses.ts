/**
 * Universe slot management.
 *
 * - A "universe" is a named save slot with its own GameState.
 * - Slot metadata lives at INDEX_KEY: `[ {id, name, createdAt, lastPlayedAt, eventCount} ]`
 * - Each slot's GameState lives at SAVE_KEY_PREFIX + id.
 *
 * The previous single-slot key (cage_legacy_save_v4) is migrated to a slot
 * named "Cage Legacy" on first run if found.
 */
import { useCallback, useEffect, useState } from 'react';
import type { GameState } from '@/types';
import { uid } from '@/sim/random';

const INDEX_KEY = 'cage_legacy_universes_v1';
const SAVE_KEY_PREFIX = 'cage_legacy_save_v5_';
const LEGACY_SINGLE_KEY = 'cage_legacy_save_v4';

export interface UniverseMeta {
  id: string;
  name: string;
  createdAt: number;        // ms epoch
  lastPlayedAt: number;     // ms epoch
  eventCount: number;       // snapshot for the slot list
}

// ============================================================
// PERSISTENCE
// ============================================================

function readIndex(): UniverseMeta[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeIndex(metas: UniverseMeta[]): void {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(metas));
  } catch (e) {
    console.warn('Save universe index failed', e);
  }
}

export function slotKey(id: string): string {
  return SAVE_KEY_PREFIX + id;
}

/** One-time migration: if the legacy single-slot key exists, fold it into the new index. */
function migrateLegacy(): UniverseMeta[] {
  const index = readIndex();
  if (index.length > 0) return index;

  const legacyRaw = localStorage.getItem(LEGACY_SINGLE_KEY);
  if (!legacyRaw) return index;

  // Parse minimally to grab eventCount for display
  let eventCount = 0;
  try {
    const parsed = JSON.parse(legacyRaw) as { eventCount?: number };
    eventCount = parsed.eventCount ?? 0;
  } catch {
    // ignore
  }

  const id = uid('uni');
  const meta: UniverseMeta = {
    id,
    name: 'Cage Legacy',
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
    eventCount,
  };
  try {
    localStorage.setItem(slotKey(id), legacyRaw);
    localStorage.removeItem(LEGACY_SINGLE_KEY);
  } catch (e) {
    console.warn('Migration failed', e);
  }
  const newIndex = [meta];
  writeIndex(newIndex);
  return newIndex;
}

// ============================================================
// HOOK
// ============================================================

export function useUniverses() {
  const [universes, setUniverses] = useState<UniverseMeta[]>(() => migrateLegacy());

  const refresh = useCallback(() => {
    setUniverses(readIndex());
  }, []);

  /** Create a new universe slot with the given name. Returns the new slot id. */
  const createUniverse = useCallback((name: string): string => {
    const id = uid('uni');
    const meta: UniverseMeta = {
      id,
      name: name.trim() || 'Untitled Universe',
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
      eventCount: 0,
    };
    const next = [meta, ...readIndex()];
    writeIndex(next);
    setUniverses(next);
    return id;
  }, []);

  const renameUniverse = useCallback((id: string, newName: string) => {
    const next = readIndex().map((u) =>
      u.id === id ? { ...u, name: newName.trim() || u.name } : u
    );
    writeIndex(next);
    setUniverses(next);
  }, []);

  const deleteUniverse = useCallback((id: string) => {
    try {
      localStorage.removeItem(slotKey(id));
    } catch (e) {
      console.warn('Delete slot failed', e);
    }
    const next = readIndex().filter((u) => u.id !== id);
    writeIndex(next);
    setUniverses(next);
  }, []);

  /** Touch a slot's lastPlayedAt + eventCount (called when the active state changes). */
  const updateSlotMeta = useCallback(
    (id: string, patch: Partial<Pick<UniverseMeta, 'eventCount' | 'name'>>) => {
      const next = readIndex().map((u) =>
        u.id === id ? { ...u, ...patch, lastPlayedAt: Date.now() } : u
      );
      writeIndex(next);
      setUniverses(next);
    },
    []
  );

  // Listen for storage events from other tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === INDEX_KEY) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  return {
    universes,
    createUniverse,
    renameUniverse,
    deleteUniverse,
    updateSlotMeta,
    refresh,
  };
}

// ============================================================
// PER-SLOT GAME STATE LOAD/SAVE (used by useGameState)
// ============================================================

export function loadSlotGameState(id: string): GameState | null {
  try {
    const raw = localStorage.getItem(slotKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed.fighters || !Array.isArray(parsed.fighters)) return null;
    // Defensive defaults
    if (!parsed.rivalries) parsed.rivalries = {};
    if (!parsed.bestFightsAllTime) parsed.bestFightsAllTime = [];
    if (!parsed.news) parsed.news = [];
    if (typeof parsed.mainEventCount !== 'number') parsed.mainEventCount = parsed.eventCount;
    if (typeof parsed.alternateEventCount !== 'number') parsed.alternateEventCount = 0;
    if (!parsed.divisionLastFightEvent) parsed.divisionLastFightEvent = {};
    for (const f of parsed.fighters) {
      if (typeof (f as { injured?: number }).injured !== 'number') {
        (f as { injured: number }).injured = 0;
      }
    }
    return parsed;
  } catch (e) {
    console.warn('Load slot failed', e);
    return null;
  }
}

export function saveSlotGameState(id: string, state: GameState): void {
  try {
    localStorage.setItem(slotKey(id), JSON.stringify(state));
  } catch (e) {
    console.warn('Save slot failed', e);
  }
}
