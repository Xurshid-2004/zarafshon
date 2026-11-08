'use client';

import { crossedQuads } from '@/components/scene/materials';
import BoxInstances from '../BoxInstances';
import { animOf, partMaterials, tag, type PartProps } from './shared';

/** Cantilevered balconies: slab, fascia, frameless glass balustrade, rail cap, planters. */
export default function Balconies(props: PartProps) {
  const { layout, theme } = props;
  const { scene, eng } = partMaterials(theme);
  const b = layout.balconies;
  return (
    <group name={tag(layout, 'Balconies')}>
      <BoxInstances name={tag(layout, 'BalconySlabs')} boxes={b.slabs} material={scene.slab} {...animOf(props, 'balconies.slabs')} />
      <BoxInstances name={tag(layout, 'BalconyFascia')} boxes={b.fascia} material={eng.fin} {...animOf(props, 'balconies.fascia')} />
      <BoxInstances name={tag(layout, 'BalconyRails')} boxes={b.rails} material={eng.mullion} {...animOf(props, 'balconies.rails')} />
      <BoxInstances name={tag(layout, 'Planters')} boxes={b.planters} material={eng.planter} {...animOf(props, 'balconies.planters')} />
      <BoxInstances name={tag(layout, 'Foliage')} boxes={b.foliage} material={scene.foliage} geometry={crossedQuads(2)} {...animOf(props, 'balconies.foliage')} />
      <BoxInstances
        name={tag(layout, 'BalconyGlass')}
        boxes={b.glass}
        material={scene.railing}
        castShadow={false}
        receiveShadow={false}
        renderOrder={2}
        {...animOf(props, 'balconies.glass')}
      />
    </group>
  );
}
