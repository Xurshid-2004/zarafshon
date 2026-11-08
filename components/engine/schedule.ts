// ============================================================================
//  Per-instance construction schedule.
//
//  For every box in a layout: when it starts appearing (progress units),
//  how long it takes, and HOW it appears (motion mode). Pure data, computed
//  once per layout; BoxInstances evaluates it each frame the progress moves.
// ============================================================================

import { ARCH } from '@/lib/architecture';
import {
  SLAB_DURATION,
  balconyAt,
  encloseAt,
  frameAt,
  glazeAt,
} from '@/lib/construction';
import type { Box } from './layout';

/** How an instance comes into being. */
export const Motion = {
  /** Uniform scale about the centre. */
  Scale: 0,
  /** Grows upward from its base. */
  Rise: 1,
  /** Lowered into place from above (crane). */
  Drop: 2,
  /** Grows along its longest horizontal side. */
  GrowLong: 3,
  /** Extends outward from the facade (cantilevers). */
  Extend: 4,
  /** Pushed up from below (piles). */
  RiseFromBelow: 5,
  /** Visible at first, disappears (excavation cover). */
  Shrink: 6,
  /** Spreads across the ground, thickness unchanged. */
  Flat: 7,
} as const;
export type Motion = (typeof Motion)[keyof typeof Motion];

export interface InstanceAnim {
  start: Float32Array;
  dur: Float32Array;
  mode: Uint8Array;
}

export type LayoutSchedule = Map<string, InstanceAnim>;

export interface ProgressSource {
  progress: number;
}

type Rule = (box: Box, index: number) => [start: number, dur: number, mode: Motion];

/** Deterministic 0..1 jitter so identical parts do not all pop at once. */
export const jitter = (i: number, salt = 0) => {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const FH = ARCH.floorHeight;

export const RULES: Record<string, Rule> = {
  // --- foundation ------------------------------------------------------------
  'foundation.piles': (_, i) => [0.06 + jitter(i) * 0.03, 0.025, Motion.RiseFromBelow],
  'foundation.pileCaps': (_, i) => [0.095 + jitter(i, 1) * 0.02, 0.015, Motion.Scale],
  'foundation.raft': () => [0.125, 0.03, Motion.Rise],
  'foundation.plinth': () => [0.155, 0.012, Motion.Rise],

  // --- frame: slab first, then the columns and core standing on it ----------
  slabs: (b) => [frameAt(b.level), SLAB_DURATION, Motion.Drop],
  'structure.columns': (b, i) => [frameAt(b.level) + 0.006 + jitter(i, 2) * 0.004, 0.016, Motion.Rise],
  'structure.core': (b) => [frameAt(b.level) + 0.005, 0.018, Motion.Rise],
  'roof.slab': (b) => [frameAt(b.level), SLAB_DURATION, Motion.Drop],

  // --- enclosing the storeys ----------------------------------------------------
  'windows.interior': (b) => [encloseAt(b.level), 0.02, Motion.Rise],
  'facade.spandrels': (b) => [encloseAt(b.level) + 0.004, 0.016, Motion.GrowLong],

  // --- curtain wall -------------------------------------------------------------
  'windows.mullions': (b) => [glazeAt(b.level), 0.014, Motion.Rise],
  'windows.transoms': (b) => [glazeAt(b.level) + 0.006, 0.012, Motion.GrowLong],
  'windows.glass': (b, i) => [glazeAt(b.level) + 0.01 + jitter(i, 3) * 0.006, 0.014, Motion.Rise],
  'windows.shopGlass': (b, i) => [glazeAt(b.level) + 0.01 + jitter(i, 4) * 0.006, 0.014, Motion.Rise],
  // storey-high frames between balconies vs. full-height fins and corners
  'facade.fins': (b) =>
    b.s[1] > FH * 1.5 ? [glazeAt(1), 0.12, Motion.Rise] : [glazeAt(b.level) + 0.004, 0.014, Motion.Rise],

  // architectural lighting comes on with the finishing works
  'facade.lights': (_, i) => [0.8 + jitter(i, 13) * 0.02, 0.012, Motion.Rise],

  // --- balconies ------------------------------------------------------------------
  'balconies.slabs': (b) => [balconyAt(b.level), 0.014, Motion.Extend],
  'balconies.fascia': (b) => [balconyAt(b.level) + 0.008, 0.01, Motion.GrowLong],
  'balconies.glass': (b) => [balconyAt(b.level) + 0.01, 0.012, Motion.Rise],
  'balconies.rails': (b) => [balconyAt(b.level) + 0.014, 0.01, Motion.GrowLong],
  'balconies.planters': (b) => [balconyAt(b.level) + 0.018, 0.01, Motion.Scale],
  'balconies.foliage': (b, i) => [balconyAt(b.level) + 0.022 + jitter(i, 5) * 0.01, 0.012, Motion.Scale],

  // --- final architecture -------------------------------------------------------
  'roof.parapet': () => [0.74, 0.03, Motion.Rise],
  'roof.plant': () => [0.76, 0.02, Motion.Rise],
  'roof.lights': () => [0.8, 0.01, Motion.Scale],
  'entrance.walls': () => [0.75, 0.02, Motion.Rise],
  'entrance.steps': () => [0.755, 0.015, Motion.Rise],
  'entrance.ceiling': () => [0.765, 0.01, Motion.Scale],
  'entrance.frames': () => [0.77, 0.015, Motion.Rise],
  'entrance.glass': () => [0.775, 0.015, Motion.Rise],
  'entrance.canopy': () => [0.785, 0.02, Motion.Extend],
  'entrance.sign': () => [0.8, 0.015, Motion.GrowLong],
  'entrance.lights': () => [0.81, 0.01, Motion.Scale],
};

/** Landscape items carry their own stagger in `box.t` (0..1). */
export const ENV_START = 0.84;
export const ENV_SPAN = 0.12;
export function envRule(mode: Motion, offset = 0, dur = 0.03): Rule {
  return (b) => [ENV_START + (b.t ?? 0) * ENV_SPAN + offset, dur, mode];
}

export function scheduleBoxes(boxes: readonly Box[], rule: Rule): InstanceAnim {
  const n = boxes.length;
  const a: InstanceAnim = { start: new Float32Array(n), dur: new Float32Array(n), mode: new Uint8Array(n) };
  boxes.forEach((b, i) => {
    const [s, d, m] = rule(b, i);
    a.start[i] = s;
    a.dur[i] = d;
    a.mode[i] = m;
  });
  return a;
}

/** Schedule every group of a tower layout, keyed like allBoxes() groups. */
export function scheduleGroups(groups: Record<string, readonly Box[]>): LayoutSchedule {
  const out: LayoutSchedule = new Map();
  for (const [key, boxes] of Object.entries(groups)) {
    const rule = RULES[key];
    if (!rule) throw new Error(`No construction rule for "${key}"`);
    out.set(key, scheduleBoxes(boxes, rule));
  }
  return out;
}
