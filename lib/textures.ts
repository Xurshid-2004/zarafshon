// ============================================================================
//  Procedural PBR texture set.
//
//  Flat colours are the single biggest reason a WebGL scene reads as a cartoon,
//  so every surface here gets an albedo with real grain, a roughness map and a
//  normal map derived from a height field. All of it is painted into canvases
//  at runtime — the scene still downloads zero bytes of texture data.
//
//  Generation cost is roughly 20-90 ms per texture and happens once, behind the
//  5-second intro, then the results are cached for the session.
// ============================================================================

import * as THREE from 'three';
import { clamp01, fbm, hexRgb, mix, ridged } from './noise';

export interface PbrSet {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

type PixelFn = (
  u: number,
  v: number,
) => {
  /** albedo 0..255 */
  r: number;
  g: number;
  b: number;
  /** 0..1, higher = rougher */
  rough: number;
  /** 0..1 height for the normal map */
  h: number;
};

const cache = new Map<string, PbrSet>();

function canvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  return [c, ctx];
}

/** Sobel the height field into a tangent-space normal map. */
function heightToNormal(height: Float32Array, size: number, strength: number): HTMLCanvasElement {
  const [c, ctx] = canvas(size);
  const img = ctx.createImageData(size, size);
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx =
        at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1) -
        (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1));
      const dy =
        at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1) -
        (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1));

      let nx = dx * strength;
      let ny = dy * strength;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;

      const i = (y * size + x) * 4;
      img.data[i] = (nx * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      img.data[i + 2] = (nz / len) * 0.5 * 255 + 127.5;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function buildPbr(
  key: string,
  size: number,
  repeat: number,
  normalStrength: number,
  fn: PixelFn,
): PbrSet {
  const hit = cache.get(key);
  if (hit) return hit;

  const [colC, colCtx] = canvas(size);
  const [rouC, rouCtx] = canvas(size);
  const colImg = colCtx.createImageData(size, size);
  const rouImg = rouCtx.createImageData(size, size);
  const height = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = fn(x / size, y / size);
      const i = (y * size + x) * 4;
      colImg.data[i] = px.r;
      colImg.data[i + 1] = px.g;
      colImg.data[i + 2] = px.b;
      colImg.data[i + 3] = 255;

      const rv = clamp01(px.rough) * 255;
      rouImg.data[i] = rv;
      rouImg.data[i + 1] = rv;
      rouImg.data[i + 2] = rv;
      rouImg.data[i + 3] = 255;

      height[y * size + x] = px.h;
    }
  }
  colCtx.putImageData(colImg, 0, 0);
  rouCtx.putImageData(rouImg, 0, 0);

  const nrmC = heightToNormal(height, size, normalStrength);

  const mk = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  };

  const set: PbrSet = {
    map: mk(colC, true),
    normalMap: mk(nrmC, false),
    roughnessMap: mk(rouC, false),
  };
  cache.set(key, set);
  return set;
}

// --- surface definitions ---------------------------------------------------

export function concrete(tint: string, repeat: number, seed = 11): PbrSet {
  const [br, bg, bb] = hexRgb(tint);
  return buildPbr(`concrete-${tint}-${repeat}-${seed}`, 256, repeat, 1.4, (u, v) => {
    const blotch = fbm(u, v, 4, 4, seed);
    const grain = fbm(u, v, 48, 2, seed + 7);
    const pores = fbm(u, v, 110, 1, seed + 23);
    const k = 0.84 + blotch * 0.22 + (grain - 0.5) * 0.12;
    const spec = pores > 0.78 ? 0.08 : 0;
    return {
      r: clamp01(((br * k) / 255) - spec) * 255,
      g: clamp01(((bg * k) / 255) - spec) * 255,
      b: clamp01(((bb * k) / 255) - spec) * 255,
      rough: 0.72 + grain * 0.2 + blotch * 0.06,
      h: grain * 0.55 + blotch * 0.3 + (pores > 0.8 ? 0.25 : 0),
    };
  });
}

export function plaster(tint: string, repeat: number, seed = 31): PbrSet {
  const [br, bg, bb] = hexRgb(tint);
  return buildPbr(`plaster-${tint}-${repeat}-${seed}`, 256, repeat, 0.8, (u, v) => {
    const soft = fbm(u, v, 6, 3, seed);
    const fine = fbm(u, v, 70, 2, seed + 5);
    const k = 0.9 + soft * 0.14 + (fine - 0.5) * 0.06;
    return {
      r: clamp01((br * k) / 255) * 255,
      g: clamp01((bg * k) / 255) * 255,
      b: clamp01((bb * k) / 255) * 255,
      rough: 0.58 + fine * 0.24,
      h: fine * 0.5 + soft * 0.2,
    };
  });
}

