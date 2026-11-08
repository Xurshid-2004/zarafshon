'use client';

import BoxInstances from '../BoxInstances';
import { animOf, partMaterials, tag, type PartProps } from './shared';

/** Structural frame: the column grid on every storey and the lift / stair core. */
export default function Columns(props: PartProps) {
  const { layout, theme } = props;
  const { scene } = partMaterials(theme);
  return (
    <group name={tag(layout, 'Structure')}>
      <BoxInstances
        name={tag(layout, 'Columns')}
        boxes={layout.structure.columns}
        material={scene.slab}
        {...animOf(props, 'structure.columns')}
      />
      <BoxInstances
        name={tag(layout, 'Core')}
        boxes={layout.structure.core}
        material={scene.core}
        {...animOf(props, 'structure.core')}
      />
    </group>
  );
}
