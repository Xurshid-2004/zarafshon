'use client';

// ============================================================================
//  /engine — static inspection view of the procedural towers.
//
//  No animation here on purpose: this page exists to check proportions,
//  materials and part breakdown before the scroll construction is wired up.
//  URL params (handy for screenshots):  ?view=front&ground=0&theme=dark&ui=0
// ============================================================================

import hdriNight from '@pmndrs/assets/hdri/night.exr';
import hdriSunset from '@pmndrs/assets/hdri/sunset.exr';
import { Environment, Grid, Html, Line, OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { ARCH, towerHeight } from '@/lib/architecture';
import { BUILDING_BY_ID } from '@/lib/buildingConfig';
import type { Theme } from '@/lib/types';
import { allBoxes, buildTowerLayout, slotsFromBuilding } from './layout';
import Tower, { ALL_PARTS, PART_KEYS, type PartKey, type PartVisibility } from './Tower';

type View = 'hero' | 'front' | 'side' | 'aerial' | 'detail' | 'foundation';

const VIEWS: Record<View, { label: string; pos: [number, number, number]; target: [number, number, number] }> = {
  hero: { label: 'Umumiy', pos: [52, 30, 96], target: [0, 14, 0] },
  front: { label: 'Old', pos: [0, 17, 98], target: [0, 17, 0] },
  side: { label: 'Yon', pos: [112, 18, 4], target: [0, 17, 0] },
  aerial: { label: 'Yuqoridan', pos: [46, 92, 74], target: [0, 6, 0] },
  detail: { label: 'Detal', pos: [26, 9, 26], target: [14.5, 7, 3] },
  foundation: { label: 'Poydevor', pos: [42, 10, 46], target: [0, -3, 0] },
};

const PART_LABEL: Record<PartKey, string> = {
  foundation: 'Poydevor',
  structure: 'Karkas (ustun + yadro)',
  slabs: 'Qavat plitalari',
  windows: 'Oynalar',
  facade: 'Fasad panellari',
  balconies: 'Balkonlar',
  entrance: 'Kirish',
  roof: 'Tom',
};

function readParams() {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

// ---------------------------------------------------------------------------
//  Scene pieces
// ---------------------------------------------------------------------------
function CameraPreset({ view }: { view: View }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as {
    target: THREE.Vector3;
    update: () => void;
  } | null;
  useEffect(() => {
    const v = VIEWS[view];
    camera.position.set(...v.pos);
    if (controls) {
      controls.target.set(...v.target);
      controls.update();
    } else {
      camera.lookAt(...v.target);
    }
  }, [view, camera, controls]);
  return null;
}

/** 1.75 m person next to the entrance, for scale. */
function ScaleFigure({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} name="ScaleFigure_1_75m">
      <mesh position={[0, 0.72, 0]} castShadow>
        <capsuleGeometry args={[0.2, 1.0, 4, 10]} />
        <meshStandardMaterial color="#C9965A" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.13, 14, 10]} />
        <meshStandardMaterial color="#C9965A" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none whitespace-nowrap rounded-md bg-ink-900/80 px-2 py-1 font-mono text-[11px] text-bone-50 shadow-lift">
      {children}
    </div>
  );
}

/** Height and width dimension lines for one tower. */
function Dimensions({ id }: { id: 'A' | 'B' }) {
  const spec = ARCH.towers.find((t) => t.id === id)!;
  const [x, , z] = spec.position;
  const H = towerHeight(spec);
  const hw = spec.width / 2;
  const front = z + spec.depth / 2 + ARCH.balcony.depth + 3.5;
  const side = id === 'A' ? x - hw - 3 : x + hw + 3;
  const color = '#E0B47A';
  return (
    <group>
      <Line points={[[side, 0, z], [side, H, z]]} color={color} lineWidth={1.5} />
      <Line points={[[side - 0.8, H, z], [side + 0.8, H, z]]} color={color} lineWidth={1.5} />
      <Html position={[side, H / 2, z]} center>
        <Label>
          {id}: {H.toFixed(2)} m · {spec.floors} qavat
        </Label>
      </Html>
      <Line points={[[x - hw, 0.05, front], [x + hw, 0.05, front]]} color={color} lineWidth={1.5} />
      <Html position={[x, 0.4, front]} center>
        <Label>{spec.width} m</Label>
      </Html>
    </group>
  );
}

