import { getMaterials } from '@/components/scene/materials';
import type { Theme } from '@/lib/types';
import { getEngineMaterials, getWorldUvMaterials } from '../engineMaterials';
import type { TowerLayout } from '../layout';
import type { InstanceAnim, LayoutSchedule, ProgressSource } from '../schedule';

export interface PartProps {
  layout: TowerLayout;
  theme: Theme;
  /** Present only when the tower is driven by the construction sequence. */
  schedule?: LayoutSchedule;
  source?: ProgressSource;
}

/** Shared scene materials (PBR concrete, wood, glass) plus the engine set. */
export function partMaterials(theme: Theme) {
  return { scene: { ...getMaterials(theme), ...getWorldUvMaterials(theme) }, eng: getEngineMaterials(theme) };
}

export const tag = (layout: TowerLayout, part: string) => `Tower_${layout.spec.id}_${part}`;

/** Spread into <BoxInstances>: animation props for one layout group, or nothing. */
export function animOf(
  props: PartProps,
  group: string,
): { anim?: InstanceAnim; source?: ProgressSource } {
  if (!props.schedule || !props.source) return {};
  return { anim: props.schedule.get(group), source: props.source };
}
