'use client';

import BoxInstances from '../BoxInstances';
import { animOf, partMaterials, tag, type PartProps } from './shared';

/** Recessed lobby entrance: cheeks, soffit, door screen, canopy, lit name strip, steps. */
export default function Entrance(props: PartProps) {
  const { layout, theme } = props;
  const { scene, eng } = partMaterials(theme);
  const e = layout.entrance;
  return (
    <group name={tag(layout, 'Entrance')}>
      <BoxInstances name={tag(layout, 'EntranceWalls')} boxes={e.walls} material={scene.concrete} {...animOf(props, 'entrance.walls')} />
      <BoxInstances name={tag(layout, 'EntranceSoffit')} boxes={e.ceiling} material={scene.slab} {...animOf(props, 'entrance.ceiling')} />
      <BoxInstances name={tag(layout, 'EntranceFrames')} boxes={e.frames} material={eng.mullion} {...animOf(props, 'entrance.frames')} />
      <BoxInstances name={tag(layout, 'Canopy')} boxes={e.canopy} material={eng.fin} {...animOf(props, 'entrance.canopy')} />
      <BoxInstances
        name={tag(layout, 'Sign')}
        boxes={e.sign}
        material={eng.sign}
        castShadow={false}
        {...animOf(props, 'entrance.sign')}
      />
      <BoxInstances
        name={tag(layout, 'Downlights')}
        boxes={e.lights}
        material={scene.lampGlow}
        castShadow={false}
        {...animOf(props, 'entrance.lights')}
      />
      <BoxInstances name={tag(layout, 'Steps')} boxes={e.steps} material={scene.concrete} {...animOf(props, 'entrance.steps')} />
      <BoxInstances
        name={tag(layout, 'DoorGlass')}
        boxes={e.glass}
        material={scene.shopGlass}
        castShadow={false}
        receiveShadow={false}
        renderOrder={1}
        {...animOf(props, 'entrance.glass')}
      />
    </group>
  );
}
