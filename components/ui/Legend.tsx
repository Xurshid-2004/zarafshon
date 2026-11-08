'use client';

import { SITE_STATS } from '@/lib/buildingConfig';
import { t } from '@/lib/i18n';
import { useApp } from '@/lib/store';
import { LABEL, PANEL, STATUS_DOT, cx } from '@/lib/ui';

const ROWS = [
  { key: 'available', count: SITE_STATS.available },
  { key: 'reserved', count: SITE_STATS.reserved },
  { key: 'sold', count: SITE_STATS.sold },
] as const;

export default function Legend() {
  const lang = useApp((s) => s.lang);
  const phase = useApp((s) => s.phase);

  return (
    <div
      className={cx(
        'pointer-events-none absolute bottom-4 left-4 z-30 transition-opacity duration-700 sm:bottom-6 sm:left-6',
        phase === 'ready' ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div className={cx(PANEL, 'pointer-events-auto px-4 py-3')}>
        <p className={LABEL}>{t(lang, 'legend')}</p>
        <ul className="mt-2 space-y-1.5">
          {ROWS.map((r) => (
            <li key={r.key} className="flex items-center gap-2.5 text-xs">
              <span className={cx('h-2 w-2 shrink-0 rounded-full', STATUS_DOT[r.key])} />
              <span className="flex-1">{t(lang, r.key)}</span>
              <span className="font-mono text-[11px] opacity-60">{r.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
