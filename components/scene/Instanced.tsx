'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { TL } from '@/lib/buildingConfig';
import { introTimeline } from '@/lib/introTimeline';

export interface InstanceItem {
  /** Centre of the prop at full size. */
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  /** Seconds after the environment window opens. */
  delay: number;
  /** `base` grows off the ground, `center` scales about the centre,
   *  `pivot` leaves the position alone (geometry already has its own origin). */
  from?: 'base' | 'center' | 'pivot';
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

/**
 * One draw call per prop category.
 *
 * Each instance owns a 0..1 growth value tweened on the shared intro timeline;
 * a single useFrame rewrites the instance matrices only while something is
 * still animating, so the environment settles to zero per-frame cost.
 */
export default function Instanced({
  name,
  geometry,
  material,
  items,
  castShadow = true,
  receiveShadow = false,
}: {
  name: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  items: readonly InstanceItem[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const grow = useRef<Float32Array>(new Float32Array(items.length));
  const dirty = useRef(true);
  const hasColor = useMemo(() => items.some((i) => i.color), [items]);

  // growth tweens
  useEffect(() => {
    grow.current = new Float32Array(items.length);
    dirty.current = true;
    const tl = introTimeline();
    items.forEach((it, i) => {
      const o = { v: 0 };
      tl.to(
        o,
        {
          v: 1,
          duration: 0.42,
          ease: 'back.out(1.8)',
          onUpdate: () => {
            grow.current[i] = o.v;
            dirty.current = true;
          },
        },
        TL.environmentStart + it.delay,
      );
    });
  }, [items]);

  // per-instance colour is static, so write it once
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh || !hasColor) return;
    items.forEach((it, i) => {
      _c.set(it.color ?? '#ffffff');
      mesh.setColorAt(i, _c);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items, hasColor]);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh || !dirty.current) return;

    let settled = true;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const g = grow.current[i];
      if (g < 0.999) settled = false;

      const sx = it.scale[0] * g;
      const sy = it.scale[1] * g;
      const sz = it.scale[2] * g;

      let cy = it.position[1];
      if (it.from === undefined || it.from === 'base') {
        const baseY = it.position[1] - it.scale[1] / 2;
        cy = baseY + sy / 2;
      }

      _p.set(it.position[0], cy, it.position[2]);
      _s.set(Math.max(sx, 1e-4), Math.max(sy, 1e-4), Math.max(sz, 1e-4));
      const r = it.rotation;
      _e.set(r ? r[0] : 0, r ? r[1] : 0, r ? r[2] : 0);
      _q.setFromEuler(_e);
      _m.compose(_p, _q, _s);
      mesh.setMatrixAt(i, _m);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    if (settled) dirty.current = false;
  });

  return (
    <instancedMesh
      ref={ref}
      name={name}
      args={[geometry, material, items.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled={false}
    />
  );
}
