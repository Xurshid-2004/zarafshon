'use client';

// ============================================================================
//  The site around the towers, driven by the same construction progress:
//    0.00-0.05  setting-out lines appear on bare ground
//    0.02-0.06  the excavation opens (pit under each raft)
//    0.06-0.17  foundation fills the pit (rendered by the towers)
//    0.84-1.00  landscaping covers the bare earth
// ============================================================================

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { crossedQuads } from '@/components/scene/materials';
import { partMaterials } from '@/components/engine/parts/shared';
import BoxInstances from '@/components/engine/BoxInstances';
import { buildLandscape } from '@/components/engine/landscape';
import type { Box } from '@/components/engine/layout';
import { Motion, envRule, jitter, scheduleBoxes, type ProgressSource } from '@/components/engine/schedule';
import { ARCH } from '@/lib/architecture';
import type { Theme } from '@/lib/types';

const GROUND = 1500;
/** Metres covered by one repeat of the terrain texture. */
const TERRAIN_TILE = 14;

/** Raft footprint of each tower in world space — the excavation outline. */
function pits() {
  const fd = ARCH.foundation;
  return ARCH.towers.map((t) => ({
    x: t.position[0],
    z: t.position[2],
    w: t.width + 2 * fd.raftMargin,
    d: t.depth + 2 * fd.raftMargin,
    depth: fd.raftDepth + fd.pileCap * 0.6 + 1.2,
  }));
}

/** Ground plane with a rectangular hole over every pit. */
function useGroundGeometry() {
  return useMemo(() => {
    const h = GROUND / 2;
    const shape = new THREE.Shape([
      new THREE.Vector2(-h, -h),
      new THREE.Vector2(h, -h),
      new THREE.Vector2(h, h),
      new THREE.Vector2(-h, h),
    ]);
    for (const p of pits()) {
      // shape space (x, y) maps to world (x, -z) after the -90° X rotation
      const x0 = p.x - p.w / 2;
      const x1 = p.x + p.w / 2;
      const y0 = -(p.z + p.d / 2);
      const y1 = -(p.z - p.d / 2);
      shape.holes.push(
        new THREE.Path([
          new THREE.Vector2(x0, y0),
          new THREE.Vector2(x0, y1),
          new THREE.Vector2(x1, y1),
          new THREE.Vector2(x1, y0),
        ]),
      );
    }
    const geo = new THREE.ShapeGeometry(shape);
    // ShapeGeometry UVs are in metres; bring them to the texture's real size
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / TERRAIN_TILE, uv.getY(i) / TERRAIN_TILE);
    return geo;
  }, []);
}

