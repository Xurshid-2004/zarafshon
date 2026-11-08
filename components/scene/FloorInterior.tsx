'use client';

import { useMemo } from 'react';
import { BP_H, BP_W, SLAB } from '@/lib/buildingConfig';
import { useApp } from '@/lib/store';
import type { Apartment, BuildingData, FloorData, RoomRect } from '@/lib/types';
import { getMaterials, unitBox } from './materials';

const WALL_T = 0.11;
const WALL_H = 1.25;

interface Seg {
  cx: number;
  cz: number;
  len: number;
  axis: 'x' | 'z';
}

/** Blueprint rectangles -> de-duplicated wall segments in building-local space. */
function wallsFor(apt: Apartment, building: BuildingData): Seg[] {
  const x0 = apt.bounds.min[0] + 0.12;
  const x1 = apt.bounds.max[0] - 0.12;
  const zF = building.depth * 0.42;
  const zB = -building.depth * 0.3;

  const mx = (bx: number) => x0 + (bx / BP_W) * (x1 - x0);
  const mz = (by: number) => zF - (by / BP_H) * (zF - zB);

  const seen = new Set<string>();
  const out: Seg[] = [];

  const add = (ax: number, az: number, bx: number, bz: number) => {
    const key = [ax, az, bx, bz].map((v) => v.toFixed(2)).join('|');
    const keyR = [bx, bz, ax, az].map((v) => v.toFixed(2)).join('|');
    if (seen.has(key) || seen.has(keyR)) return;
    seen.add(key);

    if (Math.abs(az - bz) < 0.01) {
      out.push({ cx: (ax + bx) / 2, cz: az, len: Math.abs(bx - ax), axis: 'x' });
    } else {
      out.push({ cx: ax, cz: (az + bz) / 2, len: Math.abs(bz - az), axis: 'z' });
    }
  };

  for (const r of apt.layout) {
    if (r.kind === 'balcony') continue;
    const ax = mx(r.x);
    const bx = mx(r.x + r.w);
    const az = mz(r.y);
    const bz = mz(r.y + r.h);
    add(ax, az, bx, az);
    add(ax, bz, bx, bz);
    add(ax, az, ax, bz);
    add(bx, az, bx, bz);
  }

  return out;
}

interface Furniture {
  cx: number;
  cz: number;
  w: number;
  h: number;
  d: number;
}

function furnitureFor(apt: Apartment, building: BuildingData): Furniture[] {
  const x0 = apt.bounds.min[0] + 0.12;
  const x1 = apt.bounds.max[0] - 0.12;
  const zF = building.depth * 0.42;
  const zB = -building.depth * 0.3;
  const mx = (bx: number) => x0 + (bx / BP_W) * (x1 - x0);
  const mz = (by: number) => zF - (by / BP_H) * (zF - zB);

  const out: Furniture[] = [];
  const spec: Partial<Record<RoomRect['kind'], [number, number, number]>> = {
    living: [0.62, 0.42, 0.34],
    bedroom: [0.58, 0.45, 0.46],
    kitchen: [0.74, 0.9, 0.26],
    bath: [0.5, 0.5, 0.4],
  };

  for (const r of apt.layout) {
    const s = spec[r.kind];
    if (!s) continue;
    const cx = mx(r.x + r.w / 2);
    const cz = mz(r.y + r.h / 2);
    const fullW = Math.abs(mx(r.x + r.w) - mx(r.x));
    const fullD = Math.abs(mz(r.y + r.h) - mz(r.y));
    out.push({ cx, cz, w: fullW * s[0], h: s[1], d: fullD * s[2] });
  }

  return out;
}

/**
 * Interior layout for the isolated floor: partition walls, floor finish and
 * blocked-out furniture. Rendered only while the floor is open and the user
 * has asked for the plan, so at most five units are in the scene at once.
 */
export default function FloorInterior({
  floor,
  building,
}: {
  floor: FloorData;
  building: BuildingData;
}) {
  const theme = useApp((s) => s.theme);
  const show = useApp((s) => s.showInterior);
  const selBuilding = useApp((s) => s.selectedBuilding);
  const selFloor = useApp((s) => s.selectedFloor);

  const isOpen = selBuilding === floor.building && selFloor === floor.level;
  const mats = getMaterials(theme);

  const data = useMemo(
    () =>
      floor.apartments.map((apt) => ({
        apt,
        walls: wallsFor(apt, building),
        furniture: furnitureFor(apt, building),
      })),
    [floor.apartments, building],
  );

  if (!show || !isOpen) return null;

  return (
    <group name={`${floor.specName}_Interior`}>
      {data.map(({ apt, walls, furniture }) => {
        const w = apt.bounds.max[0] - apt.bounds.min[0] - 0.24;
        const cx = (apt.bounds.min[0] + apt.bounds.max[0]) / 2;
        const zF = building.depth * 0.42;
        const zB = -building.depth * 0.3;

        return (
          <group key={`int-${apt.id}`} name={`${apt.id}_Plan`}>
            {/* floor finish */}
            <mesh
              geometry={unitBox()}
              material={mats.floorFinish}
              scale={[w, 0.03, zF - zB]}
              position={[cx, SLAB + 0.02, (zF + zB) / 2]}
              receiveShadow
            />

            {walls.map((s, i) => (
              <mesh
                key={`w-${i}`}
                geometry={unitBox()}
                material={mats.interiorWall}
                scale={
                  s.axis === 'x' ? [s.len, WALL_H, WALL_T] : [WALL_T, WALL_H, s.len]
                }
                position={[s.cx, SLAB + 0.03 + WALL_H / 2, s.cz]}
                castShadow
              />
            ))}

            {furniture.map((f, i) => (
              <mesh
                key={`f-${i}`}
                geometry={unitBox()}
                material={mats.furniture}
                scale={[f.w, f.h, f.d]}
                position={[f.cx, SLAB + 0.04 + f.h / 2, f.cz]}
                castShadow
              />
            ))}
          </group>
        );
      })}
    </group>
  );
}
