'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { TL } from '@/lib/buildingConfig';
import { introTimeline } from '@/lib/introTimeline';
import { PALETTE } from '@/lib/palette';
import { seeded } from '@/lib/rng';
import { useApp } from '@/lib/store';
import Instanced, { type InstanceItem } from './Instanced';
import {
  bevelBox,
  carBodyGeometry,
  crossedQuads,
  cyl,
  getMaterials,
  hubGeometry,
  taperedCyl,
  tyreGeometry,

} from './materials';
import { BENCHES, LAMPS, PARKING, PLAYGROUND, TREES } from './siteLayout';

/** Planting is authored at nursery scale; these trim it to the building grid. */
const TREE_H = 0.78;
const TREE_R = 1.05;

function amenityHandlers(id: 'playground' | 'parking' | 'green') {
  return {
    onPointerOver: () => {
      const s = useApp.getState();
      if (s.phase !== 'ready') return;
      s.setHoveredAmenity(id);
    },
    onPointerOut: () => {
      const s = useApp.getState();
      if (s.hoveredAmenity === id) s.setHoveredAmenity(null);
    },
  };
}

function Playground() {
  const theme = useApp((s) => s.theme);
  const mats = getMaterials(theme);
  const ref = useRef<THREE.Group>(null);
  const { x, z, w, d } = PLAYGROUND;

  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    g.scale.set(0.02, 0.02, 0.02);
    introTimeline().to(
      g.scale,
      { x: 1, y: 1, z: 1, duration: 0.5, ease: 'back.out(1.6)' },
      TL.environmentStart + 0.3,
    );
  }, []);

  return (
    <group name="Playground" position={[x, 0, z]} {...amenityHandlers('playground')}>
      <mesh
        geometry={bevelBox(w, 0.1, d, 0.03)}
        material={mats.playSoft}
        position={[0, 0.1, 0]}
        receiveShadow
      />
      <mesh
        geometry={bevelBox(5.2, 0.14, 4.2, 0.04)}
        material={mats.sand}
        position={[5.4, 0.13, 3.6]}
        receiveShadow
      />

      <group ref={ref}>
        {/* swing set */}
        <group position={[-5.6, 0, 0]}>
          {[
            [-1.7, -1.1],
            [-1.7, 1.1],
            [1.7, -1.1],
            [1.7, 1.1],
          ].map(([px, pz], i) => (
            <mesh
              key={i}
              geometry={taperedCyl(0.85, 10)}
              material={mats.playFrame}
              scale={[0.16, 2.6, 0.16]}
              position={[px, 1.3, pz]}
              castShadow
            />
          ))}
          <mesh
            geometry={bevelBox(3.8, 0.16, 0.16, 0.03)}
            material={mats.playFrame}
            position={[0, 2.6, 0]}
            castShadow
          />
          {[-1.0, 1.0].map((sx) => (
            <group key={sx}>
              <mesh geometry={cyl(6)} material={mats.railCap} scale={[0.035, 1.6, 0.035]} position={[sx - 0.22, 1.8, 0]} />
              <mesh geometry={cyl(6)} material={mats.railCap} scale={[0.035, 1.6, 0.035]} position={[sx + 0.22, 1.8, 0]} />
              <mesh
                geometry={bevelBox(0.62, 0.08, 0.3, 0.025)}
                material={mats.playAccent}
                position={[sx, 1.0, 0]}
                castShadow
              />
            </group>
          ))}
        </group>

        {/* slide tower */}
        <group position={[1.2, 0, -2.6]}>
          <mesh geometry={bevelBox(1.9, 0.14, 1.9, 0.03)} material={mats.playAccent} position={[0, 1.75, 0]} castShadow />
          {[
            [-0.85, -0.85],
            [0.85, -0.85],
            [-0.85, 0.85],
            [0.85, 0.85],
          ].map(([px, pz], i) => (
            <mesh key={i} geometry={cyl(10)} material={mats.playFrame} scale={[0.14, 1.75, 0.14]} position={[px, 0.88, pz]} castShadow />
          ))}
          <mesh
            geometry={bevelBox(1.4, 0.08, 3.6, 0.03)}
            material={mats.railCap}
            position={[0, 1.0, 2.3]}
            rotation={[-0.42, 0, 0]}
            castShadow
          />
          {[0.45, 0.9, 1.35].map((h, i) => (
            <mesh key={i} geometry={bevelBox(1.2, 0.08, 0.14, 0.02)} material={mats.playFrame} position={[0, h, -1.3 - i * 0.16]} />
          ))}
          <mesh geometry={cyl(8)} material={mats.playFrame} scale={[0.1, 1.1, 0.1]} position={[-0.6, 2.3, -1.05]} />
          <mesh geometry={cyl(8)} material={mats.playFrame} scale={[0.1, 1.1, 0.1]} position={[0.6, 2.3, -1.05]} />
        </group>

        {/* spring riders */}
        {[
          [-1.4, 3.8],
          [0.6, 4.4],
        ].map(([px, pz], i) => (
          <group key={i} position={[px, 0, pz]}>
            <mesh geometry={cyl(8)} material={mats.playFrame} scale={[0.12, 0.6, 0.12]} position={[0, 0.4, 0]} />
            <mesh
              geometry={bevelBox(1.05, 0.55, 0.75, 0.2)}
              material={mats.playAccent}
              position={[0, 0.9, 0]}
              castShadow
            />
          </group>
        ))}

        {/* climbing frame */}
        <group position={[7.2, 0, -3.2]}>
          {[-1.1, 1.1].map((px) =>
            [-1.1, 1.1].map((pz) => (
              <mesh key={`${px}-${pz}`} geometry={cyl(10)} material={mats.playFrame} scale={[0.13, 2.2, 0.13]} position={[px, 1.1, pz]} castShadow />
            )),
          )}
          {[0.7, 1.4, 2.1].map((h) => (
            <group key={h}>
              <mesh geometry={cyl(6)} material={mats.railCap} scale={[0.06, 2.3, 0.06]} rotation={[0, 0, Math.PI / 2]} position={[0, h, -1.1]} />
              <mesh geometry={cyl(6)} material={mats.railCap} scale={[0.06, 2.3, 0.06]} rotation={[0, 0, Math.PI / 2]} position={[0, h, 1.1]} />
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

export default function Environs() {
  const theme = useApp((s) => s.theme);
  const mats = getMaterials(theme);
  const pal = PALETTE[theme];

  // --- trees: tapered trunk + crossed-plane canopy -------------------------
  const trunks = useMemo<InstanceItem[]>(
    () =>
      TREES.map((t, i) => ({
        position: [t.x, (t.h * TREE_H) / 2, t.z],
        scale: [0.32, t.h * TREE_H, 0.32],
        rotation: [0, i * 1.1, 0],
        delay: 0.04 + i * 0.012,
        from: 'base',
      })),
    [],
  );

  const canopies = useMemo<InstanceItem[]>(
    () =>
      TREES.map((t, i) => {
        const r = t.r * TREE_R;
        return {
          position: [t.x, t.h * TREE_H + r * 0.74, t.z],
          scale: [r * 2.5, r * 2.7, r * 2.5],
          rotation: [0, (i * 0.9) % Math.PI, 0],
          delay: 0.1 + i * 0.012,
          from: 'center' as const,
        };
      }),
    [],
  );

  /** Low planting along the plaza edges so the ground does not read as bare. */
  const shrubs = useMemo<InstanceItem[]>(() => {
    const rnd = seeded('shrubs-v1');
    const out: InstanceItem[] = [];
    const lines: [number, number, number, number][] = [
      [-6.4, -9, -6.4, 9],
      [6.4, -9, 6.4, 9],
      [-27, 14, -16, 14],
      [18, 14, 29, 14],
      [-12, 25, -4, 25],
      [4, 25, 12, 25],
    ];
    lines.forEach(([x1, z1, x2, z2], li) => {
      const n = 7;
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        const s = 0.9 + rnd() * 0.7;
        out.push({
          position: [x1 + (x2 - x1) * t + (rnd() - 0.5) * 0.7, s * 0.5, z1 + (z2 - z1) * t + (rnd() - 0.5) * 0.7],
          scale: [s * 1.5, s, s * 1.5],
          rotation: [0, rnd() * Math.PI, 0],
          delay: 0.14 + li * 0.03 + i * 0.008,
          from: 'center',
        });
      }
    });
    return out;
  }, []);

  // --- street furniture ----------------------------------------------------
  const lampPosts = useMemo<InstanceItem[]>(
    () =>
      LAMPS.map((l, i) => ({
        position: [l.x, 2.1, l.z],
        scale: [0.17, 4.2, 0.17],
        delay: 0.3 + i * 0.018,
        from: 'base' as const,
      })),
    [],
  );

  const lampHeads = useMemo<InstanceItem[]>(
    () =>
      LAMPS.map((l, i) => ({
        position: [l.x, 4.28, l.z],
        scale: [0.46, 0.16, 0.46],
        delay: 0.34 + i * 0.018,
        from: 'center' as const,
      })),
    [],
  );

  const benchSeats = useMemo<InstanceItem[]>(
    () =>
      BENCHES.map((b, i) => ({
        position: [b.x, 0.45, b.z],
        scale: [1.9, 0.1, 0.55],
        rotation: [0, b.ry, 0],
        delay: 0.2 + i * 0.015,
        from: 'center' as const,
      })),
    [],
  );

  const benchBacks = useMemo<InstanceItem[]>(
    () =>
      BENCHES.map((b, i) => {
        const dx = Math.sin(b.ry) * 0.26;
        const dz = Math.cos(b.ry) * 0.26;
        return {
          position: [b.x - dx, 0.78, b.z - dz],
          scale: [1.9, 0.5, 0.08],
          rotation: [0, b.ry, 0],
          delay: 0.22 + i * 0.015,
          from: 'center' as const,
        };
      }),
    [],
  );

  const benchLegs = useMemo<InstanceItem[]>(() => {
    const out: InstanceItem[] = [];
    BENCHES.forEach((b, i) => {
      [-0.72, 0.72].forEach((o) => {
        out.push({
          position: [b.x + Math.cos(b.ry) * o, 0.2, b.z - Math.sin(b.ry) * o],
          scale: [0.09, 0.4, 0.45],
          rotation: [0, b.ry, 0],
          delay: 0.2 + i * 0.015,
          from: 'base',
        });
      });
    });
    return out;
  }, []);

  // --- parked cars ---------------------------------------------------------
  const cars = useMemo(() => {
    const bodies: InstanceItem[] = [];
    const glazing: InstanceItem[] = [];
    const tyres: InstanceItem[] = [];
    const hubs: InstanceItem[] = [];
    const rnd = seeded('parking-occupancy-v2');

    PARKING.forEach((lot, li) => {
      const along = lot.axis === 'z' ? lot.d : lot.w;
      const step = along / lot.slots;
      for (let i = 0; i < lot.slots; i++) {
        if (rnd() > 0.62) continue;
        const o = -along / 2 + step * (i + 0.5);
        const cx = lot.axis === 'z' ? lot.x : lot.x + o;
        const cz = lot.axis === 'z' ? lot.z + o : lot.z;
        // slots along z are entered from the side, so the car length runs across
        const ry = lot.axis === 'z' ? Math.PI / 2 : 0;
        const color = pal.carBody[Math.floor(rnd() * pal.carBody.length) % pal.carBody.length];
        const delay = 0.62 + li * 0.05 + i * 0.016;

        bodies.push({ position: [cx, 0, cz], scale: [1, 1, 1], rotation: [0, ry, 0], color, delay, from: 'pivot' });
        glazing.push({
          position: [cx - Math.cos(ry) * 0.5, 1.02, cz + Math.sin(ry) * 0.5],
          scale: [1.72, 0.38, 1.68],
          rotation: [0, ry, 0],
          delay: delay + 0.02,
          from: 'center',
        });

        [
          [1.38, 0.84],
          [1.38, -0.84],
          [-1.38, 0.84],
          [-1.38, -0.84],
        ].forEach(([ax, az]) => {
          const wx = cx + Math.cos(ry) * ax + Math.sin(ry) * az;
          const wz = cz - Math.sin(ry) * ax + Math.cos(ry) * az;
          tyres.push({ position: [wx, 0.33, wz], scale: [1, 1, 1], rotation: [0, ry, 0], delay: delay + 0.02, from: 'pivot' });
          hubs.push({ position: [wx, 0.33, wz], scale: [1.02, 1.02, 1.04], rotation: [0, ry, 0], delay: delay + 0.03, from: 'pivot' });
        });
      }
    });

    return { bodies, glazing, tyres, hubs };
  }, [pal.carBody]);

  return (
    <group name="Environs">
      <Instanced name="Tree_Trunks" geometry={taperedCyl(0.6, 10)} material={mats.trunk} items={trunks} />
      <Instanced name="Tree_Canopies" geometry={crossedQuads(3)} material={mats.foliage} items={canopies} />
      <Instanced name="Shrubs" geometry={crossedQuads(2)} material={mats.foliage} items={shrubs} />

      <Instanced name="Lamp_Posts" geometry={taperedCyl(0.7, 10)} material={mats.lampPost} items={lampPosts} />
      <Instanced
        name="Lamp_Heads"
        geometry={bevelBox(1, 1, 1, 0.18)}
        material={mats.lampGlow}
        items={lampHeads}
        castShadow={false}
      />

      <Instanced name="Bench_Seats" geometry={bevelBox(1, 1, 1, 0.09)} material={mats.bench} items={benchSeats} />
      <Instanced name="Bench_Backs" geometry={bevelBox(1, 1, 1, 0.09)} material={mats.bench} items={benchBacks} />
      <Instanced name="Bench_Legs" geometry={bevelBox(1, 1, 1, 0.12)} material={mats.railCap} items={benchLegs} />

      <group name="Parked_Cars" {...amenityHandlers('parking')}>
        <Instanced name="Car_Bodies" geometry={carBodyGeometry()} material={mats.carPaint} items={cars.bodies} />
        <Instanced
          name="Car_Glazing"
          geometry={bevelBox(1, 1, 1, 0.12)}
          material={mats.carGlass}
          items={cars.glazing}
          castShadow={false}
        />
        <Instanced name="Car_Tyres" geometry={tyreGeometry()} material={mats.tyre} items={cars.tyres} castShadow={false} />
        <Instanced name="Car_Hubs" geometry={hubGeometry()} material={mats.wheel} items={cars.hubs} castShadow={false} />
      </group>

      <Playground />

      <mesh
        name="Green_Zone_Hotspot"
        position={[-30, 0.3, 28]}
        rotation={[-Math.PI / 2, 0, 0]}
        {...amenityHandlers('green')}
      >
        <planeGeometry args={[22, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
