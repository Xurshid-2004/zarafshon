// ============================================================================
//  Domain types — uy-joy-web.cloud
//  Interaktiv 3D turar-joy majmuasi selektori
// ============================================================================

export type Lang = 'uz' | 'ru';
export type Theme = 'dark' | 'light';
export type BuildingId = 'A' | 'B';
export type ApartmentStatus = 'available' | 'reserved' | 'sold';
export type FloorKind = 'commercial' | 'residential';
export type RoomKind = 'living' | 'bedroom' | 'kitchen' | 'bath' | 'hall' | 'balcony';
/** Which photoreal interior photo set an apartment is illustrated with. */
export type RenderSet = '1room' | '2room' | '3room' | 'penthouse';

/** Blueprint-space rectangle. Coordinate space is 0..100 (x) by 0..72 (y). */
export interface RoomRect {
  kind: RoomKind;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Local-space axis-aligned bounds of an apartment sub-mesh (metadata for raycasting). */
export interface MeshBounds {
  min: [number, number, number];
  max: [number, number, number];
}

export interface Apartment {
  /** Spec-format identifier, e.g. `Bld11_F05_Apt02`. Also the mesh name. */
  id: string;
  building: BuildingId;
  /** 1-based floor level. */
  floor: number;
  /** 1-based apartment index within the floor. */
  index: number;
  rooms: number;
  /** Total area, m². */
  area: number;
  /** USD per m². */
  pricePerM2: number;
  /** Total price, USD. */
  price: number;
  status: ApartmentStatus;
  balcony: boolean;
  /** Photoreal gallery group shown in the apartment drawer. */
  renderSet: RenderSet;
  /** Interior partition rectangles used by both the 2D blueprint and the 3D interior. */
  layout: RoomRect[];
  /** Horizontal slot the unit occupies on the facade, normalised 0..1. */
  slotStart: number;
  slotEnd: number;
  bounds: MeshBounds;
}

export interface FloorData {
  /** Stable UI key, e.g. `B-5`. */
  id: string;
  /** Three.js Group name per project spec, e.g. `bld11_floor_5`. */
  meshName: string;
  /** Alternate zero-padded spec name, e.g. `Bld11_Floor_05`. */
  specName: string;
  building: BuildingId;
  level: number;
  kind: FloorKind;
  /** Vertical offset of the floor group inside its building, metres. */
  baseY: number;
  apartments: Apartment[];
}

export interface BuildingData {
  id: BuildingId;
  /** `bld7` | `bld11` */
  meshPrefix: string;
  floorsCount: number;
  position: [number, number, number];
  /** Facade width along X, metres. */
  width: number;
  /** Depth along Z, metres. */
  depth: number;
  floorHeight: number;
  aptsPerFloor: number;
  floors: FloorData[];
  /** Total structural height, metres. */
  height: number;
}
