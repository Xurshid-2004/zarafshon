'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { FLOOR_HEIGHT, SLAB, TL, floorDelay } from '@/lib/buildingConfig';
import { introTimeline } from '@/lib/introTimeline';
import { useApp } from '@/lib/store';
import type { BuildingData } from '@/lib/types';
import Floor from './Floor';
import { disposeBuildingGeo, makeBuildingGeo } from './buildingGeo';
import { getMaterials, unitBox } from './materials';

/** Distance past which balcony detail is dropped (simple LOD budget). */
const BALCONY_LOD = 118;

export default function Building({ data }: { data: BuildingData }) {
  const theme = useApp((s) => s.theme);
  const mats = getMaterials(theme);
  const camera = useThree((s) => s.camera);

  const geo = useMemo(() => makeBuildingGeo(data), [data]);
  useEffect(() => () => disposeBuildingGeo(geo), [geo]);

  const roofRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const centre = useMemo(
    () => new THREE.Vector3(data.position[0], data.height / 2, data.position[2]),
    [data],
  );

  // Roof crown lands right after the top storey.
  useEffect(() => {
    const g = roofRef.current;
    if (!g) return;
    const d = floorDelay(data, data.floorsCount) + 0.3;
    g.position.set(0, data.height + 5, 0);
    g.scale.setScalar(0.9);
    const tl = introTimeline();
    tl.to(g.position, { y: data.height, duration: 0.5, ease: 'power3.out' }, d);
    tl.to(g.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'power3.out' }, d);
  }, [data]);

  // LOD: hide balcony groups when the camera pulls far back.
  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const far = camera.position.distanceTo(centre) > BALCONY_LOD;
    g.traverse((o) => {
      if (o.name.endsWith('_Balcony') && o.visible === far) o.visible = !far;
    });
  });

  return (
    <group ref={groupRef} name={`Building_${data.id}`} position={data.position}>
      {data.floors.map((floor) => (
        <Floor key={floor.id} floor={floor} building={data} geo={geo} />
      ))}

      {/* roof: slab, parapet ring and a plant room */}
      <group ref={roofRef} name={`Building_${data.id}_Roof`}>
        <mesh geometry={geo.roofSlab} material={mats.roof} position={[0, 0.16, 0]} castShadow receiveShadow />
        <mesh
          geometry={geo.parapet}
          material={mats.railCap}
          position={[0, 0.8, data.depth / 2 + 0.14]}
        />
        <mesh
          geometry={geo.parapet}
          material={mats.railCap}
          position={[0, 0.8, -data.depth / 2 - 0.14]}
        />
        <mesh
          geometry={geo.parapet}
          material={mats.railCap}
          rotation={[0, Math.PI / 2, 0]}
          scale={[(data.depth + 0.5) / (data.width + 0.5), 1, 1]}
          position={[data.width / 2 + 0.14, 0.8, 0]}
        />
        <mesh
          geometry={geo.parapet}
          material={mats.railCap}
          rotation={[0, Math.PI / 2, 0]}
          scale={[(data.depth + 0.5) / (data.width + 0.5), 1, 1]}
          position={[-data.width / 2 - 0.14, 0.8, 0]}
        />
        <mesh
          geometry={geo.plant}
          material={mats.core}
          position={[0, 1.25, -data.depth * 0.5 + 2.4]}
          castShadow
        />
        {/* aviation / crown lighting */}
        <mesh
          geometry={unitBox()}
          material={mats.lampGlow}
          scale={[0.3, 0.3, 0.3]}
          position={[data.width / 2 - 0.5, 1.5, data.depth / 2 - 0.5]}
        />
        <mesh
          geometry={unitBox()}
          material={mats.lampGlow}
          scale={[0.3, 0.3, 0.3]}
          position={[-data.width / 2 + 0.5, 1.5, data.depth / 2 - 0.5]}
        />
      </group>
    </group>
  );
}
