'use client';

import type { ThreeEvent } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { STATUS_COLOR } from '@/lib/palette';
import { useApp } from '@/lib/store';
import type { Apartment } from '@/lib/types';
import { unitBox } from './materials';

/**
 * One selectable unit volume, named per spec (`Bld11_F05_Apt02`) and carrying
 * its metadata bounds in userData so an external raycast can read the unit
 * straight off the hit object.
 *
 * Opacity and glow are lerped inside useFrame from `useApp.getState()`, never
 * from a hook selector — pointer movement across all 69 units triggers no
 * React re-render.
 */
export default function ApartmentMesh({ apt }: { apt: Apartment }) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: STATUS_COLOR[apt.status],
        emissive: new THREE.Color(STATUS_COLOR[apt.status]),
        emissiveIntensity: 0.2,
        roughness: 0.42,
        metalness: 0,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    [apt.status],
  );

  useEffect(() => () => mat.dispose(), [mat]);

  const { size, center } = useMemo(() => {
    const [x0, y0, z0] = apt.bounds.min;
    const [x1, y1, z1] = apt.bounds.max;
    return {
      size: [x1 - x0, y1 - y0, z1 - z0] as [number, number, number],
      center: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2] as [number, number, number],
    };
  }, [apt.bounds]);

  const isOpen = (s: ReturnType<typeof useApp.getState>) =>
    s.selectedBuilding === apt.building && s.selectedFloor === apt.floor;

  useFrame((_, dt) => {
    const s = useApp.getState();
    if (s.phase !== 'ready') return;

    const open = isOpen(s);
    const hovered = s.hoveredApartment === apt.id;
    const selected = s.selectedApartment === apt.id;

    const targetOpacity = selected ? 0.58 : hovered ? 0.46 : open ? 0.24 : 0;
    const targetGlow = selected || hovered ? 0.55 : 0.2;

    const k = Math.min(1, dt * 9);
    mat.opacity += (targetOpacity - mat.opacity) * k;
    mat.emissiveIntensity += (targetGlow - mat.emissiveIntensity) * k;
  });

  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    const s = useApp.getState();
    if (s.phase !== 'ready' || !isOpen(s)) return; // let the floor own the hover
    e.stopPropagation();
    s.setHoveredApartment(apt.id);
    document.body.style.cursor = 'pointer';
  };

  const onPointerOut = () => {
    const s = useApp.getState();
    if (s.hoveredApartment === apt.id) s.setHoveredApartment(null);
  };

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    const s = useApp.getState();
    if (s.phase !== 'ready' || !isOpen(s)) return;
    e.stopPropagation();
    s.selectApartment(apt.id);
  };

  return (
    <mesh
      name={apt.id}
      geometry={unitBox()}
      material={mat}
      scale={size}
      position={center}
      renderOrder={2}
      userData={{
        kind: 'apartment',
        id: apt.id,
        building: apt.building,
        floor: apt.floor,
        index: apt.index,
        rooms: apt.rooms,
        area: apt.area,
        pricePerM2: apt.pricePerM2,
        price: apt.price,
        status: apt.status,
        bounds: apt.bounds,
      }}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    />
  );
}