function SetoutLines({ source }: { source: ProgressSource }) {
  const mat = useMemo(
    () => new THREE.LineBasicMaterial({ color: '#E0B47A', transparent: true, opacity: 0, depthWrite: false }),
    [],
  );
  const geo = useMemo(() => {
    const pts: number[] = [];
    for (const p of pits()) {
      const x0 = p.x - p.w / 2;
      const x1 = p.x + p.w / 2;
      const z0 = p.z - p.d / 2;
      const z1 = p.z + p.d / 2;
      const y = 0.06;
      // outline + diagonals + 3 m offset profile boards
      pts.push(x0, y, z0, x1, y, z0, x1, y, z0, x1, y, z1, x1, y, z1, x0, y, z1, x0, y, z1, x0, y, z0);
      pts.push(x0, y, z0, x1, y, z1, x1, y, z0, x0, y, z1);
      const o = 3;
      pts.push(x0 - o, y, z0, x0 - 0.5, y, z0, x1 + 0.5, y, z0, x1 + o, y, z0);
      pts.push(x0 - o, y, z1, x0 - 0.5, y, z1, x1 + 0.5, y, z1, x1 + o, y, z1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  useEffect(() => () => {
    mat.dispose();
    geo.dispose();
  }, [mat, geo]);

  const last = useRef(-1);
  useFrame(() => {
    const p = source.progress;
    if (p === last.current) return;
    last.current = p;
    const fadeIn = THREE.MathUtils.smoothstep(p, 0.003, 0.03);
    const fadeOut = 1 - THREE.MathUtils.smoothstep(p, 0.13, 0.19);
    mat.opacity = 0.95 * fadeIn * fadeOut;
  });

  return <lineSegments geometry={geo} material={mat} renderOrder={4} />;
}

/** A broken ring of blocks far outside the site. Deterministic. */
function buildSkyline(): Box[] {
  const out: Box[] = [];
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2 + jitter(i, 7) * 0.05;
    const r = 360 + jitter(i, 8) * 170;
    const h = 14 + jitter(i, 9) * jitter(i, 10) * 74;
    const w = 14 + jitter(i, 11) * 24;
    out.push({ p: [Math.cos(a) * r, h / 2, Math.sin(a) * r], s: [w, h, 14 + jitter(i, 12) * 22], level: 0 });
  }
  return out;
}

export default function ConstructionSite({ theme, source }: { theme: Theme; source: ProgressSource }) {
  const mats = partMaterials(theme).scene;
  const groundGeo = useGroundGeometry();

  const earth = mats.terrain;
  const pitMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#4A3B2C', roughness: 1, side: THREE.BackSide }),
    [],
  );
  useEffect(() => () => {
    groundGeo.dispose();
    pitMat.dispose();
  }, [groundGeo, pitMat]);

  // excavation: a lid over each hole that shrinks away
  const covers = useMemo<Box[]>(
    () => pits().map((p) => ({ p: [p.x, -0.01, p.z], s: [p.w, 0.02, p.d], level: 0 })),
    [],
  );
  const coverAnim = useMemo(() => scheduleBoxes(covers, () => [0.02, 0.04, Motion.Shrink]), [covers]);

  // distant city, dissolved by the fog: gives the horizon something to be
  const skyline = useMemo(buildSkyline, []);
  const skylineMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#39465F', roughness: 0.95 }), []);
  useEffect(() => () => skylineMat.dispose(), [skylineMat]);

  // landscaping
  const land = useMemo(buildLandscape, []);
  const sched = useMemo(
    () => ({
      groundCover: scheduleBoxes(land.groundCover, envRule(Motion.Flat, 0, 0.1)),
      lawns: scheduleBoxes(land.lawns, envRule(Motion.Flat)),
      paving: scheduleBoxes(land.paving, envRule(Motion.Flat)),
      parking: scheduleBoxes(land.parking, envRule(Motion.Flat)),
      marks: scheduleBoxes(land.marks, envRule(Motion.GrowLong, 0.01, 0.02)),
      playSurface: scheduleBoxes(land.playSurface, envRule(Motion.Flat)),
      playFrames: scheduleBoxes(land.playFrames, envRule(Motion.Rise)),
      trunks: scheduleBoxes(land.trunks, envRule(Motion.Rise, 0, 0.02)),
      crowns: scheduleBoxes(land.crowns, envRule(Motion.Scale, 0.012, 0.03)),
      benches: scheduleBoxes(land.benches, envRule(Motion.Scale, 0, 0.015)),
      lampPosts: scheduleBoxes(land.lampPosts, envRule(Motion.Rise, 0, 0.02)),
      lampHeads: scheduleBoxes(land.lampHeads, envRule(Motion.Scale, 0.01, 0.01)),
    }),
    [land],
  );
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.5, 0.5, 1, 8), []);
  useEffect(() => () => trunkGeo.dispose(), [trunkGeo]);

  const a = (k: keyof typeof sched) => ({ anim: sched[k], source });

  return (
    <group name="ConstructionSite">
      <mesh geometry={groundGeo} material={earth} rotation={[-Math.PI / 2, 0, 0]} receiveShadow name="Ground" />

      {pits().map((p, i) => (
        <mesh key={i} position={[p.x, -p.depth / 2, p.z]} material={pitMat} receiveShadow name={`Pit_${i}`}>
          <boxGeometry args={[p.w, p.depth, p.d]} />
        </mesh>
      ))}
      <BoxInstances name="ExcavationCover" boxes={covers} material={earth} anim={coverAnim} source={source} castShadow={false} />
      <SetoutLines source={source} />
      <BoxInstances name="Skyline" boxes={skyline} material={skylineMat} castShadow={false} receiveShadow={false} />

      <group name="Landscape">
        <BoxInstances name="GroundCover" boxes={land.groundCover} material={mats.grassDark} castShadow={false} {...a('groundCover')} />
        <BoxInstances name="Lawns" boxes={land.lawns} material={mats.grass} castShadow={false} {...a('lawns')} />
        <BoxInstances name="Paving" boxes={land.paving} material={mats.plaza} castShadow={false} {...a('paving')} />
        <BoxInstances name="Parking" boxes={land.parking} material={mats.asphalt} castShadow={false} {...a('parking')} />
        <BoxInstances name="ParkingMarks" boxes={land.marks} material={mats.lineMark} castShadow={false} {...a('marks')} />
        <BoxInstances name="PlaySurface" boxes={land.playSurface} material={mats.playSoft} castShadow={false} {...a('playSurface')} />
        <BoxInstances name="PlayFrames" boxes={land.playFrames} material={mats.playFrame} {...a('playFrames')} />
        <BoxInstances name="TreeTrunks" boxes={land.trunks} material={mats.trunk} geometry={trunkGeo} {...a('trunks')} />
        <BoxInstances name="TreeCrowns" boxes={land.crowns} material={mats.foliage} geometry={crossedQuads(3)} {...a('crowns')} />
        <BoxInstances name="Benches" boxes={land.benches} material={mats.bench} {...a('benches')} />
        <BoxInstances name="LampPosts" boxes={land.lampPosts} material={mats.lampPost} {...a('lampPosts')} />
        <BoxInstances name="LampHeads" boxes={land.lampHeads} material={mats.lampGlow} castShadow={false} {...a('lampHeads')} />
      </group>
    </group>
  );
}
