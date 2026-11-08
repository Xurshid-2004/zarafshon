'use client';

// ============================================================================
//  Photoreal entry screen.
//
//  It also gates the WebGL canvas: SceneShell only mounts <SceneCanvas /> once
//  `entered` flips, so the 5-second construction sequence plays for someone who
//  is actually watching instead of running behind a loading screen.
// ============================================================================

import { AnimatePresence, motion } from 'framer-motion';
import { SITE_STATS } from '@/lib/buildingConfig';
import { formatUsd } from '@/lib/format';
import { t } from '@/lib/i18n';
import { fullSrc, HERO_SHOT } from '@/lib/renders';
import { useApp } from '@/lib/store';
import { cx } from '@/lib/ui';

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-[88px]">
      <p className="font-mono text-xl font-semibold tabular-nums text-bone-50 sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-arch text-bone-50/50">{label}</p>
    </div>
  );
}

export default function HeroScreen() {
  const lang = useApp((s) => s.lang);
  const entered = useApp((s) => s.entered);
  const enter = useApp((s) => s.enter);
  const toggleLang = useApp((s) => s.toggleLang);
  const setGalleryOpen = useApp((s) => s.setGalleryOpen);

  return (
    <AnimatePresence>
      {!entered && (
        <motion.div
          key="hero"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.75, ease: 'easeInOut' }}
          className="absolute inset-0 z-[60] overflow-hidden bg-ink-900"
        >
          {/* backdrop */}
          <motion.img
            src={fullSrc(HERO_SHOT)}
            alt={lang === 'uz' ? HERO_SHOT.uz : HERO_SHOT.ru}
            fetchPriority="high"
            initial={{ scale: 1.02 }}
            animate={{ scale: 1.1 }}
            transition={{ duration: 24, ease: 'linear' }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/55 to-ink-900/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-900/80 via-transparent to-transparent" />

          {/* language switch */}
          <button
            type="button"
            onClick={toggleLang}
            className="absolute right-5 top-5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-medium uppercase tracking-arch text-bone-50 backdrop-blur-md transition hover:bg-white/15 sm:right-8 sm:top-8"
          >
            {lang === 'uz' ? 'UZ' : 'RU'}
          </button>

          {/* content */}
          <div className="relative flex h-full flex-col justify-end p-6 sm:p-12 lg:p-16">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
              className="max-w-2xl"
            >
              <div className="flex items-center gap-3">
                <span className="block h-[2px] w-10 bg-bronze-500" />
                <p className="text-[10px] font-medium uppercase tracking-arch text-bronze-400">
                  {t(lang, 'heroEyebrow')}
                </p>
              </div>

              <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-bone-50 sm:text-6xl lg:text-7xl">
                {t(lang, 'brand')}
              </h1>
              <p className="mt-3 max-w-md text-sm text-bone-50/65 sm:text-base">
                {t(lang, 'tagline')}
              </p>

              <div className="mt-8 flex flex-wrap gap-x-10 gap-y-5">
                <Figure value="2" label={t(lang, 'buildingsTitle')} />
                <Figure value="7 / 11" label={t(lang, 'floorsTitle')} />
                <Figure value={String(SITE_STATS.total)} label={t(lang, 'totalUnits')} />
                <Figure
                  value={formatUsd(SITE_STATS.minPrice, lang)}
                  label={t(lang, 'priceFromShort')}
                />
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={enter}
                  className={cx(
                    'group inline-flex items-center gap-3 rounded-xl bg-bronze-500 px-6 py-3.5',
                    'text-[11px] font-semibold uppercase tracking-arch text-ink-900',
                    'transition hover:bg-bronze-400 active:scale-[0.98]',
                  )}
                >
                  {t(lang, 'enterScene')}
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGalleryOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-[11px] font-medium uppercase tracking-arch text-bone-50 backdrop-blur-md transition hover:bg-white/15"
                >
                  {t(lang, 'gallery')}
                </button>
              </div>

              <p className="mt-6 text-[10px] leading-snug text-bone-50/35">
                {t(lang, 'renderDisclaimer')}
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
