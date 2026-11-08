import * as THREE from 'three';
import { FLOOR_HEIGHT, SLAB } from '@/lib/buildingConfig';
import type { BuildingData } from '@/lib/types';

/** Geometry shared by every floor of one building — built once per building. */
export interface BuildingGeo {
  innerH: number;
  glassH: number;
  slab: THREE.BoxGeometry;
  glass: THREE.BoxGeometry;
  glassEdges: THREE.EdgesGeometry;
  core: THREE.BoxGeometry;
  band: THREE.BoxGeometry;
  roofSlab: THREE.BoxGeometry;
  parapet: THREE.BoxGeometry;
  plant: THREE.BoxGeometry;
}

export function makeBuildingGeo(b: BuildingData): BuildingGeo {
  const innerH = FLOOR_HEIGHT - SLAB;
  const glassH = innerH - 0.16;
  const glass = new THREE.BoxGeometry(b.width - 0.18, glassH, b.depth - 0.18);

  return {
    innerH,
    glassH,
    slab: new THREE.BoxGeometry(b.width, SLAB, b.depth),
    glass,
    glassEdges: new THREE.EdgesGeometry(glass),
    core: new THREE.BoxGeometry(3.2, innerH, 3.8),
    band: new THREE.BoxGeometry(b.width + 0.12, 0.24, b.depth + 0.12),
    roofSlab: new THREE.BoxGeometry(b.width + 0.5, 0.32, b.depth + 0.5),
    parapet: new THREE.BoxGeometry(b.width + 0.5, 0.95, 0.22),
    plant: new THREE.BoxGeometry(4.2, 1.9, 3.4),
  };
}

export function disposeBuildingGeo(g: BuildingGeo): void {
  g.slab.dispose();
  g.glass.dispose();
  g.glassEdges.dispose();
  g.core.dispose();
  g.band.dispose();
  g.roofSlab.dispose();
  g.parapet.dispose();
  g.plant.dispose();
}
