'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { TL } from '@/lib/buildingConfig';
import { skipIntroTimeline } from '@/lib/introTimeline';
import { t, type TKey } from '@/lib/i18n';
import { useApp } from '@/lib/store';
import { cx } from '@/lib/ui';

const STEPS: { until: number; key: TKey }[] = [
  { until: 1.0, key: 'introStep1' },
  { until: 2.2, key: 'introStep2' },
  { until: 3.0, key: 'introStep3' },
  { until: 4.5, key: 'introStep4' },
  { until: Infinity, key: 'introStep5' },
];

export default function IntroOverlay() {
  const lang = useApp((s) => s.lang);
  const phase = useApp((s) => s.phase);
  const setPhase = useApp((s) => s.setPhase);
  const entered = useApp((s) => s.entered);

  const [elapsed, setElapsed] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (!entered) return;
    // the shared GSAP timeline is created by the scene; mirror its clock
    const start = () => {
      const tl = (window as unknown as { __introTL?: { totalTime: () => number } }).__introTL;
      return tl ? performance.now() - tl.totalTime() * 1000 : performance.now();
    };
    const t0 = start();
    const tick = () => {
      const e = (performance.now() - t0) / 1000;
      setElapsed(e);
      if (e < TL.cameraEnd + 0.3) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [entered]);

  const done = phase === 'ready';
  const progress = done ? 1 : Math.min(1, elapsed / TL.cameraEnd);
  const step = STEPS.find((s) => (done ? false : elapsed < s.until)) ?? STEPS[STEPS.length - 1];

  const skip = () => {
    skipIntroTimeline();
    setPhase('ready');
  };

  return (
    <AnimatePresence>
      {entered && !done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-0 z-50 flex items-end justify-between gap-6 p-6 sm:p-10"
        >
          {/* bottom-left: title + step */}
          <div className="max-w-sm">
            <p className="text-[10px] font-medium uppercase tracking-arch text-bone-50/50">
              {t(lang, 'loading')}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-bone-50 sm:text-3xl">
              {t(lang, 'brand')}
            </h2>
            <p className="mt-1 text-sm text-bone-50/60">{t(lang, 'tagline')}</p>

            <div className="mt-5 h-[3px] w-full max-w-xs overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-bronze-500 transition-[width] duration-150 ease-linear"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-mono text-[11px] tabular-nums text-bronze-400">
                {String(Math.round(progress * 100)).padStart(3, '0')}%
              </span>
              <span className="text-[11px] uppercase tracking-arch text-bone-50/60">
                {t(lang, step.key)}
              </span>
            </div>

            <ol className="mt-4 space-y-1">
              {STEPS.map((s, i) => {
                const active = s.key === step.key;
                const passed = STEPS.indexOf(step) > i;
                return (
                  <li
                    key={s.key}
                    className={cx(
                      'flex items-center gap-2 text-[10px] uppercase tracking-arch transition-colors',
                      active
                        ? 'text-bone-50'
                        : passed
                          ? 'text-bone-50/40'
                          : 'text-bone-50/20',
                    )}
                  >
                    <span
                      className={cx(
                        'h-1 w-1 rounded-full',
                        active ? 'bg-bronze-400' : passed ? 'bg-bone-50/40' : 'bg-bone-50/20',
                      )}
                    />
                    {t(lang, s.key)}
                  </li>
                );
              })}
            </ol>
          </div>

          <button
            type="button"
            onClick={skip}
            className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-medium uppercase tracking-arch text-bone-50 backdrop-blur-md transition hover:bg-white/10"
          >
            {t(lang, 'skip')} →
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
