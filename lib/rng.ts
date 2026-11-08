// ============================================================================
//  Deterministic pseudo-random helpers.
//  Every value in the scene is derived from a string seed so that the server
//  render and the client hydration agree, and prices never shift on reload.
// ============================================================================

/** FNV-1a 32-bit string hash. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, well-distributed 32-bit PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded generator from a readable string key. */
export function seeded(key: string): () => number {
  return mulberry32(hashString(key));
}

export function pick<T>(rnd: () => number, items: readonly T[]): T {
  return items[Math.floor(rnd() * items.length) % items.length];
}

export function range(rnd: () => number, min: number, max: number): number {
  return min + rnd() * (max - min);
}

export function intRange(rnd: () => number, min: number, max: number): number {
  return Math.floor(range(rnd, min, max + 1));
}
