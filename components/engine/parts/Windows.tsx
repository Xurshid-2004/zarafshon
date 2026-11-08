'use client';

import BoxInstances from '../BoxInstances';
import { animOf, partMaterials, tag, type PartProps } from './shared';

/**
 * Curtain wall: vision glass, the ground-floor shopfront, real mullion and
 * transom geometry, and the interior volume the glass sits in front of.
 */
export default function Windows(props: PartProps) {
  const { layout, theme } = props;
  const { scene, eng } = partMaterials(theme);
  const w = layout.windows;
  return (
    <group name={tag(layout, 'Windows')}>
      <BoxInstances
        name={tag(layout, 'Interior')}
        boxes={w.interior}
        material={eng.interior}
        castShadow={false}
        {...animOf(props, 'windows.interior')}
      />
      <BoxInstances name={tag(layout, 'Mullions')} boxes={w.mullions} material={eng.mullion} {...animOf(props, 'windows.mullions')} />
      <BoxInstances name={tag(layout, 'Transoms')} boxes={w.transoms} material={eng.mullion} {...animOf(props, 'windows.transoms')} />
      <BoxInstances
        name={tag(layout, 'Glass')}
        boxes={w.glass}
        material={eng.glass}
        castShadow={false}
        receiveShadow={false}
        renderOrder={1}
        {...animOf(props, 'windows.glass')}
      />
      <BoxInstances
        name={tag(layout, 'ShopGlass')}
        boxes={w.shopGlass}
        material={scene.shopGlass}
        castShadow={false}
        receiveShadow={false}
        renderOrder={1}
        {...animOf(props, 'windows.shopGlass')}
      />
    </group>
  );
}
