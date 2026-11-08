// ============================================================================
//  Procedural tower layout.
//
//  Pure maths, no three.js: given a TowerSpec from lib/architecture.ts it
//  returns every architectural element as a list of axis-aligned boxes
//  (centre + size, tower-local metres). The renderer turns each list into one
//  InstancedMesh, and a node script (scripts/verify-engine.ts) checks the same
//  lists for proportions and collisions — so what is verified is exactly what
//  is drawn.
//
//  Every box carries the storey it belongs to (`level`). Level 0 is the
//  foundation and floors + 1 is the roof; the scroll construction sequence
//  will use this to build the tower storey by storey.
// ============================================================================

import { ARCH, type TowerSpec } from '@/lib/architecture';
import { seeded } from '@/lib/rng';
import type { BuildingData } from '@/lib/types';

export type V3 = [number, number, number];

export interface Box {
  /** Centre, tower-local. */
  p: V3;
  /** Full size. */
  s: V3;
  level: number;
  /** Optional per-instance tint. */
  c?: string;
  /** Optional stagger 0..1 inside a construction window (landscape). */
  t?: number;
}

/** One apartment's horizontal slot on the front facade. */
export interface UnitSlot {
  x0: number;
  x1: number;
  balcony: boolean;
}
/** Residential level -> its apartment slots, left to right. */
export type LevelSlots = Record<number, UnitSlot[]>;

export interface TowerLayout {
  spec: TowerSpec;
  /** Top of the roof slab. */
  height: number;
  foundation: { raft: Box[]; pileCaps: Box[]; piles: Box[]; plinth: Box[] };
  structure: { columns: Box[]; core: Box[] };
  slabs: Box[];
  windows: { glass: Box[]; shopGlass: Box[]; mullions: Box[]; transoms: Box[]; interior: Box[] };
  facade: { spandrels: Box[]; fins: Box[]; lights: Box[] };
  balconies: {
    slabs: Box[];
    fascia: Box[];
    glass: Box[];
    rails: Box[];
    planters: Box[];
    foliage: Box[];
  };
  entrance: {
    walls: Box[];
    ceiling: Box[];
    glass: Box[];
    frames: Box[];
    canopy: Box[];
    sign: Box[];
    lights: Box[];
    steps: Box[];
  };
  roof: { slab: Box[]; parapet: Box[]; plant: Box[]; lights: Box[] };
}

export const ROOF_LEVEL = (t: TowerSpec) => t.floors + 1;

// ---------------------------------------------------------------------------
//  Facade helper: place a box on one of the four faces.
// ---------------------------------------------------------------------------
type FaceKey = 'front' | 'back' | 'left' | 'right';

interface Face {
  key: FaceKey;
  /** Axis the face runs along. */
  axis: 'x' | 'z';
  len: number;
  /** +1 for front/right, -1 for back/left. */
  sign: 1 | -1;
  /** Distance of the facade plane from the tower centre. */
  off: number;
}

function facesOf(t: TowerSpec): Face[] {
  return [
    { key: 'front', axis: 'x', len: t.width, sign: 1, off: t.depth / 2 },
    { key: 'back', axis: 'x', len: t.width, sign: -1, off: t.depth / 2 },
    { key: 'right', axis: 'z', len: t.depth, sign: 1, off: t.width / 2 },
    { key: 'left', axis: 'z', len: t.depth, sign: -1, off: t.width / 2 },
  ];
}

/**
 * @param u      position along the face
 * @param out    offset of the box centre outward from the facade plane
 * @param along  size along the face
 * @param normal size perpendicular to the face
 */
function place(
  f: Face,
  u: number,
  out: number,
  y: number,
  along: number,
  sy: number,
  normal: number,
  level: number,
  c?: string,
): Box {
  const d = f.sign * (f.off + out);
  return f.axis === 'x'
    ? { p: [u, y, d], s: [along, sy, normal], level, c }
    : { p: [d, y, u], s: [normal, sy, along], level, c };
}

function spread(from: number, to: number, count: number): number[] {
  if (count <= 1) return [(from + to) / 2];
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(from + ((to - from) * i) / (count - 1));
  return out;
}

// Small material variation so a glass wall does not read as one flat sheet.
const GLASS_TINTS = ['#5C7282', '#6A7F8E', '#54697A', '#748896', '#61788A'];
// at dusk a pane is either a lit room or a dark one; the colour drives its glow
const DUSK_LIT = ['#FFD9A8', '#FFC98A', '#FFE3BD'];
const DUSK_DARK = ['#26364E', '#1E2C42', '#2E4058', '#354A63'];
const INTERIOR_TINTS = ['#2A2622', '#332C25', '#3D342B', '#4A3F33', '#5C4A36'];

