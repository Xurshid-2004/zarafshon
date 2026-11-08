'use client';

import { BP_H, BP_W } from '@/lib/buildingConfig';
import { roomKindLabel } from '@/lib/i18n';
import { useApp } from '@/lib/store';
import type { Apartment, RoomKind } from '@/lib/types';

const FILL: Record<RoomKind, string> = {
  living: '#D9C7A8',
  bedroom: '#C6D2DE',
  kitchen: '#CBDCC4',
  bath: '#B9D4DE',
  hall: '#DBD7CF',
  balcony: '#E8E4DA',
};

/** Interactive 2D plan generated from the same rectangles as the 3D interior. */
export default function Blueprint2D({ apt }: { apt: Apartment }) {
  const lang = useApp((s) => s.lang);
  const unit = apt.area / (BP_W * BP_H);

  return (
    <svg
      viewBox={`-5 -5 ${BP_W + 10} ${BP_H + 20}`}
      className="h-auto w-full"
      role="img"
      aria-label={`${apt.id} plan`}
    >
      <rect
        x={-1}
        y={-1}
        width={BP_W + 2}
        height={BP_H + 2}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.35}
        strokeWidth={1.6}
      />

      {apt.layout.map((r, i) => {
        const area = r.w * r.h * unit;
        const isBalcony = r.kind === 'balcony';
        const cx = r.x + r.w / 2;
        const cy = r.y + r.h / 2;
        const showLabel = r.w > 16 && r.h > 12;

        return (
          <g key={i}>
            <rect
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              fill={FILL[r.kind]}
              fillOpacity={isBalcony ? 0.45 : 0.9}
              stroke="#2B2B2B"
              strokeOpacity={0.55}
              strokeWidth={isBalcony ? 0.7 : 1.1}
              strokeDasharray={isBalcony ? '2.5 2' : undefined}
            />
            {showLabel && (
              <>
                <text
                  x={cx}
                  y={cy - 1.4}
                  textAnchor="middle"
                  fontSize={4.2}
                  fill="#1C1C1C"
                  fillOpacity={0.85}
                  style={{ fontWeight: 600 }}
                >
                  {roomKindLabel(r.kind, lang)}
                </text>
                <text
                  x={cx}
                  y={cy + 4.2}
                  textAnchor="middle"
                  fontSize={3.6}
                  fill="#1C1C1C"
                  fillOpacity={0.6}
                >
                  {area.toFixed(1)} m²
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* orientation note: the facade is at the bottom of the plan */}
      <text
        x={BP_W / 2}
        y={BP_H + 14}
        textAnchor="middle"
        fontSize={4}
        fill="currentColor"
        fillOpacity={0.5}
      >
        {lang === 'uz' ? 'Fasad tomoni' : 'Сторона фасада'} ↓
      </text>
    </svg>
  );
}
