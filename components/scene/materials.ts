// ============================================================================
//  Shared PBR material + geometry cache.
//
//  Every surface carries a procedurally generated albedo, roughness and normal
//  map (see lib/textures.ts) so nothing reads as flat vertex colour. Materials
//  are built once per theme and reused by every mesh, which keeps the renderer
//  swapping GPU state a handful of times per frame instead of once per mesh.
// ============================================================================

import * as THREE from 'three';
import { PALETTE } from '@/lib/palette';
import type { Theme } from '@/lib/types';
import {
  asphalt,
  bark,
  brushedMetal,
  concrete,
  foliageSheet,
  grass,
  plaster,
  rubber,
  sand,
  wood,
  type PbrSet,
} from '@/lib/textures';

const CAN_PAINT = () => typeof document !== 'undefined';

export interface SceneMaterials {
  slab: THREE.MeshStandardMaterial;
  frame: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  core: THREE.MeshStandardMaterial;
  railing: THREE.MeshPhysicalMaterial;
  railCap: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;

  shopGlass: THREE.MeshPhysicalMaterial;
  shopGlow: THREE.MeshStandardMaterial;
  signage: THREE.MeshStandardMaterial;

  terrain: THREE.MeshStandardMaterial;
  grass: THREE.MeshStandardMaterial;
  grassDark: THREE.MeshStandardMaterial;
  concrete: THREE.MeshStandardMaterial;
  plaza: THREE.MeshStandardMaterial;
  asphalt: THREE.MeshStandardMaterial;
  lineMark: THREE.MeshStandardMaterial;
  curb: THREE.MeshStandardMaterial;

  trunk: THREE.MeshStandardMaterial;
  foliage: THREE.MeshStandardMaterial;
  bench: THREE.MeshStandardMaterial;
  lampPost: THREE.MeshStandardMaterial;
  lampGlow: THREE.MeshStandardMaterial;

  playFrame: THREE.MeshStandardMaterial;
  playSoft: THREE.MeshStandardMaterial;
  playAccent: THREE.MeshStandardMaterial;
  sand: THREE.MeshStandardMaterial;

  carPaint: THREE.MeshPhysicalMaterial;
  carGlass: THREE.MeshPhysicalMaterial;
  wheel: THREE.MeshStandardMaterial;
  tyre: THREE.MeshStandardMaterial;

  interiorWall: THREE.MeshStandardMaterial;
  furniture: THREE.MeshStandardMaterial;
  floorFinish: THREE.MeshStandardMaterial;
}

const cache = new Map<Theme, SceneMaterials>();

/** Standard material from a generated PBR set, with a plain-colour fallback. */
function pbr(
  color: string,
  set: PbrSet | null,
  o: { roughness?: number; metalness?: number; normalScale?: number } = {},
): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({
    color,
    roughness: o.roughness ?? 0.8,
    metalness: o.metalness ?? 0,
  });
  if (set) {
    m.map = set.map;
    m.roughnessMap = set.roughnessMap;
    m.normalMap = set.normalMap;
    m.normalScale = new THREE.Vector2(o.normalScale ?? 1, o.normalScale ?? 1);
    // the albedo already carries the tint
    m.color.set('#FFFFFF');
  }
  return m;
}