function Scene({
  theme,
  parts,
  showGround,
  showDims,
}: {
  theme: Theme;
  parts: PartVisibility;
  showGround: boolean;
  showDims: boolean;
}) {
  const night = theme === 'dark';
  return (
    <>
      <color attach="background" args={[night ? '#0B1018' : '#CFD9E0']} />
      <fog attach="fog" args={[night ? '#0B1018' : '#CFD9E0', 160, 420]} />
      <Environment files={night ? hdriNight : hdriSunset} environmentIntensity={night ? 0.5 : 1.1} />
      <hemisphereLight args={[night ? '#2A3F60' : '#DCE7F2', night ? '#140F0A' : '#6C6049', night ? 0.25 : 0.55]} />
      <directionalLight
        position={night ? [-40, 60, 30] : [70, 80, 55]}
        intensity={night ? 0.35 : 2.6}
        color={night ? '#9FB4D8' : '#FFE2BF'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-far={300}
      />

      {showGround && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
          <planeGeometry args={[400, 400]} />
          <meshStandardMaterial color={night ? '#1C1E20' : '#8C8F86'} roughness={0.95} />
        </mesh>
      )}
      <Grid
        position={[0, showGround ? 0.002 : -0.4, 0]}
        args={[200, 200]}
        cellSize={1}
        sectionSize={5}
        cellColor={night ? '#2A3038' : '#7B7F78'}
        sectionColor={night ? '#4A5260' : '#5B605A'}
        cellThickness={0.5}
        sectionThickness={1}
        fadeDistance={150}
        infiniteGrid
      />

      {ARCH.towers.map((spec) => (
        <Tower key={spec.id} spec={spec} data={BUILDING_BY_ID[spec.id]} theme={theme} parts={parts} />
      ))}

      <ScaleFigure position={[ARCH.towers[0].position[0] + 4.5, 0, ARCH.towers[0].position[2] + ARCH.towers[0].depth / 2 + 2.6]} />
      {showDims && (
        <>
          <Dimensions id="A" />
          <Dimensions id="B" />
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
//  Page
// ---------------------------------------------------------------------------
export default function EnginePreview() {
  const params = useMemo(readParams, []);
  const [view, setView] = useState<View>((params.get('view') as View) in VIEWS ? (params.get('view') as View) : 'hero');
  const [theme, setTheme] = useState<Theme>(params.get('theme') === 'dark' ? 'dark' : 'light');
  const [showGround, setShowGround] = useState(params.get('ground') !== '0' && params.get('view') !== 'foundation');
  const [showDims, setShowDims] = useState(params.get('dims') !== '0');
  const [parts, setParts] = useState<PartVisibility>(() => {
    const only = params.get('parts');
    if (!only) return ALL_PARTS;
    const keep = new Set(only.split(','));
    return Object.fromEntries(PART_KEYS.map((k) => [k, keep.has(k)])) as PartVisibility;
  });
  const showUi = params.get('ui') !== '0';

  const stats = useMemo(
    () =>
      ARCH.towers.map((spec) => {
        const L = buildTowerLayout(spec, slotsFromBuilding(BUILDING_BY_ID[spec.id]));
        return {
          id: spec.id,
          floors: spec.floors,
          size: `${spec.width} × ${spec.depth}`,
          height: towerHeight(spec),
          parapet: towerHeight(spec) + ARCH.roof.parapetHeight,
          balconies: L.balconies.slabs.length,
          instances: allBoxes(L).length,
        };
      }),
    [],
  );

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-ink-900">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: VIEWS[view].pos, fov: 34, near: 0.5, far: 1200 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Suspense fallback={null}>
          <Scene theme={theme} parts={parts} showGround={showGround} showDims={showDims} />
        </Suspense>
        <OrbitControls makeDefault enableDamping maxDistance={320} minDistance={4} />
        <CameraPreset view={view} />
      </Canvas>

      {showUi && (
        <aside className="absolute left-4 top-4 w-[min(320px,calc(100vw-32px))] space-y-4 rounded-2xl border border-white/10 bg-ink-900/80 p-4 text-bone-50 shadow-lift backdrop-blur-xl">
          <div>
            <p className="text-[10px] uppercase tracking-arch text-bronze-400">Zarafshon Residence</p>
            <h1 className="mt-1 text-lg font-semibold">Bino engine — statik model</h1>
            <p className="mt-1 text-xs text-bone-50/60">Animatsiyasiz. Proporsiya va qismlarni tekshirish uchun.</p>
          </div>

          <div>
            <p className="mb-2 text-[10px] uppercase tracking-arch text-bone-50/50">Kamera</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(VIEWS) as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setView(v);
                    if (v === 'foundation') setShowGround(false);
                  }}
                  className={`rounded-lg px-2 py-1.5 text-xs transition ${
                    view === v ? 'bg-bronze-500 text-ink-900' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {VIEWS[v].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] uppercase tracking-arch text-bone-50/50">Qismlar</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {PART_KEYS.map((k) => (
                <label key={k} className="flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={parts[k]}
                    onChange={() => setParts((p) => ({ ...p, [k]: !p[k] }))}
                    className="accent-[#C9965A]"
                  />
                  {PART_LABEL[k]}
                </label>
              ))}
              <label className="flex cursor-pointer items-center gap-2 text-xs">
                <input type="checkbox" checked={showGround} onChange={() => setShowGround((g) => !g)} className="accent-[#C9965A]" />
                Yer
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs">
                <input type="checkbox" checked={showDims} onChange={() => setShowDims((d) => !d)} className="accent-[#C9965A]" />
                O‘lchamlar
              </label>
            </div>
          </div>

          <button
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="w-full rounded-lg bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
          >
            {theme === 'dark' ? 'Kunduzgi rejim' : 'Tungi rejim'}
          </button>

          <table className="w-full font-mono text-[11px] tabular-nums">
            <thead className="text-bone-50/50">
              <tr>
                <th className="text-left font-normal">Bino</th>
                <th className="text-right font-normal">Qavat</th>
                <th className="text-right font-normal">O‘lcham</th>
                <th className="text-right font-normal">Balandlik</th>
                <th className="text-right font-normal">Balkon</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td className="text-right">{s.floors}</td>
                  <td className="text-right">{s.size}</td>
                  <td className="text-right">{s.height.toFixed(1)} m</td>
                  <td className="text-right">{s.balconies}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-bone-50/40">
            Qavat balandligi {ARCH.floorHeight} m · inson figurasi 1.75 m ·{' '}
            {stats.reduce((a, s) => a + s.instances, 0)} instance, ~64 draw call
          </p>
        </aside>
      )}
    </main>
  );
}