// ---------------------------------------------------------------------------
//  Apartment slots from the existing unit data (keeps balconies consistent
//  with what the apartment drawer says).
// ---------------------------------------------------------------------------
export function slotsFromBuilding(b: BuildingData): LevelSlots {
  const out: LevelSlots = {};
  for (const f of b.floors) {
    if (f.kind !== 'residential') continue;
    out[f.level] = f.apartments.map((a) => ({
      x0: a.bounds.min[0] - 0.14,
      x1: a.bounds.max[0] + 0.14,
      balcony: a.balcony,
    }));
  }
  return out;
}

// ---------------------------------------------------------------------------
//  The tower.
// ---------------------------------------------------------------------------
export function buildTowerLayout(t: TowerSpec, slots: LevelSlots, dusk = false): TowerLayout {
  const A = ARCH;
  const FH = A.floorHeight;
  const SL = A.slab;
  const cw = A.curtainWall;
  const hw = t.width / 2;
  const hd = t.depth / 2;
  const top = t.floors * FH;
  const rnd = seeded(`tower-${t.id}`);
  const tint = (list: string[]) => list[Math.floor(rnd() * list.length)];

  const L: TowerLayout = {
    spec: t,
    height: top + A.roof.slab,
    foundation: { raft: [], pileCaps: [], piles: [], plinth: [] },
    structure: { columns: [], core: [] },
    slabs: [],
    windows: { glass: [], shopGlass: [], mullions: [], transoms: [], interior: [] },
    facade: { spandrels: [], fins: [], lights: [] },
    balconies: { slabs: [], fascia: [], glass: [], rails: [], planters: [], foliage: [] },
    entrance: {
      walls: [],
      ceiling: [],
      glass: [],
      frames: [],
      canopy: [],
      sign: [],
      lights: [],
      steps: [],
    },
    roof: { slab: [], parapet: [], plant: [], lights: [] },
  };

  const faces = facesOf(t);
  const front = faces[0];

  // Entrance span on the front facade, used to cut the shopfront.
  const en = A.entrance;
  const enX0 = t.entranceX - en.width / 2;
  const enX1 = t.entranceX + en.width / 2;
  const inEntrance = (x: number, pad = 0) => x > enX0 - pad && x < enX1 + pad;

  // ------------------------------------------------------------ structure grid
  const st = A.structure;
  const nx = Math.max(2, Math.round((t.width - 2 * st.edgeInset) / st.columnSpacing) + 1);
  const nz = Math.max(2, Math.round((t.depth - 2 * st.edgeInset) / st.columnSpacing) + 1);
  const colX = spread(-hw + st.edgeInset, hw - st.edgeInset, nx);
  const colZ = spread(-hd + st.edgeInset, hd - st.edgeInset, nz);
  const coreZ = -hd + st.core.fromBack;
  const gridPoints: [number, number][] = [];
  for (const x of colX) {
    for (let k = 0; k < colZ.length; k++) {
      const z = colZ[k];
      const perimeter = k === 0 || k === colZ.length - 1 || x === colX[0] || x === colX[nx - 1];
      if (!perimeter && !st.interiorColumns) continue;
      // the service core already carries the load where it stands
      if (Math.abs(x) < st.core.width / 2 + 0.4 && Math.abs(z - coreZ) < st.core.depth / 2 + 0.4) continue;
      gridPoints.push([x, z]);
    }
  }

  // ------------------------------------------------------------ foundation
  const fd = A.foundation;
  L.foundation.raft.push({
    p: [0, -fd.raftDepth / 2 - 0.02, 0],
    s: [t.width + 2 * fd.raftMargin, fd.raftDepth, t.depth + 2 * fd.raftMargin],
    level: 0,
  });
  for (const [x, z] of gridPoints) {
    const capY = -fd.raftDepth - 0.02 - fd.pileCap * 0.3;
    L.foundation.pileCaps.push({ p: [x, capY, z], s: [fd.pileCap, fd.pileCap * 0.6, fd.pileCap], level: 0 });
    L.foundation.piles.push({
      p: [x, capY - fd.pileCap * 0.3 - fd.pileLength / 2, z],
      s: [0.5, fd.pileLength, 0.5],
      level: 0,
    });
  }
  L.foundation.plinth.push({
    p: [0, fd.plinthHeight / 2, 0],
    s: [t.width + 2 * fd.plinthMargin, fd.plinthHeight, t.depth + 2 * fd.plinthMargin],
    level: 0,
  });

  // ------------------------------------------------------------ storeys
  for (let level = 1; level <= t.floors; level++) {
    const base = (level - 1) * FH;
    const commercial = level === 1;
    const clear = FH - SL;

    // slab
    L.slabs.push({ p: [0, base + SL / 2, 0], s: [t.width, SL, t.depth], level });

    // columns + core
    for (const [x, z] of gridPoints) {
      // keep the recessed lobby clear on the ground floor
      if (commercial && z > hd - en.recess - 0.6 && inEntrance(x, 0.5)) continue;
      L.structure.columns.push({
        p: [x, base + SL + clear / 2, z],
        s: [st.columnSize, clear, st.columnSize],
        level,
      });
    }
    L.structure.core.push({
      p: [0, base + SL + clear / 2, coreZ],
      s: [st.core.width, clear, st.core.depth],
      level,
    });

    // dark interior volume behind the glass
    const inset = cw.interiorInset;
    L.windows.interior.push({
      p: [0, base + SL + clear / 2, 0],
      s: [t.width - 2 * inset, clear - 0.02, t.depth - 2 * inset],
      level,
      c: tint(INTERIOR_TINTS),
    });

    // curtain wall, face by face
    const visionBottom = commercial ? base + SL + 0.04 : base + SL + cw.spandrelAbove;
    const visionTop = base + FH - cw.spandrelBelow;
    const visionH = visionTop - visionBottom;
    const visionY = (visionTop + visionBottom) / 2;

    for (const f of faces) {
      const module = commercial ? cw.module * cw.shopModuleFactor : cw.module;
      const nb = Math.max(2, Math.round(f.len / module));
      const bw = f.len / nb;
      const isFront = f.key === 'front';

      for (let i = 0; i < nb; i++) {
        const u = -f.len / 2 + bw * (i + 0.5);
        if (commercial && isFront && inEntrance(u, bw / 2 - 0.05)) continue;
        const pane = place(
          f,
          u,
          -cw.glassThickness / 2,
          visionY,
          bw - cw.mullionWidth,
          visionH,
          cw.glassThickness,
          level,
          commercial ? undefined : dusk ? (rnd() < 0.46 ? tint(DUSK_LIT) : tint(DUSK_DARK)) : tint(GLASS_TINTS),
        );
        (commercial ? L.windows.shopGlass : L.windows.glass).push(pane);
      }

      for (let i = 0; i <= nb; i++) {
        const u = -f.len / 2 + bw * i;
        if (commercial && isFront && inEntrance(u, -0.05)) continue;
        L.windows.mullions.push(
          place(f, u, cw.mullionDepth / 2 - 0.04, base + FH / 2, cw.mullionWidth, FH, cw.mullionDepth, level),
        );
      }

      for (const y of [visionBottom, visionTop]) {
        if (commercial && isFront) {
          // the transom stops at the lobby on both sides
          const leftLen = enX0 + f.len / 2;
          const rightLen = f.len / 2 - enX1;
          if (leftLen > 0.1)
            L.windows.transoms.push(
              place(f, -f.len / 2 + leftLen / 2, cw.mullionDepth / 2 - 0.04, y, leftLen, 0.06, cw.mullionDepth * 0.8, level),
            );
          if (rightLen > 0.1)
            L.windows.transoms.push(
              place(f, f.len / 2 - rightLen / 2, cw.mullionDepth / 2 - 0.04, y, rightLen, 0.06, cw.mullionDepth * 0.8, level),
            );
        } else {
          L.windows.transoms.push(
            place(f, 0, cw.mullionDepth / 2 - 0.04, y, f.len, 0.06, cw.mullionDepth * 0.8, level),
          );
        }
      }

      // opaque spandrel band hiding the slab edge and the ceiling void
      // (on the shopfront storey it is only a low kick plate under the glass)
      const sb = Math.max(0, base - cw.spandrelBelow);
      const stp = commercial ? visionBottom : base + SL + cw.spandrelAbove;
      const wrap = f.axis === 'x' ? 2 * cw.spandrelThickness : 0;
      L.facade.spandrels.push(
        place(f, 0, cw.spandrelThickness / 2 - 0.02, (sb + stp) / 2, f.len + wrap, stp - sb, cw.spandrelThickness, level),
      );
    }

    // ---------------------------------------------------- front: fins + balconies
    const row = slots[level];
    if (!commercial && row) {
      const fn = A.fins;
      for (let i = 1; i < row.length; i++) {
        const x = row[i].x0;
        L.facade.fins.push(place(front, x, fn.frontDepth / 2 - 0.02, base + FH / 2, fn.width, FH, fn.frontDepth, level));
        L.facade.lights.push(place(front, x, fn.frontDepth - 0.005, base + FH / 2, fn.width * 0.55, FH, 0.04, level));
      }

      const b = A.balcony;
      for (const slot of row) {
        if (!slot.balcony) continue;
        const cx = (slot.x0 + slot.x1) / 2;
        const w = (slot.x1 - slot.x0) * b.widthRatio;
        const zMid = hd + b.depth / 2;
        const zEdge = hd + b.depth;
        const floorTop = base + SL;

        L.balconies.slabs.push({ p: [cx, floorTop - b.slab / 2, zMid], s: [w, b.slab, b.depth], level });
        L.balconies.fascia.push({ p: [cx, floorTop - 0.12, zEdge + 0.02], s: [w + 0.04, 0.26, 0.05], level });

        const railY = floorTop + b.railHeight / 2;
        L.balconies.glass.push({ p: [cx, railY, zEdge - 0.05], s: [w - 0.08, b.railHeight, 0.025], level });
        for (const sx of [-1, 1]) {
          L.balconies.glass.push({
            p: [cx + sx * (w / 2 - 0.04), railY, zMid - 0.02],
            s: [0.025, b.railHeight, b.depth - 0.1],
            level,
          });
          L.balconies.rails.push({
            p: [cx + sx * (w / 2 - 0.04), floorTop + b.railHeight, zMid - 0.02],
            s: [0.06, 0.05, b.depth - 0.1],
            level,
          });
        }
        L.balconies.rails.push({ p: [cx, floorTop + b.railHeight, zEdge - 0.05], s: [w - 0.04, 0.05, 0.06], level });

        if (b.planters) {
          const side = rnd() > 0.5 ? 1 : -1;
          const px = cx + side * (w / 2 - 0.45);
          L.balconies.planters.push({ p: [px, floorTop + 0.22, zEdge - 0.35], s: [0.7, 0.44, 0.42], level });
          L.balconies.foliage.push({
            p: [px, floorTop + 0.44 + 0.3, zEdge - 0.35],
            s: [1.05, 0.9 + rnd() * 0.3, 0.8],
            level,
          });
        }
      }
    }
  }

  // ------------------------------------------------------------ back/side fins + corners
  {
    const fn = A.fins;
    const finH = top - FH; // residential floors only
    for (const f of faces) {
      if (f.key === 'front') continue;
      const nb = Math.max(2, Math.round(f.len / cw.module));
      const bw = f.len / nb;
      for (let i = fn.every; i < nb; i += fn.every) {
        const u = -f.len / 2 + bw * i;
        L.facade.fins.push(place(f, u, fn.sideDepth / 2 - 0.02, FH + finH / 2, fn.width, finH, fn.sideDepth, 2));
      }
    }
    const cs = fn.cornerSize;
    // light lines: down each visible corner and around the crown
    const lampY = (top + FH * 0) / 2;
    for (const sx of [-1, 1]) {
      L.facade.lights.push({ p: [sx * (hw + cs - 0.1), lampY, hd + cs - 0.1], s: [0.07, top, 0.07], level: 1 });
    }
    for (const f of faces) {
      const crown = top + A.roof.slab + A.roof.parapetHeight - 0.12;
      L.facade.lights.push(place(f, 0, A.roof.parapetThickness - 0.01, crown, f.len, 0.08, 0.05, ROOF_LEVEL(t)));
    }
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        L.facade.fins.push({
          p: [sx * (hw + cs / 2 - 0.12), top / 2, sz * (hd + cs / 2 - 0.12)],
          s: [cs, top, cs],
          level: 1,
        });
      }
    }
  }

  // ------------------------------------------------------------ entrance (front, level 1)
  {
    const r = en.recess;
    const ceilY = FH - cw.spandrelBelow;
    const lobbyH = ceilY - SL;
    const zFace = hd;

    // recess cheeks
    for (const x of [enX0, enX1]) {
      L.entrance.walls.push({ p: [x, SL + lobbyH / 2, zFace - r / 2], s: [0.26, lobbyH, r], level: 1 });
    }
    // recess soffit
    L.entrance.ceiling.push({ p: [t.entranceX, ceilY + 0.05, zFace - r / 2], s: [en.width, 0.1, r], level: 1 });

    // glazed door screen at the back of the recess
    const gz = zFace - r;
    L.entrance.glass.push({ p: [t.entranceX, SL + lobbyH / 2, gz], s: [en.width - 0.26, lobbyH, 0.03], level: 1 });
    const doorW = 1.9;
    for (const x of [enX0 + 0.13, t.entranceX - doorW, t.entranceX, t.entranceX + doorW, enX1 - 0.13]) {
      L.entrance.frames.push({ p: [x, SL + lobbyH / 2, gz + 0.04], s: [0.08, lobbyH, 0.12], level: 1 });
    }
    // door head transom
    L.entrance.frames.push({ p: [t.entranceX, SL + 2.35, gz + 0.04], s: [en.width - 0.26, 0.08, 0.12], level: 1 });

    // cantilevered canopy
    const cd = en.canopyDepth;
    const cDepth = cd + r;
    const cy = ceilY + en.canopyThickness / 2 + 0.02;
    L.entrance.canopy.push({
      p: [t.entranceX, cy, zFace - r + cDepth / 2],
      s: [en.width + 2 * en.canopyOverhang, en.canopyThickness, cDepth],
      level: 1,
    });
    // illuminated name strip on the canopy fascia
    L.entrance.sign.push({
      p: [t.entranceX, cy, zFace + cd + 0.012],
      s: [en.width * 0.62, 0.09, 0.02],
      level: 1,
    });
    // downlights under the canopy
    for (const x of spread(enX0 + 0.6, enX1 - 0.6, 4)) {
      L.entrance.lights.push({ p: [x, ceilY - 0.005, zFace + cd * 0.55], s: [0.22, 0.02, 0.22], level: 1 });
    }

    // two shallow steps up to the ground-floor slab
    L.entrance.steps.push({ p: [t.entranceX, 0.065, zFace + 0.9], s: [en.width + 0.8, 0.13, 1.8], level: 1 });
    L.entrance.steps.push({ p: [t.entranceX, 0.13, zFace + 0.4], s: [en.width + 0.4, 0.26, 0.8], level: 1 });
  }

  // ------------------------------------------------------------ roof
  {
    const rf = A.roof;
    const lvl = ROOF_LEVEL(t);
    L.roof.slab.push({ p: [0, top + rf.slab / 2, 0], s: [t.width, rf.slab, t.depth], level: lvl });

    // parapet wraps the top spandrel into one continuous crown
    const pb = top - cw.spandrelBelow;
    const pt = top + rf.slab + rf.parapetHeight;
    for (const f of faces) {
      const wrap = f.axis === 'x' ? 2 * rf.parapetThickness : 0;
      L.roof.parapet.push(
        place(f, 0, rf.parapetThickness / 2 - 0.02, (pb + pt) / 2, f.len + wrap, pt - pb, rf.parapetThickness, lvl),
      );
    }
    const pr = rf.plantRoom;
    L.roof.plant.push({
      p: [0, top + rf.slab + pr.height / 2, coreZ],
      s: [pr.width, pr.height, pr.depth],
      level: lvl,
    });
    for (const sx of [-1, 1]) {
      L.roof.lights.push({
        p: [sx * (hw - 0.6), pt + 0.15, hd - 0.6],
        s: [0.28, 0.28, 0.28],
        level: lvl,
      });
    }
  }

  return L;
}

/** Box lists keyed by group path ('windows.glass', 'slabs', …). */
export function layoutGroups(L: TowerLayout): Record<string, Box[]> {
  const out: Record<string, Box[]> = {};
  for (const { group, box } of allBoxes(L)) (out[group] ??= []).push(box);
  return out;
}

/** Every box list in a layout, flattened — for bounds checks and stats. */
export function allBoxes(L: TowerLayout): { group: string; box: Box }[] {
  const out: { group: string; box: Box }[] = [];
  const walk = (prefix: string, v: unknown) => {
    if (Array.isArray(v)) {
      for (const b of v as Box[]) out.push({ group: prefix, box: b });
    } else if (v && typeof v === 'object') {
      for (const [k, child] of Object.entries(v)) {
        if (k === 'spec') continue;
        walk(prefix ? `${prefix}.${k}` : k, child);
      }
    }
  };
  walk('', L);
  return out;
}
