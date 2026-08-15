import type { DieFace } from './rules';

const canCrypto = typeof globalThis.crypto?.getRandomValues === 'function';

/** Unbiased 1–6. Uses the crypto RNG when it's there, Math.random when it isn't. */
export function rollDie(): DieFace {
  if (canCrypto) {
    const buffer = new Uint8Array(1);
    // Reject the top 4 values so 252 outcomes map evenly onto 6 faces.
    do {
      globalThis.crypto.getRandomValues(buffer);
    } while (buffer[0] >= 252);
    return ((buffer[0] % 6) + 1) as DieFace;
  }
  return (Math.floor(Math.random() * 6) + 1) as DieFace;
}

export function rollDice(count: number): DieFace[] {
  return Array.from({ length: Math.max(0, count) }, rollDie);
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
