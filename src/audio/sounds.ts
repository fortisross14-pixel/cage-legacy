/**
 * Lightweight synthesized sound effects via the Web Audio API.
 *
 * No external audio files — every sound is generated on the fly. This keeps the
 * bundle small and works offline. Sounds are intentionally short and subtle.
 *
 * Functions are no-ops if audio is unavailable (e.g. before any user gesture).
 */
import type { FightMethod } from '@/types';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const Ctor =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

interface ToneOpts {
  freq: number;
  duration: number;        // seconds
  volume?: number;          // 0..1
  type?: OscillatorType;
  attack?: number;          // seconds
  release?: number;         // seconds
  freqEndRatio?: number;    // glide end / start
  delay?: number;           // delay before this tone starts (seconds, relative to now)
}

function tone({
  freq,
  duration,
  volume = 0.2,
  type = 'sine',
  attack = 0.005,
  release = 0.04,
  freqEndRatio = 1,
  delay = 0,
}: ToneOpts) {
  const c = getCtx();
  if (!c) return;
  const start = c.currentTime + delay;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (freqEndRatio !== 1) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, freq * freqEndRatio),
      start + duration
    );
  }
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + attack);
  gain.gain.linearRampToValueAtTime(volume, start + duration - release);
  gain.gain.linearRampToValueAtTime(0, start + duration);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(start);
  osc.stop(start + duration);
}

// ============================================================
// PUBLIC SOUNDS
// ============================================================

/** Small click — UI feedback. */
export function playClick() {
  tone({ freq: 1200, duration: 0.04, volume: 0.08, type: 'square', attack: 0.001, release: 0.02 });
}

/**
 * Fight result chime: distinct per method.
 *   KO  — punchy low-mid hit, falling pitch
 *   SUB — descending "tap" (two notes)
 *   DEC — neutral two-tone "judges' bell"
 *   DOC — single wobbly mid tone
 */
export function playFightChime(method: FightMethod, rating: number) {
  // Higher rating → slightly louder & with overtone
  const intensity = Math.min(1, 0.4 + rating / 12);
  const vol = 0.12 * intensity;

  if (method === 'KO') {
    tone({ freq: 220, duration: 0.18, volume: vol, type: 'square', freqEndRatio: 0.45 });
    tone({ freq: 660, duration: 0.1, volume: vol * 0.5, type: 'sawtooth', delay: 0.02, freqEndRatio: 0.6 });
  } else if (method === 'SUB') {
    tone({ freq: 520, duration: 0.1, volume: vol, type: 'triangle' });
    tone({ freq: 340, duration: 0.18, volume: vol, type: 'triangle', delay: 0.1, freqEndRatio: 0.7 });
  } else if (method === 'DEC') {
    tone({ freq: 440, duration: 0.14, volume: vol * 0.8, type: 'sine' });
    tone({ freq: 660, duration: 0.18, volume: vol * 0.8, type: 'sine', delay: 0.12 });
  } else {
    // DOC
    tone({ freq: 380, duration: 0.28, volume: vol * 0.7, type: 'sine', freqEndRatio: 1.15 });
  }
}

/** Title fight sting — played alongside the chime for added gravitas. */
export function playTitleSting() {
  tone({ freq: 880, duration: 0.12, volume: 0.1, type: 'triangle' });
  tone({ freq: 1320, duration: 0.18, volume: 0.08, type: 'triangle', delay: 0.08 });
  tone({ freq: 1760, duration: 0.22, volume: 0.06, type: 'triangle', delay: 0.18 });
}

/** Resume audio context — required after some user-gesture-restricted browsers. */
export function resumeAudio() {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') {
    void c.resume();
  }
}
