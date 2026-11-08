'use client';

import { t } from '@/lib/i18n';
import { useApp } from '@/lib/store';
import { LABEL, PANEL, cx } from '@/lib/ui';

export default function ControlsHint() {
  const lang = useApp((s) => s.lang);
  const phase = useApp((s) => s.phase);
  const selectedApartment = useApp((s) => s.selectedApartment);

  return (
    <div
      className={cx(
        'pointer-events-none absolute bottom-4 right-4 z-20 hidden transition-opacity duration-700 lg:block',
        phase === 'ready' && !selectedApartment ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div className={cx(PANEL, 'px-4 py-3')}>
        <p className={LABEL}>{t(lang, 'controlsTitle')}</p>
        <ul className="mt-2 space-y-1 text-[11px] opacity-75">
          <li>{t(lang, 'ctrlRotate')}</li>
          <li>{t(lang, 'ctrlZoom')}</li>
          <li>{t(lang, 'ctrlPan')}</li>
        </ul>
      </div>
    </div>
  );
}
