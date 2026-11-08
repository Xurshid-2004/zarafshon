'use client';

import hdriNight from '@pmndrs/assets/hdri/night.exr';
import hdriSunset from '@pmndrs/assets/hdri/sunset.exr';
import {
  AdaptiveDpr,
  Environment,
  OrbitControls,
  PerformanceMonitor,
  Preload,
} from '@react-three/drei';
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  Noise,
  SMAA,
  SSAO,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { BUILDINGS } from '@/lib/buildingConfig';
import { disposeIntroTimeline } from '@/lib/introTimeline';
import { PALETTE } from '@/lib/palette';
import { useApp } from '@/lib/store';
import Building from './Building';
import CameraRig from './CameraRig';
import Environs from './Environs';
import Foundation from './Foundation';
import Ground from './Ground';
import HoverLabel from './HoverLabel';
import Lighting from './Lighting';
import SkyDome from './SkyDome';

export default function Experience() {
  const theme = useApp((s) => s.theme);
  const phase = useApp((s) => s.phase);
  const quality = useApp((s) => s.quality);
  const setQuality = useApp((s) => s.setQuality);
  const p = PALETTE[theme];

  const sun = useMemo(() => new THREE.Vector3(...p.sun), [p.sun]);

  useEffect(() => () => disposeIntroTimeline(), []);

  const onMissed = () => {
    const s = useApp.getState();
    if (s.phase !== 'ready') return;
    if (s.selectedApartment) s.clearApartment();
    else if (s.selectedFloor !== null) s.clearFloor();
  };

  return (
    <group onPointerMissed={onMissed}>
      <fog attach="fog" args={[p.fogColor, p.fogNear, p.fogFar]} />

      {/* procedural sky dome — background and the source of all bounce light */}
      <SkyDome />

      {/*
        Image-based lighting captured from a small copy of the same sky, so the
        glass, the car paint and the metal reflect the actual sky above them.
        No HDR file is downloaded.
      */}
      {/*
        Image-based lighting from a real captured HDRI rather than from the
        procedural dome. A gradient dome gives the glass a gradient to mirror,
        which is exactly what made the facade read as plastic: real glazing is
        convincing because of what is *in* the reflection — cloud edges, a
        horizon line, the bright patch around the sun.
        The file ships inside the bundle as a base64 EXR, so nothing is
        fetched at runtime.
      */}
      <Environment
        files={theme === 'dark' ? hdriNight : hdriSunset}
        background={false}
        environmentIntensity={theme === 'dark' ? 0.55 : 1.15}
      />


      <Lighting />
      <Ground />
      <Foundation />

      {BUILDINGS.map((b) => (
        <Building key={b.id} data={b} />
      ))}

      <Environs />
      <HoverLabel />
      <CameraRig />

      <OrbitControls
        makeDefault
        enabled={phase === 'ready'}
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.75}
        zoomSpeed={0.85}
        panSpeed={0.7}
        minDistance={16}
        maxDistance={210}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 - 0.045}
        screenSpacePanning={false}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.PAN,
          RIGHT: THREE.MOUSE.PAN,
        }}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />

      {/* drop the expensive passes automatically on weak hardware */}
      <PerformanceMonitor
        onDecline={() => setQuality('low')}
        onIncline={() => setQuality('high')}
        flipflops={3}
      />

      <EffectComposer multisampling={0} enableNormalPass>
        <SSAO
          samples={quality === 'high' ? 26 : 11}
          rings={7}
          radius={0.075}
          intensity={4.5}
          bias={0.09}
          luminanceInfluence={0.75}
          distanceThreshold={0.92}
          distanceFalloff={0.06}
          rangeThreshold={0.0012}
          rangeFalloff={0.0025}
          worldDistanceThreshold={40}
          worldDistanceFalloff={12}
          worldProximityThreshold={1.6}
          worldProximityFalloff={0.8}
          color={theme === 'dark' ? '#0C1018' : '#2B2419'}
        />
        <Bloom
          luminanceThreshold={theme === 'dark' ? 0.62 : 0.86}
          luminanceSmoothing={0.3}
          intensity={theme === 'dark' ? 0.85 : 0.42}
          mipmapBlur
        />

        {/*
          The grade. A raster render is flat by default: everything is lit
          correctly and nothing is emphasised. These four passes do what a
          colourist does to footage — lift saturation, pull contrast, darken
          the corners, and put a trace of grain over the whole frame so the
          gradients stop banding and the image stops reading as CG.
        */}
        <HueSaturation saturation={theme === 'dark' ? 0.08 : 0.07} hue={0} />
        <BrightnessContrast brightness={-0.015} contrast={0.12} />
        <Vignette eskil={false} offset={0.3} darkness={0.5} />
        <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.03} />

        <SMAA />
      </EffectComposer>

      <AdaptiveDpr pixelated />
      <Preload all />
    </group>
  );
}
