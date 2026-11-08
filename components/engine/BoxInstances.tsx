'use client';

import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Box } from './layout';
import { Motion, type InstanceAnim, type ProgressSource } from './schedule';

/** One shared unit cube for every instanced box in the engine. */
let _unit: THREE.BoxGeometry | null = null;
export function unitCube(): THREE.BoxGeometry {
  if (!_unit) _unit = new THREE.BoxGeometry(1, 1, 1);
  return _unit;
}

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _c = new THREE.Color();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

const easeOut = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);

/**
 * Write instance i at construction phase t (0 = not built, 1 = in place).
 * Pure function of (box, mode, t) — this is what makes reverse scrolling free.
 */
function writeInstance(mesh: THREE.InstancedMesh, i: number, b: Box, mode: number, t: number) {
  const e = easeOut(t);
  const hidden = mode === Motion.Shrink ? t >= 1 : t <= 0;
  if (hidden) {
    mesh.setMatrixAt(i, ZERO);
    return;
  }
  let [px, py, pz] = b.p;
  let [sx, sy, sz] = b.s;

  switch (mode) {
    case Motion.Scale:
      sx *= e;
      sy *= e;
      sz *= e;
      break;
    case Motion.Rise:
      py = b.p[1] - b.s[1] / 2 + (b.s[1] * e) / 2;
      sy *= e;
      break;
    case Motion.Drop:
      py += (1 - e) * 4.5;
      sx *= 0.94 + 0.06 * e;
      sz *= 0.94 + 0.06 * e;
      break;
    case Motion.GrowLong:
      if (b.s[0] >= b.s[2]) sx *= e;
      else sz *= e;
      break;
    case Motion.Extend: {
      // grow away from the tower centre, anchored on the facade side
      if (Math.abs(b.p[2]) >= Math.abs(b.p[0]) * 0.5) {
        const sign = Math.sign(b.p[2]) || 1;
        sz = b.s[2] * e;
        pz = b.p[2] - (sign * b.s[2]) / 2 + (sign * sz) / 2;
      } else {
        const sign = Math.sign(b.p[0]) || 1;
        sx = b.s[0] * e;
        px = b.p[0] - (sign * b.s[0]) / 2 + (sign * sx) / 2;
      }
      break;
    }
    case Motion.RiseFromBelow:
      py -= (1 - e) * b.s[1] * 1.05;
      break;
    case Motion.Shrink: {
      const k = 1 - e;
      sx *= k;
      sz *= k;
      break;
    }
    case Motion.Flat:
      sx *= e;
      sz *= e;
      break;
  }

  _p.set(px, py, pz);
  _s.set(sx, sy, sz);
  _m.compose(_p, _q, _s);
  mesh.setMatrixAt(i, _m);
}

/**
 * Draws a list of layout boxes as ONE InstancedMesh (one draw call).
 *
 * Static by default. With `anim` + `source` it becomes a construction
 * sequence: every frame the progress value moved, only the instances whose
 * phase actually changed are rewritten — no React re-render ever happens.
 */
export default function BoxInstances({
  name,
  boxes,
  material,
  geometry,
  anim,
  source,
  castShadow = true,
  receiveShadow = true,
  renderOrder,
}: {
  name: string;
  boxes: readonly Box[];
  material: THREE.Material;
  /** Defaults to a unit cube; any unit-sized geometry works (cylinder, sphere…). */
  geometry?: THREE.BufferGeometry;
  anim?: InstanceAnim;
  source?: ProgressSource;
  castShadow?: boolean;
  receiveShadow?: boolean;
  renderOrder?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  /** Last phase written per instance; -1 forces a write. */
  const phase = useRef<Float32Array>(new Float32Array(0));
  const lastProgress = useRef(-1);

  const animated = !!(anim && source);

  const apply = (p: number, force: boolean) => {
    const mesh = ref.current;
    if (!mesh || !anim) return;
    let changed = false;
    const ph = phase.current;
    for (let i = 0; i < boxes.length; i++) {
      const d = anim.dur[i];
      const t = d > 0 ? Math.min(1, Math.max(0, (p - anim.start[i]) / d)) : p >= anim.start[i] ? 1 : 0;
      if (!force && t === ph[i]) continue;
      ph[i] = t;
      writeInstance(mesh, i, boxes[i], anim.mode[i], t);
      changed = true;
    }
    if (changed) mesh.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const tinted = boxes.some((b) => b.c);
    boxes.forEach((b, i) => {
      _p.set(b.p[0], b.p[1], b.p[2]);
      _s.set(b.s[0], b.s[1], b.s[2]);
      _m.compose(_p, _q, _s);
      mesh.setMatrixAt(i, _m);
      if (tinted) mesh.setColorAt(i, _c.set(b.c ?? '#FFFFFF'));
    });
    mesh.count = boxes.length;
    // culling bounds are taken from the finished state, then kept
    mesh.computeBoundingSphere();
    mesh.computeBoundingBox();
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    if (animated && source) {
      phase.current = new Float32Array(boxes.length).fill(-1);
      apply(source.progress, true);
      lastProgress.current = source.progress;
    }
    mesh.instanceMatrix.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxes, anim, animated]);

  useFrame(() => {
    if (!animated || !source) return;
    const p = source.progress;
    if (p === lastProgress.current) return;
    lastProgress.current = p;
    apply(p, false);
  });

  if (boxes.length === 0) return null;

  return (
    <instancedMesh
      // a new count needs a new buffer, so remount when it changes
      key={boxes.length}
      ref={ref}
      name={name}
      args={[geometry ?? unitCube(), material, boxes.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      renderOrder={renderOrder}
      // bounds are computed from the finished building, so nothing is culled mid-build
      frustumCulled
      userData={{ engine: true, count: boxes.length }}
    />
  );
}
