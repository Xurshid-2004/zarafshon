'use client';

import BoxInstances from '../BoxInstances';
import { animOf, partMaterials, tag, type PartProps } from './shared';

/** One reinforced-concrete slab per storey. */
export default function FloorSlabs(props: PartProps) {
  const { layout, theme } = props;
  const { scene } = partMaterials(theme);
  return (
    <BoxInstances name={tag(layout, 'Slabs')} boxes={layout.slabs} material={scene.slab} {...animOf(props, 'slabs')} />
  );
}
