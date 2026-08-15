/**
 * The only place in the app that touches localStorage (§3.1). If a backend is
 * ever wanted, it becomes this file, not a refactor.
 */

const VERSION = 1;

type Envelope<T> = { v: number; data: T };

function available(): boolean {
  try {
    const probe = '__farkle_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

const enabled = typeof window !== 'undefined' && available();

export function load<T>(key: string): T | null {
  if (!enabled) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Envelope<T>;
    if (!parsed || typeof parsed !== 'object' || parsed.v !== VERSION) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function save<T>(key: string, data: T): void {
  if (!enabled) return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ v: VERSION, data } satisfies Envelope<T>));
  } catch {
    // Quota or private browsing — the game keeps working, it just won't survive
    // a refresh. §3.1 says mention it once, quietly, not nag.
  }
}

export function clear(key: string): void {
  if (!enabled) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** True when persistence is working — used for the one quiet warning. */
export function persistenceAvailable(): boolean {
  return enabled;
}

/** Namespaced per rule set so a Standard game and a Jane's game coexist (§3.1). */
export const keys = {
  game: (prefix: string) => `${prefix}:game`,
  scorePad: (prefix: string) => `${prefix}:scorepad`,
  dice: (prefix: string) => `${prefix}:dice`,
  /** Shared across both branches. */
  playerNames: 'farkle:players',
  settings: 'farkle:settings',
} as const;
