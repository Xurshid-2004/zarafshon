'use client';

// ============================================================================
//  Complex-wide photo gallery: exterior shots + shared amenities.
//  Opened from the hero screen and from the top bar.
// ============================================================================

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { t } from '@/lib/i18n';
import { AMENITY_SHOTS, EXTERIOR_SHOTS } from '@/lib/renders';
import { useApp } from '@/lib/store';
import { BTN, LABEL, PANEL_SOLID, cx } from '@/lib/ui';
import RenderGallery from './RenderGallery';

export default function ComplexGallery() {
  const lang = useApp((s) => s.lang);
  const open = useApp((s) => s.galleryOpen);
  const setGalleryOpen = useApp((s) => s.setGalleryOpen);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      // the lightbox sits above this modal and handles Escape first
      if (e.key === 'Escape') setGalleryOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setGalleryOpen]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="complex-gallery"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={() => setGalleryOpen(false)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm sm:p-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className={cx(
              PANEL_SOLID,
              'scroll-slim max-h-[88vh] w-full max-w-4xl overflow-y-auto p-5 sm:p-7',
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={LABEL}>{t(lang, 'brand')}</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
                  {t(lang, 'complexGallery')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setGalleryOpen(false)}
                className={cx(BTN, 'h-9 w-9 shrink-0 !px-0')}
                aria-label={t(lang, 'close')}
              >
                ✕
              </button>
            </div>

            <div className="mt-5">
              <p className={LABEL}>{t(lang, 'buildingsTitle')}</p>
              <div className="mt-2">
                <RenderGallery shots={EXTERIOR_SHOTS} lang={lang} columns={3} feature />
              </div>
            </div>

            <div className="mt-6">
              <p className={LABEL}>{t(lang, 'legend')}</p>
              <div className="mt-2">
                <RenderGallery shots={AMENITY_SHOTS} lang={lang} columns={3} />
              </div>
            </div>

            <p className="mt-5 text-[10px] leading-snug opacity-45">
              {t(lang, 'renderDisclaimer')}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
