'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BUILDINGS, TL } from '@/lib/buildingConfig';
import { introTimeline } from '@/lib/introTimeline';
import { PALETTE } from '@/lib/palette';
import { useApp } from '@/lib/store';

/**
 * Phase 0.0 s – 1.0 s: bare terrain with a survey grid and glowing wireframe
 * guides previewing the final building envelopes; all of it fades out as the
 * structure starts to rise.
 *
 * Opacity is read from the shared timeline's clock every frame rather than
 * tweened. A tween captures the material instance it was created with, so if
 * React ever rebuilds the helper the tween would keep animating an orphan and
 * the grid would stay on screen forever. Sampling the clock cannot drift.
 */
export default function Foundation() {
  const theme = useApp((s) => s.theme);
  const p = PALETTE[theme];

  const gridRef = useRef<THREE.GridHelper>(null);
  const guideRef = useRef<THREE.Group>(null);

  const gridArgs = useMemo(
    () => [150, 75, p.gridLine, p.gridLine] as [number, number, string, string],
    [p.gridLine],
  );

  const guides = useMemo(
    () =>
      BUILDINGS.map((b) => ({
        id: b.id,
        edges: new THREE.EdgesGeometry(new THREE.BoxGeometry(b.width, b.height, b.depth)),
        pit: new THREE.EdgesGeometry(new THREE.BoxGeometry(b.width + 2.4, 1.6, b.depth + 2.4)),
        position: b.position,
        height: b.height,
      })),
    [],
  );

  useEffect(
    () => () => {
      guides.forEach((g) => {
        g.edges.dispose();
        g.pit.dispose();
      });
    },
    [guides],
  );

  useFrame(() => {
    const t = introTimeline().totalTime();

    // ramp in over the first 0.45 s, hold, then fade out between 1.0 s and 1.7 s
    const rampIn = THREE.MathUtils.clamp((t - TL.foundationIn) / 0.45, 0, 1);
    const fadeOut = 1 - THREE.MathUtils.clamp((t - TL.foundationOut) / 0.7, 0, 1);
    const a = rampIn * fadeOut;

    const grid = gridRef.current;
    if (grid) {
      const gm = grid.material as THREE.LineBasicMaterial;
      gm.transparent = true;
      gm.opacity = a * 0.55;
      grid.visible = a > 0.001;
    }

    const group = guideRef.current;
    if (group) {
      group.visible = a > 0.001;
      if (group.visible) {
        group.traverse((o) => {
          const line = o as THREE.LineSegments;
          if (line.isLineSegments) {
            (line.material as THREE.LineBasicMaterial).opacity = a * 0.85;
          }
        });
      }
    }
  });

  return (
    <group name="Foundation_Guides">
      <gridHelper ref={gridRef} args={gridArgs} position={[0, 0.04, 0]} visible={false} />

      <group ref={guideRef} visible={false}>
        {guides.map((g) => (
          <group key={g.id} position={[g.position[0], 0, g.position[2]]}>
            <lineSegments geometry={g.edges} position={[0, g.height / 2, 0]}>
              <lineBasicMaterial color={p.guide} transparent opacity={0} />
            </lineSegments>
            <lineSegments geometry={g.pit} position={[0, -0.8, 0]}>
              <lineBasicMaterial color={p.gridLine} transparent opacity={0} />
            </lineSegments>
          </group>
        ))}
      </group>
    </group>
  );
}
