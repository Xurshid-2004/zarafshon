'use client';

import hdriNight from '@pmndrs/assets/hdri/night.exr';
import { Environment } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  SMAA,
  SSAO,
  Vignette,
} from '@react-three/postprocessing';
import gsap from 'gsap';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import Tower from '@/components/engine/Tower';
import SkyDome from '@/components/scene/SkyDome';
import { ARCH } from '@/lib/architecture';
import { BUILDING_BY_ID } from '@/lib/buildingConfig';
import { constructionState } from '@/lib/construction';
import { PALETTE } from '@/lib/palette';
import ConstructionCamera from './ConstructionCamera';
import ConstructionSite from './ConstructionSite';
import Cranes from './Cranes';

/** Dusk: deep blue sky, orange horizon, lit interiors. */
const THEME = 'dark' as const;
const PAL = {
  ...PALETTE[THEME],
  skyZenith: '#14264C',
  skyHorizon: '#6E6484',
  skyGround: '#141A28',
  sunDisc: '#2A2230',
  cloudAmount: 0.18,
  fogColor: '#2A3550',
  fogNear: 150,
  fogFar: 620,
  sun: [70, 36, 72] as [number, number, number],
  sunColor: '#FFCFA0',
  sunIntensity: 1.5,
  skyColor: '#6C86B8',
  groundBounce: '#3A3226',
  hemiIntensity: 1.25,
  ambient: 0.32,
};

export type Tier = 'high' | 'low';

/**
 * The canvas renders on demand. A frame is requested only when the progress
 * moved or the pointer moved over the section, so an idle page, or a visitor
 * reading the sections below, costs no GPU time at all.
 */
function RenderOnChange() {
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    let last = -1;
    const tick = () => {
      if (constructionState.progress === last) return;
      last = constructionState.progress;
      invalidate();
    };
    gsap.ticker.add(tick);

    const onPointer = () => {
      if (gl.domElement.getBoundingClientRect().bottom > 0) invalidate();
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('pointermove', onPointer);
    };
  }, [invalidate, gl]);

  return null;
}

/** Shadows are redrawn only when something on the site actually moved. */
function ShadowOnChange() {
  const gl = useThree((s) => s.gl);
  const last = useRef(-1);
  const warmup = useRef(4);

  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl]);

  useFrame(() => {
    const p = constructionState.progress;
    if (p !== last.current || warmup.current > 0) {
      last.current = p;
      warmup.current = Math.max(0, warmup.current - 1);
      gl.shadowMap.needsUpdate = true;
    }
  });
  return null;
}

/** Drops to the low tier if frames stay slow while the building is moving. */
function AdaptiveTier({ onSlow }: { onSlow: () => void }) {
  const samples = useRef<number[]>([]);
  const last = useRef(-1);
  useFrame((_, dt) => {
    const p = constructionState.progress;
    const moving = p !== last.current;
    last.current = p;
    if (!moving || dt > 0.5) return;
    samples.current.push(dt);
    if (samples.current.length < 45) return;
    const sorted = [...samples.current].sort((a, b) => a - b);
    samples.current = [];
    if (sorted[Math.floor(sorted.length / 2)] > 1 / 26) onSlow();
  });
  return null;
}

function Effects({ tier }: { tier: Tier }) {
  if (tier === 'low') return null;
  return (
    <EffectComposer multisampling={0} enableNormalPass>
      <SSAO
        samples={16}
        rings={7}
        radius={0.075}
        intensity={3.6}
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
        color="#0C1018"
      />
      <Bloom luminanceThreshold={0.62} luminanceSmoothing={0.3} intensity={0.85} mipmapBlur />
      <HueSaturation saturation={0.14} hue={0} />
      <BrightnessContrast brightness={-0.015} contrast={0.12} />
      <Vignette eskil={false} offset={0.3} darkness={0.42} />
      <SMAA />
    </EffectComposer>
  );
}

function Scene({
  reducedMotion,
  tier,
  onSlow,
}: {
  reducedMotion: boolean;
  tier: Tier;
  onSlow?: () => void;
}) {
  const sun = useMemo(() => new THREE.Vector3(...PAL.sun), []);
  const mapSize = tier === 'high' ? 2048 : 1024;

  return (
    <>
      <fog attach="fog" args={[PAL.fogColor, PAL.fogNear, PAL.fogFar]} />
      <SkyDome palette={PAL} />
      <Environment files={hdriNight} background={false} environmentIntensity={0.75} />
      <ambientLight intensity={PAL.ambient} />
      <hemisphereLight args={[PAL.skyColor, PAL.groundBounce, PAL.hemiIntensity]} />
      <directionalLight
        key={mapSize}
        castShadow
        position={sun}
        intensity={PAL.sunIntensity}
        color={PAL.sunColor}
        shadow-mapSize={[mapSize, mapSize]}
        shadow-bias={-0.00018}
        shadow-normalBias={0.03}
        shadow-camera-near={1}
        shadow-camera-far={300}
        shadow-camera-left={-62}
        shadow-camera-right={62}
        shadow-camera-top={66}
        shadow-camera-bottom={-62}
      />
      <directionalLight position={[-50, 26, -44]} intensity={PAL.sunIntensity * 0.16} color={PAL.skyColor} />

      <ConstructionSite theme={THEME} source={constructionState} />
      {ARCH.towers.map((spec) => (
        <Tower key={spec.id} spec={spec} data={BUILDING_BY_ID[spec.id]} theme={THEME} source={constructionState} />
      ))}
      <Cranes source={constructionState} />
      <ConstructionCamera source={constructionState} reducedMotion={reducedMotion} />

      <RenderOnChange />
      <ShadowOnChange />
      {tier === 'high' && onSlow && <AdaptiveTier onSlow={onSlow} />}
      <Effects tier={tier} />
    </>
  );
}

function startingTier(): { tier: Tier; locked: boolean } {
  const fx = new URLSearchParams(window.location.search).get('fx');
  if (fx === '0') return { tier: 'low', locked: true };
  if (fx === '1') return { tier: 'high', locked: true };
  const weak = window.innerWidth < 900 || (navigator.hardwareConcurrency ?? 8) <= 4;
  return { tier: weak ? 'low' : 'high', locked: false };
}

export default function ConstructionCanvas({
  reducedMotion,
  onContextLost,
}: {
  reducedMotion: boolean;
  onContextLost: () => void;
}) {
  const [{ tier, locked }, setQuality] = useState(startingTier);

  return (
    <Canvas
      className="touch-scroll"
      frameloop="demand"
      shadows
      dpr={tier === 'high' ? [1, 1.75] : [1, 1.25]}
      camera={{ position: [66, 15, 128], fov: 34, near: 0.5, far: 1400 }}
      gl={{
        antialias: tier === 'low',
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
      }}
      onCreated={(state) => {
        state.gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          onContextLost();
        });
        // QA hook used by the scroll and performance audit
        if (new URLSearchParams(window.location.search).has('debug')) {
          const w = window as unknown as Record<string, unknown>;
          w.__constructionScene = state.scene;
          w.__constructionState = constructionState;
          w.__constructionGl = state.gl;
          w.__constructionInvalidate = state.invalidate;
        }
      }}
      style={{ position: 'absolute', inset: 0 }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <Scene
          reducedMotion={reducedMotion}
          tier={tier}
          onSlow={locked ? undefined : () => setQuality({ tier: 'low', locked: true })}
        />
      </Suspense>
    </Canvas>
  );
}
