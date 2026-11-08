'use client';

// ============================================================================
//  Photoreal render grid + lightbox.
//
//  Thumbnails are the 640 px files; the lightbox loads the 1760 px original
//  only once a shot is opened. Any image whose <img> errors is dropped from
//  the list, so a half-filled /public/renders folder degrades quietly instead
//  of showing broken frames.
// ============================================================================

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from '@/lib/i18n';
import { fullSrc, thumbSrc, type RenderShot } from '@/lib/renders';
import type { Lang } from '@/lib/types';
import { cx } from '@/lib/ui';

interface Props {
  shots: readonly RenderShot[];
  lang: Lang;
  /** Grid columns on the widest breakpoint. */
  columns?: 2 | 3;
  /** Taller first tile — used by the complex-wide gallery. */
  feature?: boolean;
}

export default function RenderGallery({ shots, lang, columns = 2, feature = false }: Props) {
  const [broken, setBroken] = useState<readonly string[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  /**
   * The drawer and the gallery modal are framer-motion elements, and a CSS
   * transform makes an ancestor the containing block for `position: fixed`.
   * Without a portal the lightbox would be clipped inside the 370 px drawer.
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const live = useMemo(() => shots.filter((s) => !broken.includes(s.file)), [shots, broken]);

  const markBroken = useCallback((file: string) => {
    setBroken((prev) => (prev.includes(file) ? prev : [...prev, file]));
  }, []);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (delta: number) => {
      setOpen((cur) => (cur === null ? null : (cur + delta + live.length) % live.length));
    },
    [live.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, step]);

  // An index can fall out of range when a neighbouring image errors late.
  useEffect(() => {
    if (open !== null && open >= live.length) setOpen(live.length > 0 ? live.length - 1 : null);
  }, [open, live.length]);

  if (live.length === 0) return null;

  const current = open === null ? null : live[open];

  return (
    <>
      <div
        className={cx(
          'grid gap-2',
          columns === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2',
        )}
      >
        {live.map((shot, i) => (
          <button
            key={shot.file}
            type="button"
            onClick={() => setOpen(i)}
            className={cx(
              'group relative overflow-hidden rounded-xl border border-black/10 bg-black/[0.04]',
              'transition hover:border-bronze-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze-500',
              'dark:border-white/10 dark:bg-white/5',
              feature && i === 0 && columns === 3 && 'col-span-2 row-span-2',
            )}
            aria-label={lang === 'uz' ? shot.uz : shot.ru}
          >
            <img
              src={thumbSrc(shot)}
              alt={lang === 'uz' ? shot.uz : shot.ru}
              loading="lazy"
              decoding="async"
              onError={() => markBroken(shot.file)}
              className="aspect-[3/2] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-6 text-left text-[10px] font-medium text-white/90">
              {lang === 'uz' ? shot.uz : shot.ru}
            </span>
          </button>
        ))}
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {current && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-8"
          >
            <motion.img
              key={current.file}
              src={fullSrc(current)}
              alt={lang === 'uz' ? current.uz : current.ru}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              onError={() => markBroken(current.file)}
              className="max-h-[78vh] max-w-full rounded-xl object-contain shadow-lift"
            />

            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-4 flex items-center gap-4 rounded-full border border-white/15 bg-white/5 px-3 py-2 backdrop-blur-md"
            >
              <button
                type="button"
                onClick={() => step(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
                aria-label={t(lang, 'prevPhoto')}
              >
                ‹
              </button>
              <div className="min-w-[180px] text-center">
                <p className="text-xs font-medium text-white/90">
                  {lang === 'uz' ? current.uz : current.ru}
                </p>
                <p className="mt-0.5 font-mono text-[10px] tabular-nums text-white/45">
                  {(open ?? 0) + 1} / {live.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => step(1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
                aria-label={t(lang, 'nextPhoto')}
              >
                ›
              </button>
            </div>

            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 backdrop-blur-md transition hover:bg-white/15 hover:text-white sm:right-8 sm:top-8"
              aria-label={t(lang, 'close')}
            >
              ✕
            </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
