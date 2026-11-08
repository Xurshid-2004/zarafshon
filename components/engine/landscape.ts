// ============================================================================
//  Landscape layout — built from the existing site plan (components/scene/
//  siteLayout.ts) so lawns, paths, parking and trees land where the rest of
//  the project expects them. World coordinates. Every box carries `t`, its
//  stagger inside the environment window of the construction sequence.
// ============================================================================

import {
  BENCHES,
  LAMPS,
  LAWNS,
  PARKING,
  PAVING,
  PLAYGROUND,
  TREES,
} from '@/components/scene/siteLayout';
import type { Box } from './layout';

export interface LandscapeLayout {
  /** Planting that spreads over the bare earth once the site is finished. */
  groundCover: Box[];
  lawns: Box[];
  paving: Box[];
  parking: Box[];
  marks: Box[];
  playSurface: Box[];
  playFrames: Box[];
  trunks: Box[];
  crowns: Box[];
  benches: Box[];
  lampPosts: Box[];
  lampHeads: Box[];
}

const stagger = (delay: number) => Math.min(1, delay / 0.7);

export function buildLandscape(): LandscapeLayout {
  const L: LandscapeLayout = {
    groundCover: [{ p: [0, 0.01, 0], s: [1400, 0.02, 1400], level: 0, t: 0 }],
    lawns: [],
    paving: [],
    parking: [],
    marks: [],
    playSurface: [],
    playFrames: [],
    trunks: [],
    crowns: [],
    benches: [],
    lampPosts: [],
    lampHeads: [],
  };

  for (const l of LAWNS) L.lawns.push({ p: [l.x, 0.03, l.z], s: [l.w, 0.06, l.d], level: 0, t: stagger(l.delay) });
  for (const p of PAVING) L.paving.push({ p: [p.x, 0.045, p.z], s: [p.w, 0.09, p.d], level: 0, t: stagger(p.delay) });

  for (const lot of PARKING) {
    const t = stagger(lot.delay);
    L.parking.push({ p: [lot.x, 0.04, lot.z], s: [lot.w, 0.08, lot.d], level: 0, t });
    // bay lines: two rows of bays facing a central aisle
    const along = lot.axis === 'x' ? lot.w : lot.d;
    const across = lot.axis === 'x' ? lot.d : lot.w;
    const perRow = Math.max(1, Math.round(lot.slots / 2));
    const bay = along / perRow;
    for (const side of [-1, 1]) {
      for (let i = 0; i <= perRow; i++) {
        const u = -along / 2 + bay * i;
        const v = side * across * 0.3;
        const len = across * 0.36;
        const box: Box =
          lot.axis === 'x'
            ? { p: [lot.x + u, 0.085, lot.z + v], s: [0.12, 0.012, len], level: 0, t: Math.min(1, t + 0.05) }
            : { p: [lot.x + v, 0.085, lot.z + u], s: [len, 0.012, 0.12], level: 0, t: Math.min(1, t + 0.05) };
        L.marks.push(box);
      }
    }
  }

  const pg = PLAYGROUND;
  L.playSurface.push({ p: [pg.x, 0.05, pg.z], s: [pg.w, 0.1, pg.d], level: 0, t: 0.55 });
  // a swing frame and a small climbing tower, built from slender members
  const swingX = pg.x - 5;
  for (const dx of [-2, 2]) L.playFrames.push({ p: [swingX + dx, 1.25, pg.z], s: [0.14, 2.5, 0.14], level: 0, t: 0.62 });
  L.playFrames.push({ p: [swingX, 2.5, pg.z], s: [4.3, 0.14, 0.14], level: 0, t: 0.64 });
  const towerX = pg.x + 4.5;
  for (const dx of [-1, 1]) {
    for (const dz of [-1, 1]) L.playFrames.push({ p: [towerX + dx, 1.4, pg.z + dz], s: [0.14, 2.8, 0.14], level: 0, t: 0.66 });
  }
  L.playFrames.push({ p: [towerX, 1.3, pg.z], s: [2.2, 0.12, 2.2], level: 0, t: 0.68 });
  L.playFrames.push({ p: [towerX, 2.85, pg.z], s: [2.5, 0.1, 2.5], level: 0, t: 0.7 });

  TREES.forEach((tr, i) => {
    const t = Math.min(1, 0.25 + (i / TREES.length) * 0.6);
    L.trunks.push({ p: [tr.x, tr.h / 2, tr.z], s: [0.36, tr.h, 0.36], level: 0, t });
    L.crowns.push({
      p: [tr.x, tr.h + tr.r * 0.75, tr.z],
      s: [tr.r * 2.9, tr.r * 2.7, tr.r * 2.9],
      level: 0,
      t,
    });
  });

  BENCHES.forEach((b, i) => {
    const turned = Math.abs(Math.sin(b.ry)) > 0.5;
    L.benches.push({
      p: [b.x, 0.25, b.z],
      s: turned ? [0.6, 0.5, 1.8] : [1.8, 0.5, 0.6],
      level: 0,
      t: Math.min(1, 0.7 + i * 0.03),
    });
  });

  LAMPS.forEach((l, i) => {
    const t = Math.min(1, 0.6 + i * 0.04);
    L.lampPosts.push({ p: [l.x, 2, l.z], s: [0.12, 4, 0.12], level: 0, t });
    L.lampHeads.push({ p: [l.x, 4.06, l.z], s: [0.5, 0.12, 0.5], level: 0, t: Math.min(1, t + 0.05) });
  });

  return L;
}
