'use client';

import type { ThreeEvent } from '@react-three/fiber';
import { useMemo } from 'react';
import { SLAB } from '@/lib/buildingConfig';
import { useApp } from '@/lib/store';
import type { BuildingData, FloorData } from '@/lib/types';
import type { BuildingGeo } from './buildingGeo';
import { getMaterials, unitBox } from './materials';

/**
 * Ground-floor retail: glazed bays with lit interiors and a signage band.
 * Hovering any bay raises the "shops" amenity label.
 */
export default function Commercial({
  building,
  geo,
  floor,
}: {
  building: BuildingData;
  geo: BuildingGeo;
  floor: FloorData;
}) {
  const theme = useApp((s) => s.theme);
  const mats = getMaterials(theme);

  const bays = useMemo(() => {
    const count = building.id === 'A' ? 4 : 5;
    const usable = building.width - 1.2;
    const w = usable / count;
    const x0 = -building.width / 2 + 0.6;
    return Array.from({ length: count }, (_, i) => ({
      i,
      cx: x0 + w * (i + 0.5),
      w: w - 0.3,
      entrance: i === Math.floor(count / 2),
    }));
  }, [building.id, building.width]);

  const zFront = building.depth / 2;
  const h = geo.innerH - 0.3;
  const cy = SLAB + h / 2 + 0.05;

  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    const s = useApp.getState();
    if (s.phase !== 'ready') return;
    s.setHoveredAmenity('shops');
  };

  const onPointerOut = () => {
    const s = useApp.getState();
    if (s.hoveredAmenity === 'shops') s.setHoveredAmenity(null);
  };

  return (
    <group
      name={`${floor.specName}_Commercial`}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      userData={{ kind: 'commercial', building: building.id, bays: bays.length }}
    >
      {bays.map((b) => (
        <group key={b.i} name={`${floor.specName}_Shop_${b.i + 1}`}>
          {/* lit interior panel, set back from the glazing */}
          <mesh
            geometry={unitBox()}
            material={mats.shopGlow}
            scale={[b.w * 0.94, h * 0.62, 0.1]}
            position={[b.cx, cy - 0.1, zFront - 1.5]}
          />

          {/* glazing */}
          <mesh
            geometry={unitBox()}
            material={mats.shopGlass}
            scale={[b.w, h, 0.08]}
            position={[b.cx, cy, zFront + 0.02]}
            renderOrder={1}
          />

          {/* mullions */}
          <mesh
            geometry={unitBox()}
            material={mats.frame}
            scale={[0.1, h, 0.14]}
            position={[b.cx - b.w / 2, cy, zFront + 0.05]}
          />
          <mesh
            geometry={unitBox()}
            material={mats.frame}
            scale={[0.1, h, 0.14]}
            position={[b.cx + b.w / 2, cy, zFront + 0.05]}
          />

          {/* signage band */}
          <mesh
            geometry={unitBox()}
            material={mats.signage}
            scale={[b.w * 0.8, 0.3, 0.12]}
            position={[b.cx, SLAB + h + 0.1, zFront + 0.12]}
          />

          {/* canopy over the main entrance */}
          {b.entrance && (
            <mesh
              geometry={unitBox()}
              material={mats.slab}
              scale={[b.w * 1.25, 0.16, 2.2]}
              position={[b.cx, SLAB + h - 0.1, zFront + 1.1]}
              castShadow
            />
          )}
        </group>
      ))}

      {/* rear service wall so the lobby is not see-through */}
      <mesh
        geometry={unitBox()}
        material={mats.core}
        scale={[building.width - 0.4, h, 0.2]}
        position={[0, cy, -building.depth / 2 + 0.3]}
      />
    </group>
  );
}
