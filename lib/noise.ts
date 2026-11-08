// ============================================================================
//  Tileable value noise used by the procedural texture generators.
//  Nothing is downloaded: every surface in the scene gets its grain from here.
// ============================================================================

/** Integer hash -> 0..1. Deterministic across reloads. */
function h2(x: number, y: number, s: number): number {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

/**
 * Value noise on a lattice that wraps at `f`, so the resulting texture tiles
 * seamlessly at any repeat count.
 */
export function tileNoise(x: number, y: number, f: number, seed: number): number {
  const xf = x * f;
  const yf = y * f;
  const x0 = Math.floor(xf);
  const y0 = Math.floor(yf);
  const tx = xf - x0;
  const ty = yf - y0;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const w = (v: number) => ((v % f) + f) % f;

  const a = h2(w(x0), w(y0), seed);
  const b = h2(w(x0 + 1), w(y0), seed);
  const c = h2(w(x0), w(y0 + 1), seed);
  const d = h2(w(x0 + 1), w(y0 + 1), seed);

  return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
}

/** Fractal sum of tileable value noise; returns 0..1. */
export function fbm(
  x: number,
  y: number,
  baseFreq: number,
  octaves: number,
  seed: number,
  gain = 0.5,
): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let f = baseFreq;
  for (let o = 0; o < octaves; o++) {
    sum += tileNoise(x, y, f, seed + o * 1013) * amp;
    norm += amp;
    amp *= gain;
    f *= 2;
  }
  return sum / norm;
}

/** Ridged variant — good for bark and cracked surfaces. */
export function ridged(x: number, y: number, baseFreq: number, octaves: number, seed: number): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let f = baseFreq;
  for (let o = 0; o < octaves; o++) {
    sum += (1 - Math.abs(tileNoise(x, y, f, seed + o * 701) * 2 - 1)) * amp;
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** "#RRGGBB" -> [r, g, b] in 0..255 */
export function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
