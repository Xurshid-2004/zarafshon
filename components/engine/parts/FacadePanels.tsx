'use client';

import BoxInstances from '../BoxInstances';
import { animOf, partMaterials, tag, type PartProps } from './shared';

/** Timber spandrel bands at every slab edge, dark vertical fins and corner frames. */
export default function FacadePanels(props: PartProps) {
  const { layout, theme } = props;
  const { scene, eng } = partMaterials(theme);
  return (
    <group name={tag(layout, 'Facade')}>
      <BoxInstances
        name={tag(layout, 'Spandrels')}
        boxes={layout.facade.spandrels}
        material={scene.wood}
        {...animOf(props, 'facade.spandrels')}
      />
      <BoxInstances name={tag(layout, 'Fins')} boxes={layout.facade.fins} material={eng.fin} {...animOf(props, 'facade.fins')} />
      {theme === 'dark' && (
        <BoxInstances
          name={tag(layout, 'FacadeLights')}
          boxes={layout.facade.lights}
          material={eng.uplight}
          castShadow={false}
          receiveShadow={false}
          {...animOf(props, 'facade.lights')}
        />
      )}
    </group>
  );
}
