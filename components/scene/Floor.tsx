'use client';

import type { ThreeEvent } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { FLOOR_HEIGHT, SLAB, floorDelay } from '@/lib/buildingConfig';
import { introTimeline } from '@/lib/introTimeline';
import { PALETTE } from '@/lib/palette';
import { useApp } from '@/lib/store';
import type { BuildingData, FloorData } from '@/lib/types';
import ApartmentMesh from './ApartmentMesh';
import Commercial from './Commercial';
import FloorInterior from './FloorInterior';
import type { BuildingGeo } from './buildingGeo';
import { makeFacadeMaterial } from './facadeMaterial';
import { getMaterials, unitBox } from './materials';

interface Props {
  floor: FloorData;
  building: BuildingData;
  geo: BuildingGeo;
}

/**
 * One storey.
 *
 *   <group name="bld11_floor_5">   <- the named, raycastable node (spec)
 *     <group ref=animRef>          <- construction + exploded-view transform
 *       slab / core / spandrel / glass shell / outline
 *       apartment sub-meshes       <- Bld11_F05_Apt01 ...
 *       balconies
 *     </group>
 *   </group>
 */
export default function Floor({ floor, building, geo }: Props) {
  const theme = useApp((s) => s.theme);
  const phase = useApp((s) => s.phase);
  const selBuilding = useApp((s) => s.selectedBuilding);
  const selFloor = useApp((s) => s.selectedFloor);

  const mats = getMaterials(theme);
  const pal = PALETTE[theme];
  const baseOpacity = pal.glassOpacity;

  const animRef = useRef<THREE.Group>(null);

  // Private materials: these two animate their own opacity every frame.
  const columns = Math.max(3, floor.apartments.length || (building.id === 'A' ? 4 : 5));

  const glassMat = useMemo(() => {
    const { material } = makeFacadeMaterial({
      columns,
      rows: 2,
      litRatio: theme === 'dark' ? 0.6 : 0.3,
      frameColor: pal.frame,
      warm: pal.shopGlow,
      cool: pal.skyColor,
      interior: theme === 'dark' ? 1.45 : 1.25,
      // vary the pane pattern per storey, or every floor shows the same rooms
      seed: (building.id === 'A' ? 17 : 53) + floor.level * 7,
    });
    material.emissive = new THREE.Color(pal.guide);
    return material;
  }, [
    columns,
    theme,
    pal.frame,
    pal.shopGlow,
    pal.skyColor,
    pal.guide,
    building.id,
    floor.level,
  ]);

  const outlineMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: pal.guide, transparent: true, opacity: 0 }),
    [pal.guide],
  );

  useEffect(
    () => () => {
      glassMat.dispose();
      outlineMat.dispose();
    },
    [glassMat, outlineMat],
  );

  // --- construction: register tweens on the shared intro timeline ---------
  useEffect(() => {
    const g = animRef.current;
    if (!g) return;

    const d = floorDelay(building, floor.level);
    g.position.set(0, floor.baseY - 6, 0);
    g.scale.set(1, 0.22, 1);

    const tl = introTimeline();
    tl.to(g.position, { y: floor.baseY, duration: 0.5, ease: 'power3.out' }, d);
    tl.to(g.scale, { y: 1, duration: 0.46, ease: 'power2.out' }, d);
    tl.to(glassMat, { opacity: baseOpacity, duration: 0.45, ease: 'power2.out' }, d + 0.24);
  }, [building, floor.level, floor.baseY, glassMat, baseOpacity]);

  // --- exploded view ------------------------------------------------------
  useEffect(() => {
    if (phase !== 'ready') return;
    const g = animRef.current;
    if (!g) return;

    let y = floor.baseY;
    let z = 0;

    if (selBuilding === floor.building && selFloor !== null) {
      const diff = floor.level - selFloor;
      if (diff === 0) {
        z = 8.5; // isolate horizontally, toward the camera
      } else if (diff > 0) {
        y = floor.baseY + 2.4 + Math.min(diff, 6) * 0.55;
      } else {
        // never push a slab underground
        y = Math.max(0, floor.baseY - 1.3);
      }
    }

    gsap.killTweensOf(g.position);
    gsap.to(g.position, { y, z, duration: 0.9, ease: 'power3.inOut' });
  }, [selBuilding, selFloor, phase, floor.building, floor.level, floor.baseY]);

  // --- hover / selection highlight (no React re-render) -------------------
  useFrame((_, dt) => {
    const s = useApp.getState();
    if (s.phase !== 'ready') return;

    const hovered = s.hoveredFloor === floor.id;
    const isSelf = s.selectedBuilding === floor.building && s.selectedFloor === floor.level;
    const otherOpen =
      s.selectedBuilding === floor.building && s.selectedFloor !== null && !isSelf;

    const targetGlass = isSelf
      ? baseOpacity * 0.5
      : hovered
        ? Math.min(1, baseOpacity + 0.14)
        : otherOpen
          ? baseOpacity * 0.58
          : baseOpacity;

    const targetGlow = hovered && !isSelf ? 0.3 : 0;
    const targetOutline = hovered || isSelf ? 0.95 : 0;

    const k = Math.min(1, dt * 8);
    glassMat.opacity += (targetGlass - glassMat.opacity) * k;
    glassMat.emissiveIntensity += (targetGlow - glassMat.emissiveIntensity) * k;
    outlineMat.opacity += (targetOutline - outlineMat.opacity) * k;
  });

  // --- pointer handlers on the named floor node --------------------------
  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    const s = useApp.getState();
    if (s.phase !== 'ready') return;
    e.stopPropagation();
    s.setHoveredFloor(floor.id);
    document.body.style.cursor = 'pointer';
  };

  const onPointerOut = () => {
    const s = useApp.getState();
    if (s.hoveredFloor === floor.id) {
      s.setHoveredFloor(null);
      document.body.style.cursor = 'auto';
    }
  };

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    const s = useApp.getState();
    if (s.phase !== 'ready') return;
    e.stopPropagation();
    s.selectFloor(floor.building, floor.level);
  };

  const glassCenterY = SLAB + 0.1 + geo.glassH / 2;
  const balconies = useMemo(
    () => floor.apartments.filter((a) => a.balcony),
    [floor.apartments],
  );

  return (
    <group
      name={floor.meshName}
      userData={{
        kind: 'floor',
        id: floor.id,
        specName: floor.specName,
        building: floor.building,
        level: floor.level,
        floorKind: floor.kind,
        units: floor.apartments.length,
      }}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      <group ref={animRef}>
        {/* structural slab */}
        <mesh
          name={`${floor.specName}_Slab`}
          geometry={geo.slab}
          material={mats.slab}
          position={[0, SLAB / 2, 0]}
          castShadow
          receiveShadow
        />

        {/* service core / lift shaft */}
        <mesh
          name={`${floor.specName}_Core`}
          geometry={geo.core}
          material={mats.core}
          position={[0, SLAB + geo.innerH / 2, -building.depth * 0.5 + 2.4]}
          castShadow
        />

        {/* warm timber spandrel band */}
        <mesh
          name={`${floor.specName}_Band`}
          geometry={geo.band}
          material={mats.wood}
          position={[0, SLAB + 0.12, 0]}
          castShadow
        />

        {/* glass facade shell */}
        <mesh
          name={`${floor.specName}_Glass`}
          geometry={geo.glass}
          material={glassMat}
          position={[0, glassCenterY, 0]}
          renderOrder={1}
        />

        {/* glowing outline shown on hover */}
        <lineSegments
          geometry={geo.glassEdges}
          material={outlineMat}
          position={[0, glassCenterY, 0]}
          renderOrder={3}
        />

        {floor.kind === 'commercial' ? (
          <Commercial building={building} geo={geo} floor={floor} />
        ) : (
          <>
            {floor.apartments.map((apt) => (
              <ApartmentMesh key={apt.id} apt={apt} />
            ))}

            {/* cantilevered balconies with glass railings */}
            {balconies.map((apt) => {
              const cx = (apt.bounds.min[0] + apt.bounds.max[0]) / 2;
              const w = (apt.bounds.max[0] - apt.bounds.min[0]) * 0.74;
              const zFront = building.depth / 2;
              return (
                <group key={`bal-${apt.id}`} name={`${apt.id}_Balcony`}>
                  <mesh
                    geometry={unitBox()}
                    material={mats.slab}
                    scale={[w, 0.14, 1.5]}
                    position={[cx, SLAB + 0.07, zFront + 0.75]}
                    castShadow
                  />
                  <mesh
                    geometry={unitBox()}
                    material={mats.railing}
                    scale={[w, 0.95, 0.05]}
                    position={[cx, SLAB + 0.62, zFront + 1.47]}
                    renderOrder={1}
                  />
                  <mesh
                    geometry={unitBox()}
                    material={mats.railCap}
                    scale={[w, 0.07, 0.11]}
                    position={[cx, SLAB + 1.1, zFront + 1.47]}
                  />
                  <mesh
                    geometry={unitBox()}
                    material={mats.railCap}
                    scale={[0.07, 0.95, 0.09]}
                    position={[cx - w / 2, SLAB + 0.62, zFront + 1.47]}
                  />
                  <mesh
                    geometry={unitBox()}
                    material={mats.railCap}
                    scale={[0.07, 0.95, 0.09]}
                    position={[cx + w / 2, SLAB + 0.62, zFront + 1.47]}
                  />
                </group>
              );
            })}

            <FloorInterior floor={floor} building={building} />
          </>
        )}
      </group>
    </group>
  );
}
