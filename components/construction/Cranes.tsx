'use client';

// ============================================================================
//  One tower crane per building. Its height, slew and dismantling are pure
//  functions of the construction progress, like everything else on the site.
//  The mast telescopes out of the ground rather than scaling, so the lattice
//  keeps its proportions.
// ============================================================================

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import BoxInstances from '@/components/engine/BoxInstances';
import type { Box } from '@/components/engine/layout';
import type { ProgressSource } from '@/components/engine/schedule';
import { ARCH, towerHeight, type TowerSpec } from '@/lib/architecture';
import { MAX_LEVELS, frameAt } from '@/lib/construction';

const MAST = 1.3;
const RING = 2.4;
const CLEARANCE = 8;

function mastBoxes(height: number): Box[] {
  const out: Box[] = [];
  const m = MAST / 2;
  for (const x of [-m, m]) {
    for (const z of [-m, m]) out.push({ p: [x, height / 2, z], s: [0.12, height, 0.12], level: 0 });
  }
  for (let y = RING; y < height; y += RING) {
    out.push({ p: [0, y, -m], s: [MAST, 0.08, 0.08], level: 0 }, { p: [0, y, m], s: [MAST, 0.08, 0.08], level: 0 });
    out.push({ p: [-m, y, 0], s: [0.08, 0.08, MAST], level: 0 }, { p: [m, y, 0], s: [0.08, 0.08, MAST], level: 0 });
  }
  return out;
}

function jibBoxes(length: number): Box[] {
  const out: Box[] = [
    { p: [length / 2, 0.75, -0.42], s: [length, 0.1, 0.1], level: 0 },
    { p: [length / 2, 0.75, 0.42], s: [length, 0.1, 0.1], level: 0 },
    { p: [length / 2, 1.55, 0], s: [length, 0.1, 0.1], level: 0 },
    { p: [-4.5, 0.75, 0], s: [9, 0.28, 1.1], level: 0 }, // counter-jib
    { p: [-8.2, 0.35, 0], s: [2.2, 1.5, 1.3], level: 0 }, // counterweight
    { p: [0, 2.6, 0], s: [0.5, 5, 0.5], level: 0 }, // tower head
    { p: [0.9, -0.2, 0.9], s: [1.2, 1.5, 1], level: 0 }, // cab
  ];
  for (let x = 1.4; x < length; x += 1.4) out.push({ p: [x, 1.15, 0], s: [0.07, 0.8, 0.84], level: 0 });
  return out;
}

function Crane({ spec, source, material }: { spec: TowerSpec; source: ProgressSource; material: THREE.Material }) {
  const isA = spec.id === 'A';
  const fullH = towerHeight(spec) + ARCH.roof.parapetHeight + CLEARANCE;
  const jibLength = isA ? 26 : 30;
  const x = spec.position[0] + (isA ? -1 : 1) * (spec.width / 2 + 4.5);
  const z = spec.position[2] - 2;

  const mast = useMemo(() => mastBoxes(fullH), [fullH]);
  const jib = useMemo(() => jibBoxes(jibLength), [jibLength]);

  const root = useRef<THREE.Group>(null);
  const mastRef = useRef<THREE.Group>(null);
  const jibRef = useRef<THREE.Group>(null);
  const hookRef = useRef<THREE.Group>(null);
  const last = useRef(-1);

  useFrame(() => {
    const p = source.progress;
    if (p === last.current || !root.current || !mastRef.current || !jibRef.current || !hookRef.current) return;
    last.current = p;

    const up = THREE.MathUtils.smoothstep(p, 0.11, 0.17);
    const down = 1 - THREE.MathUtils.smoothstep(p, 0.76, 0.83);
    const present = up * down;
    root.current.visible = present > 0.002;
    if (!root.current.visible) return;

    // climbs with its tower, always a few metres above the working storey
    const topFrame = frameAt(Math.min(MAX_LEVELS, spec.floors) + 1);
    const climb = THREE.MathUtils.clamp((p - frameAt(1)) / (topFrame - frameAt(1)), 0, 1);
    const h = THREE.MathUtils.lerp(14, fullH, climb) * present;

    mastRef.current.position.y = h - fullH;
    jibRef.current.position.y = h;
    jibRef.current.scale.setScalar(Math.max(0.001, present));
    jibRef.current.rotation.y = (isA ? 0.9 : 2.4) + p * 11 + Math.sin(p * 37) * 0.45;
    hookRef.current.position.x = jibLength * (0.45 + 0.35 * Math.sin(p * 53));
    hookRef.current.scale.y = 0.6 + 0.4 * Math.abs(Math.sin(p * 71));
  });

  return (
    <group ref={root} position={[x, 0, z]} name={`Crane_${spec.id}`} visible={false}>
      <group ref={mastRef}>
        <BoxInstances name={`CraneMast_${spec.id}`} boxes={mast} material={material} receiveShadow={false} />
      </group>
      <group ref={jibRef}>
        <BoxInstances name={`CraneJib_${spec.id}`} boxes={jib} material={material} receiveShadow={false} />
        <group ref={hookRef}>
          <mesh position={[0, -5, 0]} material={material}>
            <boxGeometry args={[0.05, 10, 0.05]} />
          </mesh>
          <mesh position={[0, -10.2, 0]} material={material}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default function Cranes({ source }: { source: ProgressSource }) {
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#D9A521', roughness: 0.55, metalness: 0.2 }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <group name="Cranes">
      {ARCH.towers.map((t) => (
        <Crane key={t.id} spec={t} source={source} material={material} />
      ))}
    </group>
  );
}
