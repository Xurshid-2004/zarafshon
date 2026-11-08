'use client';

// Camera path as a pure function of construction progress, so it is reversible
// by construction. A small pointer parallax rides on top (off for reduced motion).

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ProgressSource } from '@/components/engine/schedule';

interface Key {
  at: number;
  pos: [number, number, number];
  target: [number, number, number];
}

/** Hand-placed shots: wide site, into the pit, frame, facade, entrance, hero. */
export const CAMERA_KEYS: readonly Key[] = [
  { at: 0.0, pos: [66, 15, 128], target: [2, 20, 0] },
  { at: 0.08, pos: [40, 36, 62], target: [0, -1.5, 0] },
  { at: 0.2, pos: [54, 26, 78], target: [0, 7, 0] },
  { at: 0.42, pos: [62, 30, 98], target: [0, 15, 0] },
  { at: 0.6, pos: [38, 20, 86], target: [6, 17, 2] },
  { at: 0.74, pos: [-30, 15, 76], target: [2, 15, 4] },
  { at: 0.84, pos: [-6, 7, 58], target: [0, 8, 6] },
  { at: 1.0, pos: [50, 8, 88], target: [2, 17, 0] },
];

const BASE_FOV = 34;

/** Evaluate two splines at progress p. Keys are unevenly spaced in progress. */
function evaluate(p: number, posCurve: THREE.CatmullRomCurve3, targetCurve: THREE.CatmullRomCurve3, pos: THREE.Vector3, target: THREE.Vector3) {
  const k = CAMERA_KEYS;
  let i = 0;
  while (i < k.length - 2 && p > k[i + 1].at) i++;
  const span = k[i + 1].at - k[i].at;
  const local = THREE.MathUtils.clamp((p - k[i].at) / span, 0, 1);
  const u = (i + local) / (k.length - 1);
  posCurve.getPoint(u, pos);
  targetCurve.getPoint(u, target);
}

export default function ConstructionCamera({
  source,
  reducedMotion,
}: {
  source: ProgressSource;
  reducedMotion: boolean;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const pos = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  const parallax = useRef(new THREE.Vector2());
  const dolly = useRef(1);

  const [posCurve, targetCurve] = useMemo(
    () => [
      new THREE.CatmullRomCurve3(CAMERA_KEYS.map((k) => new THREE.Vector3(...k.pos)), false, 'centripetal'),
      new THREE.CatmullRomCurve3(CAMERA_KEYS.map((k) => new THREE.Vector3(...k.target)), false, 'centripetal'),
    ],
    [],
  );

  // Framing per viewport: keep the horizontal field on narrow screens, and on
  // wide ones move the subject clear of the text column.
  useEffect(() => {
    const aspect = size.width / size.height;
    const wanted = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) / aspect));
    camera.fov = THREE.MathUtils.clamp(wanted, BASE_FOV, 62);
    dolly.current = aspect < 1 ? 1.45 : 1;
    if (size.width >= 900) {
      camera.setViewOffset(size.width, size.height, -size.width * 0.07, 0, size.width, size.height);
    } else {
      camera.clearViewOffset();
    }
    camera.updateProjectionMatrix();
    return () => {
      camera.clearViewOffset();
    };
  }, [camera, size]);

  useFrame((state, dt) => {
    evaluate(source.progress, posCurve, targetCurve, pos.current, target.current);
    if (dolly.current !== 1) pos.current.sub(target.current).multiplyScalar(dolly.current).add(target.current);
    if (!reducedMotion) {
      const k = Math.min(1, dt * 2.5);
      parallax.current.x += (state.pointer.x - parallax.current.x) * k;
      parallax.current.y += (state.pointer.y - parallax.current.y) * k;
      pos.current.x += parallax.current.x * 2.2;
      pos.current.y += parallax.current.y * 1.2;
      // the canvas renders on demand: keep frames coming until the camera settles
      if (Math.abs(state.pointer.x - parallax.current.x) + Math.abs(state.pointer.y - parallax.current.y) > 0.002) {
        state.invalidate();
      }
    }
    camera.position.copy(pos.current);
    camera.lookAt(target.current);
  });

  return null;
}
