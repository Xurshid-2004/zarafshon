'use client';

import { useMemo } from 'react';
import type { TowerSpec } from '@/lib/architecture';
import type { BuildingData, Theme } from '@/lib/types';
import { buildTowerLayout, layoutGroups, slotsFromBuilding } from './layout';
import { scheduleGroups, type ProgressSource } from './schedule';
import Balconies from './parts/Balconies';
import Columns from './parts/Columns';
import Entrance from './parts/Entrance';
import FacadePanels from './parts/FacadePanels';
import FloorSlabs from './parts/FloorSlabs';
import Foundation from './parts/Foundation';
import Roof from './parts/Roof';
import Windows from './parts/Windows';

export type PartKey =
  | 'foundation'
  | 'structure'
  | 'slabs'
  | 'windows'
  | 'facade'
  | 'balconies'
  | 'entrance'
  | 'roof';

export const PART_KEYS: PartKey[] = [
  'foundation',
  'structure',
  'slabs',
  'windows',
  'facade',
  'balconies',
  'entrance',
  'roof',
];

export type PartVisibility = Record<PartKey, boolean>;
export const ALL_PARTS: PartVisibility = Object.fromEntries(PART_KEYS.map((k) => [k, true])) as PartVisibility;

/**
 * One complete procedural tower. Static: every part is instanced and drawn
 * from the layout, each part can be toggled on its own.
 */
export default function Tower({
  spec,
  data,
  theme,
  parts = ALL_PARTS,
  source,
}: {
  spec: TowerSpec;
  /** Unit data; balconies follow each apartment's `balcony` flag. */
  data: BuildingData;
  theme: Theme;
  parts?: PartVisibility;
  /** Construction progress (0..1). Omit for the finished, static tower. */
  source?: ProgressSource;
}) {
  const layout = useMemo(() => buildTowerLayout(spec, slotsFromBuilding(data), theme === 'dark'), [spec, data, theme]);
  const schedule = useMemo(
    () => (source ? scheduleGroups(layoutGroups(layout)) : undefined),
    [layout, source],
  );
  const p = { layout, theme, schedule, source };

  return (
    <group name={`Building_${spec.id}`} position={spec.position} userData={{ engine: true, spec }}>
      {parts.foundation && <Foundation {...p} />}
      {parts.structure && <Columns {...p} />}
      {parts.slabs && <FloorSlabs {...p} />}
      {parts.windows && <Windows {...p} />}
      {parts.facade && <FacadePanels {...p} />}
      {parts.balconies && <Balconies {...p} />}
      {parts.entrance && <Entrance {...p} />}
      {parts.roof && <Roof {...p} />}
    </group>
  );
}
