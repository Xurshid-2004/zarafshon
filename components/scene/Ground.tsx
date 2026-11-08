'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { TL } from '@/lib/buildingConfig';
import { introTimeline } from '@/lib/introTimeline';
import { useApp } from '@/lib/store';
import { bevelBox, getMaterials, uvPlane } from './materials';
import { LAWNS, PARKING, PAVING, PLAYGROUND, type Patch } from './siteLayout';

/** World size, in metres, that one texture tile covers. */
const TILE = { grass: 4.5, plaza: 2.6, asphalt: 7, terrain: 14 };

/** A flat pad that expands into place during the environment phase. */
function GrowPad({
  patch,
  material,
  y,
  tile,
  receive = true,
}: {
  patch: Patch;
  material: THREE.Material;
  y: number;
  tile: number;
  receive?: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    m.scale.set(0.02, 0.02, 1);
    introTimeline().to(
      m.scale,
      { x: 1, y: 1, duration: 0.6, ease: 'power3.out' },
      TL.environmentStart + patch.delay,
    );
  }, [patch.delay]);

  return (
    <mesh
      ref={ref}
      geometry={uvPlane(patch.w, patch.d, tile)}
      material={material}
      position={[patch.x, y, patch.z]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow={receive}
    />
  );
}

/** Raised concrete kerb around a pad — a strong real-world cue at ground level. */
function Kerb({
  x,
  z,
  w,
  d,
  delay,
  material,
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  delay: number;
  material: THREE.Material;
}) {
  const ref = useRef<THREE.Group>(null);
  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    g.scale.set(0.02, 1, 0.02);
    introTimeline().to(
      g.scale,
      { x: 1, z: 1, duration: 0.45, ease: 'power3.out' },
      TL.environmentStart + delay,
    );
  }, [delay]);

  const H = 0.17;
  const T = 0.3;
  return (
    <group ref={ref} position={[x, H / 2, z]}>
      <mesh geometry={bevelBox(w + T * 2, H, T, 0.025)} material={material} position={[0, 0, d / 2 + T / 2]} receiveShadow castShadow />
      <mesh geometry={bevelBox(w + T * 2, H, T, 0.025)} material={material} position={[0, 0, -d / 2 - T / 2]} receiveShadow castShadow />
      <mesh geometry={bevelBox(T, H, d, 0.025)} material={material} position={[w / 2 + T / 2, 0, 0]} receiveShadow castShadow />
      <mesh geometry={bevelBox(T, H, d, 0.025)} material={material} position={[-w / 2 - T / 2, 0, 0]} receiveShadow castShadow />
    </group>
  );
}

/** Painted bay dividers that "draw out" one after another. */
function ParkingMarks({ lot, material }: { lot: (typeof PARKING)[number]; material: THREE.Material }) {
  const group = useRef<THREE.Group>(null);

  const marks = useMemo(() => {
    const out: { pos: [number, number, number]; size: [number, number] }[] = [];
    const along = lot.axis === 'z' ? lot.d : lot.w;
    const across = lot.axis === 'z' ? lot.w : lot.d;
    const step = along / lot.slots;
    const start = -along / 2;
    for (let i = 0; i <= lot.slots; i++) {
      const o = start + i * step;
      out.push(
        lot.axis === 'z'
          ? { pos: [0, 0, o], size: [across * 0.86, 0.13] }
          : { pos: [o, 0, 0], size: [0.13, across * 0.86] },
      );
    }
    return out;
  }, [lot]);

  useEffect(() => {
    const g = group.current;
    if (!g) return;
    g.children.forEach((c, i) => {
      c.scale.set(0.01, 0.01, 0.01);
      introTimeline().to(
        c.scale,
        { x: 1, y: 1, z: 1, duration: 0.3, ease: 'power2.out' },
        TL.environmentStart + lot.delay + i * 0.022,
      );
    });
  }, [lot.delay, marks.length]);

  return (
    <group ref={group} position={[lot.x, 0.072, lot.z]}>
      {marks.map((m, i) => (
        <mesh key={i} position={m.pos} rotation={[-Math.PI / 2, 0, 0]} material={material}>
          <planeGeometry args={[m.size[0], m.size[1]]} />
        </mesh>
      ))}
    </group>
  );
}

export default function Ground() {
  const theme = useApp((s) => s.theme);
  const mats = getMaterials(theme);

  return (
    <group name="Site_Ground">
      {/* bare terrain, present from the first frame; large enough that the
          edge dissolves into fog rather than ending in mid-air */}
      <mesh
        name="Site_Terrain"
        geometry={uvPlane(600, 600, TILE.terrain)}
        material={mats.grassDark}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      />

      {LAWNS.map((patch, i) => (
        <GrowPad
          key={`lawn-${i}`}
          patch={patch}
          y={0.035}
          tile={TILE.grass}
          material={i % 2 === 0 ? mats.grass : mats.grassDark}
        />
      ))}

      {PAVING.map((patch, i) => (
        <GrowPad key={`pave-${i}`} patch={patch} y={0.065} tile={TILE.plaza} material={mats.plaza} />
      ))}

      {PARKING.map((lot, i) => (
        <group key={`lot-${i}`}>
          <GrowPad
            patch={{ x: lot.x, z: lot.z, w: lot.w, d: lot.d, delay: lot.delay - 0.06 }}
            y={0.05}
            tile={TILE.asphalt}
            material={mats.asphalt}
          />
          <Kerb x={lot.x} z={lot.z} w={lot.w} d={lot.d} delay={lot.delay - 0.04} material={mats.curb} />
          <ParkingMarks lot={lot} material={mats.lineMark} />
        </group>
      ))}

      <Kerb
        x={PLAYGROUND.x}
        z={PLAYGROUND.z}
        w={PLAYGROUND.w}
        d={PLAYGROUND.d}
        delay={0.28}
        material={mats.curb}
      />
    </group>
  );
}
