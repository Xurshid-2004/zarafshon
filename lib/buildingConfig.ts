// ============================================================================
//  Site layout + procedural unit data.
//
//  Nothing here is downloaded: the whole complex is described by numbers and
//  generated on the fly, which keeps the scene footprint at 0 MB of assets.
//
//  Mesh naming (required for WebGL raycasting):
//    floor group      bld7_floor_3        (project spec, lower-case)
//    floor alt name   Bld7_Floor_03       (stored in userData.specName)
//    apartment mesh   Bld11_F05_Apt02     (unique, carries metadata bounds)
// ============================================================================

import { ARCH } from './architecture';
import { renderSetFor } from './renders';
import { seeded } from './rng';
import type {
  Apartment,
  ApartmentStatus,
  BuildingData,
  BuildingId,
  FloorData,
  RoomRect,
} from './types';

/** Storey height, metres (defined in lib/architecture.ts). */
export const FLOOR_HEIGHT = ARCH.floorHeight;
/** Floor-slab thickness, metres. */
export const SLAB = ARCH.slab;
/** Half-size of the ground plane, metres. */
export const SITE_RADIUS = 46;
/** Blueprint coordinate space. */
export const BP_W = 100;
export const BP_H = 72;

interface BuildingDef {
  id: BuildingId;
  meshPrefix: string;
  position: [number, number, number];
  width: number;
  depth: number;
  floorsCount: number;
}

/** Tower dimensions come from the architecture config. */
const DEFS: readonly BuildingDef[] = ARCH.towers.map((t) => ({
  id: t.id,
  meshPrefix: t.meshPrefix,
  position: t.position,
  width: t.width,
  depth: t.depth,
  floorsCount: t.floors,
}));

/** Units on a given storey. Level 1 is commercial; the top storeys are penthouses. */
function unitsOnFloor(def: BuildingDef, level: number): number {
  if (level === 1) return 0;
  if (def.id === 'A') return level === def.floorsCount ? 3 : 4;
  return level >= def.floorsCount - 1 ? 3 : 5;
}

/** Room count per slot, so each floor has a readable mix of layouts. */
function roomsFor(count: number, index: number): number {
  if (count === 3) return [3, 4, 3][index - 1];
  if (count === 4) return [2, 3, 3, 2][index - 1];
  return [1, 2, 3, 2, 3][index - 1];
}

const BASE_AREA: Record<number, number> = { 1: 42, 2: 58, 3: 79, 4: 104 };

/** Non-overlapping interior partition, driven only by the room count. */
function makeLayout(rooms: number, balcony: boolean, rnd: () => number): RoomRect[] {
  const out: RoomRect[] = [];

  const hallW = Math.round(14 + rnd() * 4);
  out.push({ kind: 'hall', x: 0, y: 0, w: hallW, h: BP_H });

  const restX = hallW;
  const restW = BP_W - hallW;

  const bandH = Math.round(BP_H * (0.36 + rnd() * 0.06));
  const topH = BP_H - bandH;

  const kitchenW = Math.round(restW * (0.64 + rnd() * 0.08));
  out.push({ kind: 'kitchen', x: restX, y: topH, w: kitchenW, h: bandH });
  out.push({ kind: 'bath', x: restX + kitchenW, y: topH, w: restW - kitchenW, h: bandH });

  const parts = Math.max(1, rooms);
  const totalShare = 1.25 + (parts - 1);
  let cx = restX;
  for (let i = 0; i < parts; i++) {
    const isLast = i === parts - 1;
    const share = i === 0 ? 1.25 : 1;
    const w = isLast ? restX + restW - cx : Math.round((restW * share) / totalShare);
    out.push({ kind: i === 0 ? 'living' : 'bedroom', x: cx, y: 0, w, h: topH });
    cx += w;
  }

  if (balcony) {
    out.push({ kind: 'balcony', x: restX, y: BP_H, w: Math.round(restW * 0.6), h: 9 });
  }

  return out;
}

function statusFor(level: number, rnd: () => number): ApartmentStatus {
  const r = rnd();
  const soldP = Math.max(0.1, 0.46 - (level - 2) * 0.03);
  const reservedP = 0.17;
  if (r < soldP) return 'sold';
  if (r < soldP + reservedP) return 'reserved';
  return 'available';
}

function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