function build(theme: Theme): SceneMaterials {
  const p = PALETTE[theme];
  const paint = CAN_PAINT();
  const night = theme === 'dark';
  const glow = night ? 1 : 0.12;

  const tex = {
    slab: paint ? concrete(p.slab, 1, 11) : null,
    core: paint ? concrete(p.core, 1, 17) : null,
    roof: paint ? asphalt(p.concrete, 1, 29) : null,
    wood: paint ? wood(p.wood, '#6B421F', 1, 97) : null,
    terrain: paint ? concrete(p.terrain, 1, 61) : null,
    grass: paint ? grass(p.grass, p.grassDark, 1, 77) : null,
    grassDark: paint ? grass(p.grassDark, '#3A5A2A', 1, 83) : null,
    plaza: paint ? concrete(p.plaza, 1, 37) : null,
    concrete: paint ? concrete(p.concrete, 1, 43) : null,
    asphalt: paint ? asphalt(p.asphalt, 1, 53) : null,
    bark: paint ? bark(p.trunk, 1, 131) : null,
    sand: paint ? sand(p.sand, 1, 157) : null,
    rubber: paint ? rubber(p.playSoft, 1, 181) : null,
    metal: paint ? brushedMetal(p.frame, 1, 199) : null,
    plaster: paint ? plaster('#EDE8DF', 1, 31) : null,
    fabric: paint ? plaster(night ? '#8C7E6B' : '#A29383', 1, 211) : null,
    parquet: paint ? wood('#C09A6B', '#8E6A42', 1, 223) : null,
    benchWood: paint ? wood(p.bench, '#6A4423', 1, 233) : null,
    painted: paint ? plaster(p.playFrame, 1, 241) : null,
    paintedAccent: paint ? plaster(p.playAccent, 1, 251) : null,
  };

  const foliageMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    roughness: 0.88,
    metalness: 0,
    transparent: false,
    alphaTest: 0.42,
    side: THREE.DoubleSide,
  });
  if (paint) foliageMat.map = foliageSheet(p.foliage, theme === 'dark' ? 3 : 5);

  return {
    slab: pbr(p.slab, tex.slab, { roughness: 0.78, normalScale: 0.5 }),
    frame: pbr(p.frame, tex.metal, { roughness: 0.38, metalness: 0.65, normalScale: 0.3 }),
    wood: pbr(p.wood, tex.wood, { roughness: 0.55, normalScale: 0.7 }),
    core: pbr(p.core, tex.core, { roughness: 0.84, normalScale: 0.5 }),
    railing: new THREE.MeshPhysicalMaterial({
      color: p.railing,
      roughness: 0.04,
      metalness: 0,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      ior: 1.5,
      reflectivity: 0.6,
      envMapIntensity: 1.8,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
    }),
    railCap: pbr(p.frame, tex.metal, { roughness: 0.3, metalness: 0.75, normalScale: 0.3 }),
    roof: pbr(p.concrete, tex.roof, { roughness: 0.92, normalScale: 1.1 }),

    shopGlass: new THREE.MeshPhysicalMaterial({
      color: p.shopGlass,
      roughness: 0.03,
      metalness: 0,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      ior: 1.5,
      reflectivity: 0.7,
      envMapIntensity: 2,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
    }),
    shopGlow: new THREE.MeshStandardMaterial({
      color: p.shopGlow,
      roughness: 0.95,
      emissive: new THREE.Color(p.shopGlow),
      emissiveIntensity: 0.25 + glow * 1.1,
    }),
    signage: new THREE.MeshStandardMaterial({
      color: p.signage,
      roughness: 0.45,
      metalness: 0.2,
      emissive: new THREE.Color(p.signage),
      emissiveIntensity: 0.1 + glow * 0.7,
    }),

    terrain: pbr(p.terrain, tex.terrain, { roughness: 0.95, normalScale: 0.6 }),
    grass: pbr(p.grass, tex.grass, { roughness: 0.95, normalScale: 1.2 }),
    grassDark: pbr(p.grassDark, tex.grassDark, { roughness: 0.95, normalScale: 1.2 }),
    concrete: pbr(p.concrete, tex.concrete, { roughness: 0.88, normalScale: 0.7 }),
    plaza: pbr(p.plaza, tex.plaza, { roughness: 0.84, normalScale: 0.7 }),
    asphalt: pbr(p.asphalt, tex.asphalt, { roughness: 0.93, normalScale: 1.4 }),
    lineMark: new THREE.MeshStandardMaterial({ color: p.lineMark, roughness: 0.75 }),
    curb: pbr(p.concrete, tex.concrete, { roughness: 0.86, normalScale: 0.6 }),

    trunk: pbr(p.trunk, tex.bark, { roughness: 0.92, normalScale: 1.6 }),
    foliage: foliageMat,
    bench: pbr(p.bench, tex.benchWood, { roughness: 0.6, normalScale: 0.8 }),
    lampPost: pbr(p.lampPost, tex.metal, { roughness: 0.35, metalness: 0.7, normalScale: 0.3 }),
    lampGlow: new THREE.MeshStandardMaterial({
      color: p.lampGlow,
      roughness: 1,
      emissive: new THREE.Color(p.lampGlow),
      emissiveIntensity: 0.15 + glow * 2.2,
    }),

    playFrame: pbr(p.playFrame, tex.painted, { roughness: 0.5, normalScale: 0.4 }),
    playSoft: pbr(p.playSoft, tex.rubber, { roughness: 0.92, normalScale: 1.3 }),
    playAccent: pbr(p.playAccent, tex.paintedAccent, { roughness: 0.48, normalScale: 0.4 }),
    sand: pbr(p.sand, tex.sand, { roughness: 0.97, normalScale: 1.1 }),

    carPaint: new THREE.MeshPhysicalMaterial({
      color: '#FFFFFF',
      roughness: 0.26,
      metalness: 0.55,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.5,
    }),
    carGlass: new THREE.MeshPhysicalMaterial({
      color: p.carGlass,
      roughness: 0.06,
      metalness: 0.1,
      transparent: true,
      opacity: 0.75,
      envMapIntensity: 1.6,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
    }),
    wheel: pbr('#9BA2A8', tex.metal, { roughness: 0.3, metalness: 0.8, normalScale: 0.3 }),
    tyre: pbr(p.wheel, tex.rubber, { roughness: 0.95, normalScale: 0.9 }),

    interiorWall: pbr('#EDE8DF', tex.plaster, { roughness: 0.88, normalScale: 0.5 }),
    furniture: pbr(night ? '#8C7E6B' : '#A29383', tex.fabric, { roughness: 0.9, normalScale: 0.6 }),
    floorFinish: pbr('#C09A6B', tex.parquet, { roughness: 0.52, normalScale: 0.7 }),
  };
}

