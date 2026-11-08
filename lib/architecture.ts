// ============================================================================
//  ARCHITECTURE CONFIG — the single source of truth for every dimension of
//  the two Zarafshon Residence towers.
//
//  All values are metres. Change a number here and both the procedural 3D
//  engine (components/engine) and the apartment data (lib/buildingConfig.ts)
//  follow — nothing else hard-codes a building dimension.
//
//  Coordinate frame of one tower:
//    origin  = centre of the footprint at ground level (y = 0)
//    +x      = east along the main facade, +z = front (toward the courtyard)
//    level L = storey 1..floors; its slab bottom sits at (L - 1) * floorHeight
// ============================================================================

import type { BuildingId } from './types';

export interface TowerSpec {
  id: BuildingId;
  /** Prefix used in mesh names, kept for raycasting compatibility. */
  meshPrefix: string;
  floors: number;
  /** World position of the footprint centre. */
  position: [number, number, number];
  /** Facade length along x. */
  width: number;
  /** Depth along z. */
  depth: number;
  /** Horizontal offset of the main entrance on the front facade. */
  entranceX: number;
}

export interface ArchitectureConfig {
  /** Storey height, slab bottom to slab bottom. */
  floorHeight: number;
  /** Structural slab thickness. */
  slab: number;

  foundation: {
    /** Raft slab thickness below ground. */
    raftDepth: number;
    /** How far the raft extends past the footprint on every side. */
    raftMargin: number;
    /** Visible concrete plinth ring above ground. */
    plinthHeight: number;
    plinthMargin: number;
    pileCap: number;
    pileLength: number;
  };

  structure: {
    columnSize: number;
    /** Target spacing of the column grid; the real spacing is evened out. */
    columnSpacing: number;
    /** Column centre distance from the facade line. */
    edgeInset: number;
    /** Add a second line of columns through the middle of the plan. */
    interiorColumns: boolean;
    core: { width: number; depth: number; /** distance of core centre from the back facade */ fromBack: number };
  };

  curtainWall: {
    /** Target glazing module width on residential floors. */
    module: number;
    /** Shopfront module multiplier on the commercial ground floor. */
    shopModuleFactor: number;
    mullionWidth: number;
    mullionDepth: number;
    glassThickness: number;
    /** Opaque spandrel band: how far it extends below the slab… */
    spandrelBelow: number;
    /** …and above the top of the slab. */
    spandrelAbove: number;
    spandrelThickness: number;
    /** Interior volume inset behind the glass (keeps the facade from reading hollow). */
    interiorInset: number;
  };

  fins: {
    width: number;
    /** Depth of the dark frames between front balconies. */
    frontDepth: number;
    /** Depth of fins on the back and side facades. */
    sideDepth: number;
    /** A fin on every Nth mullion of the back and side facades. */
    every: number;
    cornerSize: number;
  };

  balcony: {
    depth: number;
    slab: number;
    railHeight: number;
    /** Balcony width as a share of the apartment's facade slot. */
    widthRatio: number;
    planters: boolean;
  };

  entrance: {
    width: number;
    /** Depth of the recessed lobby behind the facade line. */
    recess: number;
    canopyDepth: number;
    canopyThickness: number;
    canopyOverhang: number;
  };

  roof: {
    slab: number;
    parapetHeight: number;
    parapetThickness: number;
    plantRoom: { width: number; height: number; depth: number };
  };

  towers: TowerSpec[];
}

export const ARCH: ArchitectureConfig = {
  floorHeight: 3.1,
  slab: 0.26,

  foundation: {
    raftDepth: 1.2,
    raftMargin: 1.0,
    plinthHeight: 0.14,
    plinthMargin: 0.45,
    pileCap: 1.4,
    pileLength: 6,
  },

  structure: {
    columnSize: 0.5,
    columnSpacing: 6,
    edgeInset: 0.7,
    interiorColumns: true,
    core: { width: 3.2, depth: 3.8, fromBack: 2.4 },
  },

  curtainWall: {
    module: 1.6,
    shopModuleFactor: 2,
    mullionWidth: 0.07,
    mullionDepth: 0.16,
    glassThickness: 0.03,
    spandrelBelow: 0.4,
    spandrelAbove: 0.12,
    spandrelThickness: 0.1,
    interiorInset: 1.3,
  },

  fins: {
    width: 0.14,
    frontDepth: 1.7,
    sideDepth: 0.4,
    every: 2,
    cornerSize: 0.32,
  },

  balcony: {
    depth: 1.6,
    slab: 0.18,
    railHeight: 1.05,
    widthRatio: 0.76,
    planters: true,
  },

  entrance: {
    width: 6,
    recess: 1.2,
    canopyDepth: 2.6,
    canopyThickness: 0.28,
    canopyOverhang: 0.6,
  },

  roof: {
    slab: 0.32,
    parapetHeight: 1.0,
    parapetThickness: 0.22,
    plantRoom: { width: 4.2, height: 2.2, depth: 3.4 },
  },

  towers: [
    { id: 'A', meshPrefix: 'bld7', floors: 7, position: [-13.5, 0, 2], width: 16, depth: 12, entranceX: 0 },
    { id: 'B', meshPrefix: 'bld11', floors: 11, position: [14.5, 0, -2], width: 19, depth: 12, entranceX: 0 },
  ],
};

export const TOWER_BY_ID: Record<BuildingId, TowerSpec> = {
  A: ARCH.towers[0],
  B: ARCH.towers[1],
};

/** Total height to the top of the roof slab (parapet excluded). */
export function towerHeight(t: TowerSpec): number {
  return t.floors * ARCH.floorHeight + ARCH.roof.slab;
}