function makeApartment(def: BuildingDef, level: number, index: number, count: number): Apartment {
  const id = `Bld${def.floorsCount}_F${pad2(level)}_Apt${pad2(index)}`;
  const rnd = seeded(id);

  const rooms = roomsFor(count, index);
  const area = Math.round(BASE_AREA[rooms] * (0.96 + rnd() * 0.08) * 10) / 10;

  const penthouse = level >= def.floorsCount - 1 && count === 3;
  const base = 820 + (level - 2) * 14 + (def.id === 'B' ? 70 : 0) + (penthouse ? 150 : 0);
  const pricePerM2 = Math.round((base * (0.97 + rnd() * 0.06)) / 10) * 10;
  const price = Math.round((area * pricePerM2) / 100) * 100;

  const balcony = rooms >= 2 || rnd() > 0.5;

  // Facade slot, normalised across the usable width.
  const slotStart = (index - 1) / count;
  const slotEnd = index / count;

  // Local-space bounds relative to the floor group origin (y = 0 at slab bottom).
  const usable = def.width - 0.8;
  const slotW = usable / count;
  const x0 = -def.width / 2 + 0.4 + slotW * (index - 1);

  return {
    id,
    building: def.id,
    floor: level,
    index,
    rooms,
    area,
    pricePerM2,
    price,
    status: statusFor(level, rnd),
    balcony,
    renderSet: renderSetFor(rooms),
    layout: makeLayout(rooms, balcony, rnd),
    slotStart,
    slotEnd,
    bounds: {
      min: [x0 + 0.14, SLAB, -def.depth * 0.5 + 0.5],
      max: [x0 + slotW - 0.14, FLOOR_HEIGHT - 0.12, def.depth * 0.5 - 0.4],
    },
  };
}

function buildFloor(def: BuildingDef, level: number): FloorData {
  const count = unitsOnFloor(def, level);
  const apartments: Apartment[] = [];
  for (let i = 1; i <= count; i++) apartments.push(makeApartment(def, level, i, count));

  return {
    id: `${def.id}-${level}`,
    meshName: `${def.meshPrefix}_floor_${level}`,
    specName: `Bld${def.floorsCount}_Floor_${pad2(level)}`,
    building: def.id,
    level,
    kind: level === 1 ? 'commercial' : 'residential',
    baseY: (level - 1) * FLOOR_HEIGHT,
    apartments,
  };
}

function buildBuilding(def: BuildingDef): BuildingData {
  const floors: FloorData[] = [];
  for (let level = 1; level <= def.floorsCount; level++) floors.push(buildFloor(def, level));

  return {
    id: def.id,
    meshPrefix: def.meshPrefix,
    floorsCount: def.floorsCount,
    position: def.position,
    width: def.width,
    depth: def.depth,
    floorHeight: FLOOR_HEIGHT,
    aptsPerFloor: Math.max(...floors.map((f) => f.apartments.length)),
    floors,
    height: def.floorsCount * FLOOR_HEIGHT,
  };
}

export const BUILDINGS: readonly BuildingData[] = DEFS.map(buildBuilding);

export const BUILDING_BY_ID: Record<BuildingId, BuildingData> = {
  A: BUILDINGS[0],
  B: BUILDINGS[1],
};

export const ALL_APARTMENTS: readonly Apartment[] = BUILDINGS.flatMap((b) =>
  b.floors.flatMap((f) => f.apartments),
);

export const APARTMENT_BY_ID: ReadonlyMap<string, Apartment> = new Map(
  ALL_APARTMENTS.map((a) => [a.id, a]),
);

export function getFloor(building: BuildingId, level: number): FloorData | undefined {
  return BUILDING_BY_ID[building].floors.find((f) => f.level === level);
}

export interface SiteStats {
  total: number;
  available: number;
  reserved: number;
  sold: number;
  minPrice: number;
  minPricePerM2: number;
  areaFrom: number;
  areaTo: number;
}

function computeStats(units: readonly Apartment[]): SiteStats {
  const available = units.filter((a) => a.status === 'available');
  const pool = available.length > 0 ? available : units;
  return {
    total: units.length,
    available: available.length,
    reserved: units.filter((a) => a.status === 'reserved').length,
    sold: units.filter((a) => a.status === 'sold').length,
    minPrice: Math.min(...pool.map((a) => a.price)),
    minPricePerM2: Math.min(...pool.map((a) => a.pricePerM2)),
    areaFrom: Math.min(...units.map((a) => a.area)),
    areaTo: Math.max(...units.map((a) => a.area)),
  };
}

export const SITE_STATS: SiteStats = computeStats(ALL_APARTMENTS);

export const BUILDING_STATS: Record<BuildingId, SiteStats> = {
  A: computeStats(BUILDING_BY_ID.A.floors.flatMap((f) => f.apartments)),
  B: computeStats(BUILDING_BY_ID.B.floors.flatMap((f) => f.apartments)),
};

// ---------------------------------------------------------------------------
//  Animation schedule — the 0 s → 5 s construction sequence.
// ---------------------------------------------------------------------------
export const TL = {
  /** Foundation grid + wireframe guides. */
  foundationIn: 0.0,
  foundationOut: 1.0,
  /** Structure rises. */
  structureStart: 1.0,
  structureEnd: 3.0,
  /** Environment deploys. */
  environmentStart: 3.0,
  environmentEnd: 4.5,
  /** Camera hands over to OrbitControls. */
  cameraStart: 4.5,
  cameraEnd: 5.0,
} as const;

/** Per-floor build delay inside the structure window, shared by every floor mesh. */
export function floorDelay(building: BuildingData, level: number): number {
  const span = TL.structureEnd - TL.structureStart;
  const maxFloors = Math.max(...BUILDINGS.map((b) => b.floorsCount));
  const t = (level - 1) / Math.max(1, maxFloors - 1);
  const stagger = building.id === 'A' ? 0.0 : 0.08;
  return TL.structureStart + t * span * 0.86 + stagger;
}
