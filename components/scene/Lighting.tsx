'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { PALETTE } from '@/lib/palette';
import { useApp } from '@/lib/store';

/**
 * Key light matched to the sky dome's sun vector, plus a sky/ground
 * hemisphere fill and a cool rim so north-facing walls never go flat black.
 * The shadow frustum is sized to the whole site so nothing clips out of it.
 */
export default function Lighting() {
  const theme = useApp((s) => s.theme);
  const p = PALETTE[theme];

  const sun = useMemo(() => new THREE.Vector3(...p.sun), [p.sun]);

  return (
    <>
      <ambientLight intensity={p.ambient} />
      <hemisphereLight args={[p.skyColor, p.groundBounce, p.hemiIntensity]} />

      <directionalLight
        castShadow
        position={sun}
        intensity={p.sunIntensity}
        color={p.sunColor}
        shadow-mapSize={[3072, 3072]}
        shadow-bias={-0.00018}
        shadow-normalBias={0.02}
        shadow-camera-near={1}
        shadow-camera-far={300}
        shadow-camera-left={-58}
        shadow-camera-right={58}
        shadow-camera-top={64}
        shadow-camera-bottom={-58}
      />

      <directionalLight
        position={[-50, 26, -44]}
        intensity={p.sunIntensity * 0.16}
        color={p.skyColor}
      />
    </>
  );
}
