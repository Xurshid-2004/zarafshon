// ============================================================================
//  Site plan. Everything outside the two buildings is described here so the
//  ground, the environment props and the amenity hotspots stay in agreement.
//  Units are metres; x is east/west, z is north/south (+z is toward the
//  default camera).
// ============================================================================

export interface Patch {
  x: number;
  z: number;
  w: number;
  d: number;
  /** Seconds after the environment window opens. */
  delay: number;
}

/** Lawns — these "expand" during the environment phase. */
export const LAWNS: readonly Patch[] = [
  { x: 0, z: 30, w: 82, d: 15, delay: 0.0 },
  { x: 0, z: -21, w: 78, d: 18, delay: 0.08 },
  { x: -32, z: 6, w: 15, d: 26, delay: 0.16 },
  { x: 35, z: 6, w: 14, d: 26, delay: 0.22 },
];

/** Paved plaza + walkways. */
export const PAVING: readonly Patch[] = [
  // courtyard spine between the two buildings
  { x: 0, z: 3, w: 10, d: 26, delay: 0.05 },
  // frontage walk along the south face of both buildings
  { x: 0, z: 11.5, w: 62, d: 4.5, delay: 0.12 },
  // link to the playground
  { x: 0, z: 17, w: 5, d: 8, delay: 0.2 },
  // side approach, west
  { x: -24, z: 6, w: 4, d: 22, delay: 0.26 },
  // side approach, east
  { x: 27.5, z: 6, w: 4, d: 22, delay: 0.3 },
];

export interface ParkingLot {
  /** Centre of the asphalt pad. */
  x: number;
  z: number;
  w: number;
  d: number;
  /** Slots run along this axis. */
  axis: 'x' | 'z';
  slots: number;
  delay: number;
}

export const PARKING: readonly ParkingLot[] = [
  { x: -31, z: -6, w: 13, d: 26, axis: 'z', slots: 8, delay: 0.42 },
  { x: 34, z: -6, w: 13, d: 26, axis: 'z', slots: 8, delay: 0.5 },
  { x: 0, z: -15, w: 52, d: 11, axis: 'x', slots: 16, delay: 0.58 },
];

export const PLAYGROUND = { x: 0, z: 21, w: 19, d: 14 } as const;

export interface TreeSpec {
  x: number;
  z: number;
  /** Trunk height, metres. */
  h: number;
  /** Crown radius, metres. */
  r: number;
  /** Index into the foliage material list. */
  kind: number;
}

/** Deterministic tree plan — placed by hand so nothing lands inside a building. */
export const TREES: readonly TreeSpec[] = [
  // south lawn row
  { x: -34, z: 28, h: 3.4, r: 2.3, kind: 0 },
  { x: -26, z: 31, h: 4.1, r: 2.7, kind: 1 },
  { x: -18, z: 28, h: 3.1, r: 2.1, kind: 2 },
  { x: -10, z: 32, h: 3.8, r: 2.5, kind: 0 },
  { x: 10, z: 32, h: 3.6, r: 2.4, kind: 1 },
  { x: 18, z: 28, h: 4.3, r: 2.8, kind: 2 },
  { x: 26, z: 31, h: 3.2, r: 2.2, kind: 0 },
  { x: 34, z: 28, h: 3.9, r: 2.6, kind: 1 },
  // north lawn
  { x: -30, z: -24, h: 3.7, r: 2.5, kind: 2 },
  { x: -20, z: -21, h: 3.2, r: 2.2, kind: 0 },
  { x: -8, z: -25, h: 4.0, r: 2.6, kind: 1 },
  { x: 8, z: -25, h: 3.5, r: 2.3, kind: 2 },
  { x: 20, z: -21, h: 3.9, r: 2.6, kind: 0 },
  { x: 31, z: -24, h: 3.3, r: 2.2, kind: 1 },
  // flanks
  { x: -32, z: 14, h: 3.0, r: 2.0, kind: 1 },
  { x: -32, z: 1, h: 3.6, r: 2.4, kind: 2 },
  { x: 36, z: 14, h: 3.1, r: 2.1, kind: 0 },
  { x: 36, z: 1, h: 3.5, r: 2.3, kind: 1 },
  // courtyard accents
  { x: -3.5, z: -4, h: 2.7, r: 1.8, kind: 0 },
  { x: 3.5, z: 8, h: 2.9, r: 1.9, kind: 2 },
  // playground shade
  { x: -11, z: 19, h: 3.4, r: 2.3, kind: 1 },
  { x: 11, z: 19, h: 3.4, r: 2.3, kind: 0 },
];

export interface Prop2D {
  x: number;
  z: number;
  /** Y rotation, radians. */
  ry: number;
}

export const BENCHES: readonly Prop2D[] = [
  { x: -5.6, z: 6, ry: Math.PI / 2 },
  { x: -5.6, z: -1, ry: Math.PI / 2 },
  { x: 5.6, z: 6, ry: -Math.PI / 2 },
  { x: 5.6, z: -1, ry: -Math.PI / 2 },
  { x: -13, z: 14.5, ry: 0 },
  { x: 14, z: 14.5, ry: 0 },
  { x: -8, z: 26, ry: Math.PI },
  { x: 8, z: 26, ry: Math.PI },
];

export const LAMPS: readonly Prop2D[] = [
  { x: -7.5, z: 13, ry: 0 },
  { x: 7.5, z: 13, ry: 0 },
  { x: -22, z: 13, ry: 0 },
  { x: 24, z: 13, ry: 0 },
  { x: -24, z: -4, ry: 0 },
  { x: 27.5, z: -4, ry: 0 },
  { x: -13, z: 25, ry: 0 },
  { x: 14, z: 25, ry: 0 },
  { x: 0, z: -11, ry: 0 },
];

/** Hover hotspots that name the amenities for the visitor. */
export interface Amenity {
  id: 'playground' | 'parking' | 'green' | 'shops';
  x: number;
  y: number;
  z: number;
}

export const AMENITIES: readonly Amenity[] = [
  { id: 'playground', x: 0, y: 3.2, z: 21 },
  { id: 'parking', x: 0, y: 2.4, z: -15 },
  { id: 'green', x: -30, y: 3.0, z: 28 },
  { id: 'shops', x: 0, y: 4.2, z: 12.5 },
];
