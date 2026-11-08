'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import * as THREE from 'three';
import Experience from './Experience';

export default function SceneCanvas() {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.02,
      }}
      camera={{ position: [-10, 8, 196], fov: 34, near: 0.5, far: 1200 }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Suspense fallback={null}>
        <Experience />
      </Suspense>
    </Canvas>
  );
}