export function getMaterials(theme: Theme): SceneMaterials {
  let m = cache.get(theme);
  if (!m) {
    m = build(theme);
    cache.set(theme, m);
  }
  return m;
}

// ===========================================================================
//  Geometry cache
// ===========================================================================

const geoCache = new Map<string, THREE.BufferGeometry>();

function cached<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = geoCache.get(key) as T | undefined;
  if (!g) {
    g = make();
    geoCache.set(key, g);
  }
  return g;
}

export function unitBox(): THREE.BoxGeometry {
  return cached('box', () => new THREE.BoxGeometry(1, 1, 1));
}

export function cyl(segments = 10): THREE.CylinderGeometry {
  return cached(`cyl${segments}`, () => new THREE.CylinderGeometry(0.5, 0.5, 1, segments));
}

export function taperedCyl(topScale: number, segments = 10): THREE.CylinderGeometry {
  return cached(
    `tcyl${topScale}-${segments}`,
    () => new THREE.CylinderGeometry(0.5 * topScale, 0.5, 1, segments),
  );
}

export function sphere(detail = 1): THREE.IcosahedronGeometry {
  return cached(`ico${detail}`, () => new THREE.IcosahedronGeometry(0.5, detail));
}

/**
 * Chamfered box. Real concrete and metal never have a mathematically sharp
 * arris; a small bevel is what makes an edge catch the light.
 */
export function bevelBox(w: number, h: number, d: number, bevel = 0.02): THREE.BufferGeometry {
  const key = `bev-${w}-${h}-${d}-${bevel}`;
  return cached(key, () => {
    const b = Math.min(bevel, w / 2.2, h / 2.2, d / 2.2);
    const shape = new THREE.Shape();
    const hw = w / 2 - b;
    const hh = h / 2 - b;
    shape.moveTo(-hw, -h / 2);
    shape.lineTo(hw, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -hh);
    shape.lineTo(w / 2, hh);
    shape.quadraticCurveTo(w / 2, h / 2, hw, h / 2);
    shape.lineTo(-hw, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, hh);
    shape.lineTo(-w / 2, -hh);
    shape.quadraticCurveTo(-w / 2, -h / 2, -hw, -h / 2);

    const g = new THREE.ExtrudeGeometry(shape, {
      depth: d - b * 2,
      bevelEnabled: true,
      bevelThickness: b,
      bevelSize: b,
      bevelSegments: 2,
      curveSegments: 2,
    });
    g.translate(0, 0, -(d - b * 2) / 2);
    g.computeVertexNormals();
    return g;
  });
}

/**
 * Plane whose UVs are scaled to world size, so one texel covers the same
 * number of metres on a 15 m lawn and an 82 m lawn.
 */
export function uvPlane(w: number, d: number, metersPerTile: number): THREE.PlaneGeometry {
  const key = `uvp-${w}-${d}-${metersPerTile}`;
  return cached(key, () => {
    const g = new THREE.PlaneGeometry(w, d);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const su = w / metersPerTile;
    const sv = d / metersPerTile;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
    }
    uv.needsUpdate = true;
    return g;
  });
}

/** Box with world-scaled UVs on every face. */
export function uvBox(w: number, h: number, d: number, metersPerTile: number): THREE.BoxGeometry {
  const key = `uvb-${w}-${h}-${d}-${metersPerTile}`;
  return cached(key, () => {
    const g = new THREE.BoxGeometry(w, h, d);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    // face order: +x, -x, +y, -y, +z, -z — 4 verts each
    const spans: [number, number][] = [
      [d, h],
      [d, h],
      [w, d],
      [w, d],
      [w, h],
      [w, h],
    ];
    let i = 0;
    for (const [su, sv] of spans) {
      for (let k = 0; k < 4; k++, i++) {
        uv.setXY(i, uv.getX(i) * (su / metersPerTile), uv.getY(i) * (sv / metersPerTile));
      }
    }
    uv.needsUpdate = true;
    return g;
  });
}

