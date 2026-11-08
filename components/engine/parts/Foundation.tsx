'use client';

import BoxInstances from '../BoxInstances';
import { animOf, partMaterials, tag, type PartProps } from './shared';

/** Raft slab, pile caps and piles below ground, plus the visible plinth ring. */
export default function Foundation(props: PartProps) {
  const { layout, theme } = props;
  const { scene } = partMaterials(theme);
  const f = layout.foundation;
  return (
    <group name={tag(layout, 'Foundation')}>
      <BoxInstances name={tag(layout, 'Raft')} boxes={f.raft} material={scene.concrete} {...animOf(props, 'foundation.raft')} />
      <BoxInstances name={tag(layout, 'PileCaps')} boxes={f.pileCaps} material={scene.concrete} {...animOf(props, 'foundation.pileCaps')} />
      <BoxInstances
        name={tag(layout, 'Piles')}
        boxes={f.piles}
        material={scene.concrete}
        castShadow={false}
        {...animOf(props, 'foundation.piles')}
      />
      <BoxInstances name={tag(layout, 'Plinth')} boxes={f.plinth} material={scene.concrete} {...animOf(props, 'foundation.plinth')} />
    </group>
  );
}