export function asphalt(tint: string, repeat: number, seed = 53): PbrSet {
  const [br, bg, bb] = hexRgb(tint);
  return buildPbr(`asphalt-${tint}-${repeat}-${seed}`, 256, repeat, 2.6, (u, v) => {
    const agg = fbm(u, v, 90, 2, seed);
    const patch = fbm(u, v, 5, 3, seed + 3);
    const k = 0.78 + patch * 0.2 + (agg - 0.5) * 0.4;
    const chip = agg > 0.72 ? 0.12 : 0;
    return {
      r: clamp01((br * k) / 255 + chip) * 255,
      g: clamp01((bg * k) / 255 + chip) * 255,
      b: clamp01((bb * k) / 255 + chip) * 255,
      rough: 0.86 + agg * 0.12,
      h: agg,
    };
  });
}

export function grass(base: string, dark: string, repeat: number, seed = 77): PbrSet {
  const [r1, g1, b1] = hexRgb(base);
  const [r2, g2, b2] = hexRgb(dark);
  return buildPbr(`grass-${base}-${dark}-${repeat}-${seed}`, 384, repeat, 2.2, (u, v) => {
    // broad tone first: this is what survives mipmapping at a distance
    const broad = fbm(u, v, 1.5, 3, seed + 99);
    const clump = fbm(u, v, 7, 4, seed);
    const blade = fbm(u, v * 3.2, 150, 2, seed + 9);
    const patchy = fbm(u, v, 2.5, 2, seed + 41);
    const t = clamp01(clump * 0.6 + blade * 0.3 + broad * 0.42 - 0.2);
    const dry = clamp01((patchy - 0.58) * 1.9);
    const shade = 0.78 + broad * 0.46;
    return {
      r: mix(mix(r2, r1, t), 152, dry * 0.4) * shade,
      g: mix(mix(g2, g1, t), 146, dry * 0.3) * shade,
      b: mix(mix(b2, b1, t), 98, dry * 0.32) * shade,
      rough: 0.9 + blade * 0.08,
      h: blade * 0.8 + clump * 0.3,
    };
  });
}

export function wood(light: string, dark: string, repeat: number, seed = 97): PbrSet {
  const [r1, g1, b1] = hexRgb(light);
  const [r2, g2, b2] = hexRgb(dark);
  return buildPbr(`wood-${light}-${dark}-${repeat}-${seed}`, 256, repeat, 1.0, (u, v) => {
    // warp the ring coordinate so the grain is not perfectly straight
    const warp = fbm(u, v, 4, 3, seed) * 0.18;
    const rings = Math.abs(Math.sin((v + warp) * Math.PI * 22));
    const fibre = fbm(u * 0.25, v, 180, 2, seed + 13);
    const t = clamp01(rings * 0.75 + fibre * 0.35);
    return {
      r: mix(r2, r1, t),
      g: mix(g2, g1, t),
      b: mix(b2, b1, t),
      rough: 0.42 + t * 0.26 + fibre * 0.1,
      h: rings * 0.5 + fibre * 0.5,
    };
  });
}

export function bark(tint: string, repeat: number, seed = 131): PbrSet {
  const [br, bg, bb] = hexRgb(tint);
  return buildPbr(`bark-${tint}-${repeat}-${seed}`, 256, repeat, 3.4, (u, v) => {
    const furrow = ridged(u * 3.5, v * 0.5, 14, 3, seed);
    const grain = fbm(u, v, 80, 2, seed + 4);
    const k = 0.62 + furrow * 0.5 + (grain - 0.5) * 0.18;
    return {
      r: clamp01((br * k) / 255) * 255,
      g: clamp01((bg * k) / 255) * 255,
      b: clamp01((bb * k) / 255) * 255,
      rough: 0.86 + grain * 0.12,
      h: furrow * 0.85 + grain * 0.2,
    };
  });
}

export function sand(tint: string, repeat: number, seed = 157): PbrSet {
  const [br, bg, bb] = hexRgb(tint);
  return buildPbr(`sand-${tint}-${repeat}-${seed}`, 256, repeat, 1.8, (u, v) => {
    const grain = fbm(u, v, 160, 2, seed);
    const dune = fbm(u, v, 6, 3, seed + 2);
    const k = 0.88 + dune * 0.14 + (grain - 0.5) * 0.18;
    return {
      r: clamp01((br * k) / 255) * 255,
      g: clamp01((bg * k) / 255) * 255,
      b: clamp01((bb * k) / 255) * 255,
      rough: 0.93 + grain * 0.06,
      h: grain * 0.7 + dune * 0.3,
    };
  });
}

export function rubber(tint: string, repeat: number, seed = 181): PbrSet {
  const [br, bg, bb] = hexRgb(tint);
  return buildPbr(`rubber-${tint}-${repeat}-${seed}`, 256, repeat, 2.2, (u, v) => {
    const granule = fbm(u, v, 120, 1, seed);
    const flecks = fbm(u, v, 200, 1, seed + 6);
    const warm = flecks > 0.74 ? 1.45 : 1;
    const k = (0.82 + granule * 0.3) * warm;
    return {
      r: clamp01((br * k) / 255) * 255,
      g: clamp01((bg * k) / 255) * 255,
      b: clamp01((bb * k) / 255) * 255,
      rough: 0.88 + granule * 0.1,
      h: granule,
    };
  });
}