/**
 * Crossed quads for billboard foliage: N vertical planes rotated about Y plus
 * one tilted cap, merged by hand into a single BufferGeometry so a whole wood
 * can be drawn as one InstancedMesh.
 */
export function crossedQuads(planes = 3): THREE.BufferGeometry {
  return cached(`xq${planes}`, () => {
    const pos: number[] = [];
    const uvs: number[] = [];
    const idx: number[] = [];
    let v = 0;

    const addQuad = (ax: number, ty: number) => {
      const c = Math.cos(ax);
      const s = Math.sin(ax);
      // unit quad in XY, rotated about Y, optionally tilted toward horizontal
      const corners: [number, number, number][] = [
        [-0.5, -0.5, 0],
        [0.5, -0.5, 0],
        [0.5, 0.5, 0],
        [-0.5, 0.5, 0],
      ];
      for (const [x, y, z] of corners) {
        const yy = y * Math.cos(ty) - z * Math.sin(ty);
        const zz = y * Math.sin(ty) + z * Math.cos(ty);
        pos.push(x * c + zz * s, yy, -x * s + zz * c);
      }
      uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
      idx.push(v, v + 1, v + 2, v, v + 2, v + 3);
      v += 4;
    };

    for (let i = 0; i < planes; i++) addQuad((i * Math.PI) / planes, 0);
    addQuad(Math.PI / 4, Math.PI / 2.4);

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  });
}

/**
 * Car body: a side profile extruded across the width and bevelled. Reads as a
 * vehicle from any angle, unlike a stack of boxes.
 */
export function carBodyGeometry(): THREE.BufferGeometry {
  return cached('carbody', () => {
    const L = 4.3;
    const s = new THREE.Shape();
    // profile in metres, origin at the centre of the car, y up
    s.moveTo(-L / 2 + 0.12, 0.0);
    s.lineTo(L / 2 - 0.12, 0.0);
    s.quadraticCurveTo(L / 2, 0.0, L / 2, 0.16);
    s.lineTo(L / 2, 0.52);
    s.quadraticCurveTo(L / 2 - 0.02, 0.68, L / 2 - 0.42, 0.74); // bonnet
    s.lineTo(0.72, 0.8);
    s.quadraticCurveTo(0.42, 0.84, 0.3, 1.18); // windscreen
    s.lineTo(-0.5, 1.26); // roof
    s.quadraticCurveTo(-1.12, 1.26, -1.42, 0.88); // rear screen
    s.lineTo(-L / 2 + 0.22, 0.74);
    s.quadraticCurveTo(-L / 2, 0.7, -L / 2, 0.5);
    s.lineTo(-L / 2, 0.16);
    s.quadraticCurveTo(-L / 2, 0.0, -L / 2 + 0.12, 0.0);

    const g = new THREE.ExtrudeGeometry(s, {
      depth: 1.62,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 3,
      curveSegments: 6,
    });
    g.translate(0, 0, -0.81);
    g.computeVertexNormals();
    return g;
  });
}

/** Simple torus-ish tyre lying in the XZ plane. */
export function tyreGeometry(): THREE.BufferGeometry {
  return cached('tyre', () => {
    const g = new THREE.CylinderGeometry(0.33, 0.33, 0.22, 16);
    g.rotateX(Math.PI / 2);
    return g;
  });
}

export function hubGeometry(): THREE.BufferGeometry {
  return cached('hub', () => {
    const g = new THREE.CylinderGeometry(0.19, 0.19, 0.24, 12);
    g.rotateX(Math.PI / 2);
    return g;
  });
}

// ===========================================================================
//  Curtain-wall facade texture
//
//  Mullions, transoms and per-panel tint variation are painted into a canvas
//  rather than modelled. Modelling them would cost ~120 extra meshes across
//  18 storeys; this costs one 2048x1024 texture per (column count, theme).
//  At 2K a mullion is ~16 px wide, which survives the mip chain at the
//  distances the camera actually sits at. At 1K it blurred into the glass.
// ===========================================================================

const facadeCache = new Map<string, THREE.CanvasTexture>();

