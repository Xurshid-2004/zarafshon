'use client';

import { SITE_STATS } from '@/lib/buildingConfig';
import { formatUsd } from '@/lib/format';
import { t } from '@/lib/i18n';
import { useApp } from '@/lib/store';
import { BTN, CHIP, LABEL, PANEL, cx } from '@/lib/ui';

export default function TopBar() {
  const lang = useApp((s) => s.lang);
  const theme = useApp((s) => s.theme);
  const toggleLang = useApp((s) => s.toggleLang);
  const toggleTheme = useApp((s) => s.toggleTheme);
  const resetView = useApp((s) => s.resetView);
  const phase = useApp((s) => s.phase);
  const setGalleryOpen = useApp((s) => s.setGalleryOpen);

  return (
    <header
      className={cx(
        'pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-4 p-4 transition-opacity duration-700 sm:p-6',
        phase === 'ready' ? 'opacity-100' : 'opacity-0',
      )}
    >
      {/* brand */}
      <div className={cx(PANEL, 'pointer-events-auto px-4 py-3 sm:px-5')}>
        <div className="flex items-center gap-3">
          <span className="block h-7 w-[3px] rounded-full bg-bronze-500" />
          <div>
            <h1 className="text-[13px] font-semibold uppercase tracking-arch sm:text-sm">
              {t(lang, 'brand')}
            </h1>
            <p className={cx(LABEL, 'mt-0.5 normal-case tracking-normal')}>{t(lang, 'tagline')}</p>
          </div>
        </div>
      </div>

      {/* stats + controls */}
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <div className={cx(PANEL, 'flex items-center gap-1.5 p-1.5')}>
          <button
            type="button"
            onClick={toggleLang}
            className={cx(BTN, 'min-w-[58px] uppercase tracking-arch')}
            aria-label="Language"
          >
            {lang === 'uz' ? 'UZ' : 'RU'}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className={cx(BTN, 'min-w-[44px]')}
            title={theme === 'dark' ? t(lang, 'themeLight') : t(lang, 'themeDark')}
            aria-label="Theme"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            className={BTN}
          >
            {t(lang, 'gallery')}
          </button>
          <button type="button" onClick={resetView} className={BTN}>
            {t(lang, 'resetView')}
          </button>
        </div>

        <div className={cx(PANEL, 'hidden items-center gap-2 px-3 py-2 sm:flex')}>
          <span className={CHIP}>
            {t(lang, 'totalUnits')}: <b className="font-semibold">{SITE_STATS.total}</b>
          </span>
          <span className={cx(CHIP, 'text-status-available')}>
            {t(lang, 'availableUnits')}: <b className="font-semibold">{SITE_STATS.available}</b>
          </span>
          <span className={CHIP}>
            {t(lang, 'priceFrom')} {lang === 'ru' ? t(lang, 'from') + ' ' : ''}
            <b className="font-semibold">{formatUsd(SITE_STATS.minPrice, lang)}</b>
            {lang === 'uz' ? ' ' + t(lang, 'from') : ''}
          </span>
        </div>
      </div>
    </header>
  );
}