export function brushedMetal(tint: string, repeat: number, seed = 199): PbrSet {
  const [br, bg, bb] = hexRgb(tint);
  return buildPbr(`metal-${tint}-${repeat}-${seed}`, 256, repeat, 0.5, (u, v) => {
    const streak = fbm(u * 40, v * 0.4, 120, 2, seed);
    const k = 0.9 + (streak - 0.5) * 0.14;
    return {
      r: clamp01((br * k) / 255) * 255,
      g: clamp01((bg * k) / 255) * 255,
      b: clamp01((bb * k) / 255) * 255,
      rough: 0.22 + streak * 0.2,
      h: streak * 0.4,
    };
  });
}

// --- foliage billboard -----------------------------------------------------

const foliageCache = new Map<string, THREE.CanvasTexture>();

/**
 * Alpha-cut foliage sheet for crossed-plane trees. Painted as hundreds of small
 * leaf blobs with a soft radial falloff, which gives the ragged silhouette that
 * an icosahedron crown can never have.
 */
export function foliageSheet(greens: [string, string, string], seed = 5): THREE.CanvasTexture {
  const key = greens.join('-') + seed;
  const hit = foliageCache.get(key);
  if (hit) return hit;

  const S = 512;
  const [c, ctx] = canvas(S);
  ctx.clearRect(0, 0, S, S);

  const rgb = greens.map(hexRgb);
  let st = seed * 9781 + 1;
  const rnd = () => {
    st = (st * 1664525 + 1013904223) >>> 0;
    return st / 4294967296;
  };

  // A canopy is a cluster of lobes, not an ellipse. Scattering leaves inside
  // overlapping lobes is what produces a believable ragged silhouette.
  const lobes: { x: number; y: number; r: number }[] = [];
  const cx = S / 2;
  const cy = S * 0.5;
  lobes.push({ x: cx, y: cy + S * 0.04, r: S * 0.27 });
  const ring = 6;
  for (let i = 0; i < ring; i++) {
    const a = (i / ring) * Math.PI * 2 + rnd() * 0.5;
    const d = S * (0.17 + rnd() * 0.08);
    lobes.push({
      x: cx + Math.cos(a) * d,
      y: cy + Math.sin(a) * d * 0.88,
      r: S * (0.13 + rnd() * 0.08),
    });
  }

  const inside = (x: number, y: number) => {
    let best = 0;
    for (const l of lobes) {
      const d = Math.hypot(x - l.x, y - l.y) / l.r;
      if (d < 1) best = Math.max(best, 1 - d);
    }
    return best; // 0 outside, ->1 at a lobe centre
  };

  // three passes: deep shade, body, sunlit crown
  const passes = [
    { n: 1400, shade: 0.42, size: 16, yBias: 0.35, alpha: 0.95 },
    { n: 1700, shade: 0.78, size: 12, yBias: 0.0, alpha: 0.9 },
    { n: 1100, shade: 1.25, size: 8, yBias: -0.28, alpha: 0.85 },
  ];

  for (const pass of passes) {
    for (let i = 0; i < pass.n; i++) {
      const x = rnd() * S;
      const y = rnd() * S;
      const w = inside(x, y);
      if (w <= 0) continue;
      // rim leaves survive only sometimes -> torn edge
      if (rnd() > 0.25 + w * 0.85) continue;
      // sun comes from above: bias each pass up or down the canopy
      const vertical = 1 - y / S;
      if (rnd() > clamp01(0.45 + (vertical - 0.5) * -pass.yBias * 3 + w * 0.4)) continue;

      const [r, g, b] = rgb[Math.floor(rnd() * 3) % 3];
      const lit = pass.shade * (0.78 + vertical * 0.5) * (0.85 + w * 0.3);
      const size = pass.size * (0.55 + rnd() * 0.9) * (0.5 + w * 0.7);

      ctx.globalAlpha = pass.alpha * (0.55 + rnd() * 0.45);
      ctx.fillStyle = `rgb(${Math.min(255, r * lit) | 0},${Math.min(255, g * lit) | 0},${Math.min(255, b * lit) | 0})`;
      ctx.beginPath();
      ctx.ellipse(x, y, size, size * (0.5 + rnd() * 0.45), rnd() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // a few twigs reading through the gaps
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = 'rgb(70,56,40)';
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2;
    const len = S * (0.1 + rnd() * 0.18);
    ctx.beginPath();
    ctx.moveTo(cx, cy + S * 0.2);
    ctx.lineTo(cx + Math.cos(a) * len, cy + S * 0.2 - Math.abs(Math.sin(a)) * len);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  foliageCache.set(key, t);
  return t;
}

export function disposeTextures(): void {
  cache.forEach((s) => {
    s.map.dispose();
    s.normalMap.dispose();
    s.roughnessMap.dispose();
  });
  cache.clear();
  foliageCache.forEach((t) => t.dispose());
  foliageCache.clear();
}
