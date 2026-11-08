'use client';

import BoxInstances from '../BoxInstances';
import { animOf, partMaterials, tag, type PartProps } from './shared';

/** Roof slab, parapet crown, plant room and aviation lights. */
export default function Roof(props: PartProps) {
  const { layout, theme } = props;
  const { scene, eng } = partMaterials(theme);
  const r = layout.roof;
  return (
    <group name={tag(layout, 'Roof')}>
      <BoxInstances name={tag(layout, 'RoofSlab')} boxes={r.slab} material={scene.roof} {...animOf(props, 'roof.slab')} />
      <BoxInstances name={tag(layout, 'Parapet')} boxes={r.parapet} material={eng.fin} {...animOf(props, 'roof.parapet')} />
      <BoxInstances name={tag(layout, 'PlantRoom')} boxes={r.plant} material={scene.core} {...animOf(props, 'roof.plant')} />
      <BoxInstances
        name={tag(layout, 'RoofLights')}
        boxes={r.lights}
        material={scene.lampGlow}
        castShadow={false}
        {...animOf(props, 'roof.lights')}
      />
    </group>
  );
}
