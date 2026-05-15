/**
 * User-level preferences (not per-universe).
 *
 * These persist across all save slots since they're personal preferences:
 *   audioEnabled    — global audio on/off
 *   skipReveal      — skip the animated event reveal (one-click sim)
 */
import { useCallback, useEffect, useState } from 'react';

const KEY = 'cage_legacy_settings_v1';

export interface Settings {
  audioEnabled: boolean;
  skipReveal: boolean;
}

const DEFAULTS: Settings = {
  audioEnabled: false,    // default off — auto-play sounds annoy people
  skipReveal: false,
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function save(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) {
    console.warn('Settings save failed', e);
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => load());

  useEffect(() => {
    save(settings);
  }, [settings]);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);

  return { settings, update };
}
