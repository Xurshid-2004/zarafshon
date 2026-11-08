'use client';

import { Html } from '@react-three/drei';
import { t, type TKey } from '@/lib/i18n';
import { useApp } from '@/lib/store';
import { AMENITIES } from './siteLayout';

const KEY: Record<string, TKey> = {
  playground: 'amenityPlayground',
  parking: 'amenityParking',
  green: 'amenityGreen',
  shops: 'amenityShops',
};

/**
 * Single in-canvas label for the hovered amenity. One subscriber for the whole
 * scene, so hovering never re-renders the buildings.
 */
export default function HoverLabel() {
  const hovered = useApp((s) => s.hoveredAmenity);
  const lang = useApp((s) => s.lang);
  const phase = useApp((s) => s.phase);

  if (!hovered || phase !== 'ready') return null;
  const spot = AMENITIES.find((a) => a.id === hovered);
  if (!spot) return null;

  return (
    <Html position={[spot.x, spot.y, spot.z]} center distanceFactor={34} zIndexRange={[40, 0]}>
      <div className="pointer-events-none select-none whitespace-nowrap rounded-full border border-white/15 bg-ink-900/80 px-3 py-1 text-[11px] font-medium uppercase tracking-arch text-bone-50 shadow-glass backdrop-blur-md">
        {t(lang, KEY[hovered])}
      </div>
    </Html>
  );
}
