'use client';

import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { BUILDING_BY_ID, FLOOR_HEIGHT, TL } from '@/lib/buildingConfig';
import { introTimeline } from '@/lib/introTimeline';
import { useApp } from '@/lib/store';

const HERO_POS = new THREE.Vector3(44, 33, 94);
const HERO_TARGET = new THREE.Vector3(0, 13, 0);

export default function CameraRig() {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as
    | { target: THREE.Vector3; update: () => void }
    | null;

  const setPhase = useApp((s) => s.setPhase);
  const phase = useApp((s) => s.phase);
  const selBuilding = useApp((s) => s.selectedBuilding);
  const selFloor = useApp((s) => s.selectedFloor);

  /** Proxy the controls target so GSAP can tween it before controls exist. */
  const lookAt = useRef(new THREE.Vector3(0, 10, 0));
  const registered = useRef(false);

  // --- intro: cinematic push, then hand over to OrbitControls -------------
  useEffect(() => {
    if (registered.current) return;
    registered.current = true;

    const tl = introTimeline();

    camera.position.set(-10, 8, 196);
    lookAt.current.set(0, 8, 0);

    tl.to(
      camera.position,
      { x: 22, y: 26, z: 128, duration: TL.cameraStart, ease: 'power1.inOut' },
      0,
    );
    tl.to(
      lookAt.current,
      { x: 0, y: 15, z: 0, duration: TL.cameraStart, ease: 'power1.inOut' },
      0,
    );

    const handover = TL.cameraEnd - TL.cameraStart;
    tl.to(
      camera.position,
      { x: HERO_POS.x, y: HERO_POS.y, z: HERO_POS.z, duration: handover, ease: 'power2.out' },
      TL.cameraStart,
    );
    tl.to(
      lookAt.current,
      {
        x: HERO_TARGET.x,
        y: HERO_TARGET.y,
        z: HERO_TARGET.z,
        duration: handover,
        ease: 'power2.out',
      },
      TL.cameraStart,
    );
    tl.call(
      () => {
        setPhase('ready');
      },
      undefined,
      TL.cameraEnd,
    );
  }, [camera, setPhase]);

  // While the intro owns the camera, drive orientation manually.
  useFrame(() => {
    if (useApp.getState().phase !== 'ready') {
      camera.lookAt(lookAt.current);
      if (controls) controls.target.copy(lookAt.current);
    }
  });

  // --- focus the isolated floor -------------------------------------------
  useEffect(() => {
    if (phase !== 'ready' || !controls) return;

    const tweenTo = (pos: THREE.Vector3, target: THREE.Vector3, duration = 1.0) => {
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(controls.target);
      gsap.to(camera.position, {
        x: pos.x,
        y: pos.y,
        z: pos.z,
        duration,
        ease: 'power3.inOut',
        onUpdate: () => controls.update(),
      });
      gsap.to(controls.target, {
        x: target.x,
        y: target.y,
        z: target.z,
        duration,
        ease: 'power3.inOut',
        onUpdate: () => controls.update(),
      });
    };

    if (!selBuilding || selFloor === null) {
      tweenTo(HERO_POS, HERO_TARGET, 1.1);
      return;
    }

    const b = BUILDING_BY_ID[selBuilding];
    const floorY = (selFloor - 1) * FLOOR_HEIGHT + FLOOR_HEIGHT * 0.5;
    const target = new THREE.Vector3(b.position[0], floorY, b.position[2] + 4);
    // Stand off along +Z, offset sideways so the isolated slab reads in profile.
    const pos = new THREE.Vector3(
      b.position[0] + (selBuilding === 'A' ? -17 : 19),
      floorY + 10,
      b.position[2] + 48,
    );
    tweenTo(pos, target, 1.0);
  }, [selBuilding, selFloor, phase, controls, camera]);

  return null;
}
