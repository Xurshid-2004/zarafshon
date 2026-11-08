// Materials the engine needs on top of the shared scene set (components/scene/materials.ts).
// Built once per theme and cached; never disposed while the app runs.

import * as THREE from 'three';
import { getMaterials, type SceneMaterials } from '@/components/scene/materials';
import type { Theme } from '@/lib/types';

export interface EngineMaterials {
  /** Residential curtain-wall glass (tinted per instance). */
  glass: THREE.MeshPhysicalMaterial;
  /** Dark bronze mullions, transoms, door frames, balcony rails. */
  mullion: THREE.MeshStandardMaterial;
  /** Near-black architectural frames: fins, canopy, parapet crown, balcony fascia. */
  fin: THREE.MeshStandardMaterial;
  /** Volume seen through the glass (tinted per instance). */
  interior: THREE.MeshStandardMaterial;
  planter: THREE.MeshStandardMaterial;
  foliage: THREE.MeshStandardMaterial;
  /** Warm architectural light lines on the facade (dusk only). */
  uplight: THREE.MeshStandardMaterial;
  /** Lit name strip on the entrance canopy. */
  sign: THREE.MeshStandardMaterial;
}

const cache = new Map<Theme, EngineMaterials>();

export function getEngineMaterials(theme: Theme): EngineMaterials {
  const hit = cache.get(theme);
  if (hit) return hit;
  const night = theme === 'dark';

  const m: EngineMaterials = {
    glass: new THREE.MeshPhysicalMaterial({
      color: '#FFFFFF',
      metalness: night ? 0.35 : 0.78,
      roughness: 0.05,
      envMapIntensity: night ? 1.4 : 1.9,
      transparent: true,
      opacity: night ? 0.96 : 0.92,
      reflectivity: 0.9,
      emissive: night ? '#FFB567' : '#000000',
      emissiveIntensity: night ? 1.5 : 0,
    }),
    mullion: new THREE.MeshStandardMaterial({ color: '#3A3029', metalness: 0.75, roughness: 0.38 }),
    fin: new THREE.MeshStandardMaterial({ color: '#1E1C1A', metalness: 0.5, roughness: 0.45 }),
    interior: new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      roughness: 0.92,
      emissive: '#000000',
      emissiveIntensity: 0,
    }),
    uplight: new THREE.MeshStandardMaterial({
      color: '#FFD9A0',
      emissive: '#FFC680',
      emissiveIntensity: 3.2,
      toneMapped: false,
    }),
    planter: new THREE.MeshStandardMaterial({ color: '#4A4038', roughness: 0.85 }),
    foliage: new THREE.MeshStandardMaterial({ color: '#4E7A3A', roughness: 0.92 }),
    sign: new THREE.MeshStandardMaterial({
      color: '#E0B47A',
      emissive: '#E0B47A',
      emissiveIntensity: night ? 3 : 1.4,
      toneMapped: false,
    }),
  };
  // a pane glows by its own instance colour, so only the lit rooms shine
  m.glass.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      #ifdef USE_COLOR
        totalEmissiveRadiance *= vColor.rgb * vColor.rgb;
      #endif`,
    );
  };
  m.glass.customProgramCacheKey = () => 'glass-instance-glow';
  cache.set(theme, m);
  return m;
}

// ---------------------------------------------------------------------------
//  World-scale texturing for instanced boxes.
//
//  Every box is a scaled unit cube, so ordinary UVs stretch one texture tile
//  across a 19 m slab. These clones derive UVs from the instance's position
//  instead: the grain keeps its real size and stays put while a box grows
//  during construction.
// ---------------------------------------------------------------------------
function worldUv<T extends THREE.MeshStandardMaterial>(source: T, metersPerTile: number, tint?: string): T {
  const m = source.clone() as T;
  if (tint) m.color.set(tint);
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uWorldTile = { value: 1 / metersPerTile };
    shader.vertexShader =
      'uniform float uWorldTile;\n' +
      shader.vertexShader.replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>
        #ifdef USE_INSTANCING
          vec3 worldUvPos = (instanceMatrix * vec4(position, 1.0)).xyz;
          vec2 worldUvCoord = (abs(normal.y) > 0.5 ? worldUvPos.xz : (abs(normal.x) > 0.5 ? worldUvPos.zy : worldUvPos.xy)) * uWorldTile;
          #ifdef USE_MAP
            vMapUv = worldUvCoord;
          #endif
          #ifdef USE_NORMALMAP
            vNormalMapUv = worldUvCoord;
          #endif
          #ifdef USE_ROUGHNESSMAP
            vRoughnessMapUv = worldUvCoord;
          #endif
        #endif`,
      );
  };
  m.customProgramCacheKey = () => `world-uv-${metersPerTile}`;
  return m;
}

type WorldUvKey = 'foliage' | 'grassDark' | 'slab' | 'concrete' | 'core' | 'roof' | 'wood' | 'grass' | 'plaza' | 'asphalt' | 'playSoft' | 'playFrame';
const worldCache = new Map<Theme, Pick<SceneMaterials, WorldUvKey>>();

export function getWorldUvMaterials(theme: Theme): Pick<SceneMaterials, WorldUvKey> {
  const hit = worldCache.get(theme);
  if (hit) return hit;
  const s = getMaterials(theme);
  const out = {
    slab: worldUv(s.slab, 4),
    concrete: worldUv(s.concrete, 4),
    core: worldUv(s.core, 4),
    roof: worldUv(s.roof, 7),
    wood: worldUv(s.wood, 2.4, '#C9B8A5'),
    grass: worldUv(s.grass, 4.5),
    grassDark: worldUv(s.grassDark, 17, '#A7A48C'),
    // keeps the billboard's own UVs: only the colour is calmed down
    foliage: Object.assign(s.foliage.clone(), { color: new THREE.Color('#A3B394') }),
    plaza: worldUv(s.plaza, 2.6),
    asphalt: worldUv(s.asphalt, 7),
    playSoft: worldUv(s.playSoft, 3),
    playFrame: worldUv(s.playFrame, 3),
  };
  worldCache.set(theme, out);
  return out;
}