export function getFacadeTexture(columns: number, theme: Theme): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;

  const key = `${columns}-${theme}`;
  const hit = facadeCache.get(key);
  if (hit) return hit;

  const p = PALETTE[theme];
  const night = theme === 'dark';
  const W = 2048;
  const H = 1024;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, W, H);

  const panelsPerBay = 2;
  const totalPanels = columns * panelsPerBay;
  const panelW = W / totalPanels;
  const transomY = Math.round(H * 0.46);

  // deterministic per-panel variation
  let s = columns * 7919 + (night ? 13 : 29);
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  for (let i = 0; i < totalPanels; i++) {
    for (let row = 0; row < 2; row++) {
      const x = i * panelW;
      const y = row === 0 ? 0 : transomY;
      const h = row === 0 ? transomY : H - transomY;

      // base glazing: alpha carries the transparency, colour carries the tint
      const v = 0.93 + rnd() * 0.12;
      const grad = ctx.createLinearGradient(x, y, x + panelW, y + h);
      const [gr, gg, gb] = [
        parseInt(p.glass.slice(1, 3), 16),
        parseInt(p.glass.slice(3, 5), 16),
        parseInt(p.glass.slice(5, 7), 16),
      ];
      const c1 = `rgba(${Math.min(255, gr * v * 1.2) | 0},${Math.min(255, gg * v * 1.14) | 0},${Math.min(255, gb * v * 1.05) | 0},0.94)`;
      const c2 = `rgba(${(gr * v * 0.42) | 0},${(gg * v * 0.48) | 0},${(gb * v * 0.62) | 0},0.9)`;
      grad.addColorStop(0, c1);
      grad.addColorStop(0.55, c2);
      grad.addColorStop(1, c1);
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, panelW, h);

      // a minority of panels have blinds or a lit interior behind them
      /*
        A minority of panes show blinds or a lit room behind them. Kept rare
        and low-contrast on purpose: at a high rate the facade stops reading
        as one curtain wall and turns into a patchwork quilt.
      */
      const roll = rnd();
      if (roll > 0.9) {
        ctx.fillStyle = night ? 'rgba(255,200,126,0.66)' : 'rgba(226,220,206,0.34)';
        ctx.fillRect(x + panelW * 0.07, y + h * 0.08, panelW * 0.86, h * 0.84);
      } else if (roll < 0.14) {
        ctx.fillStyle = 'rgba(10,16,24,0.3)';
        ctx.fillRect(x + panelW * 0.07, y + h * 0.08, panelW * 0.86, h * 0.84);
      }
    }
  }

  // sky reflection sweeping across the whole sheet
  const sheen = ctx.createLinearGradient(0, H, W, 0);
  sheen.addColorStop(0, 'rgba(255,255,255,0.0)');
  sheen.addColorStop(0.4, 'rgba(255,255,255,0.12)');
  sheen.addColorStop(0.52, 'rgba(255,255,255,0.0)');
  sheen.addColorStop(0.74, 'rgba(255,255,255,0.09)');
  sheen.addColorStop(1, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, W, H);

  /*
    Real curtain wall is brighter at the head of each pane, where it catches
    the sky, and darker at the sill, where it reflects the ground. Without
    this the sheet reads as a flat tinted surface however good the envmap is.
  */
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, night ? 'rgba(150,190,235,0.10)' : 'rgba(205,228,255,0.15)');
  sky.addColorStop(0.42, 'rgba(255,255,255,0.0)');
  sky.addColorStop(1, night ? 'rgba(0,0,0,0.12)' : 'rgba(62,54,40,0.11)');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // --- frame members: fully opaque -----------------------------------------
  const fr = p.frame;
  const mullionW = 17;

  for (let i = 0; i <= totalPanels; i++) {
    const x = Math.round(i * panelW) - mullionW / 2;
    const major = i % panelsPerBay === 0;
    ctx.fillStyle = fr;
    ctx.fillRect(Math.max(0, Math.min(W - mullionW, x)), 0, major ? mullionW + 3 : mullionW, H);
    // highlight on the sunward edge of each mullion
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(Math.max(0, Math.min(W - 3, x + (major ? mullionW + 1 : mullionW - 3))), 0, 3, H);
  }

  ctx.fillStyle = fr;
  ctx.fillRect(0, transomY - 5, W, 12);
  ctx.fillRect(0, 0, W, 20);
  // spandrel at the sill, where the floor slab sits behind the glass
  ctx.fillStyle = p.slab;
  ctx.fillRect(0, H - 108, W, 108);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0, H - 108, W, 13);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(0, H - 20, W, 20);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  facadeCache.set(key, tex);
  return tex;
}
