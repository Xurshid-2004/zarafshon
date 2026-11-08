'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { formatArea, formatUsd } from '@/lib/format';
import { blockLabel, floorLabel, roomsLabel, t } from '@/lib/i18n';
import { shotsFor } from '@/lib/renders';
import { useApp, useSelectedApartment } from '@/lib/store';
import { BTN, BTN_PRIMARY, LABEL, PANEL_SOLID, STATUS_DOT, STATUS_TEXT, cx } from '@/lib/ui';
import Blueprint2D from './Blueprint2D';
import RenderGallery from './RenderGallery';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-black/[0.03] px-3 py-2 dark:border-white/10 dark:bg-white/5">
      <p className={LABEL}>{label}</p>
      <p className="mt-0.5 font-mono text-[13px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export default function ApartmentDrawer() {
  const lang = useApp((s) => s.lang);
  const apt = useSelectedApartment();
  const clearApartment = useApp((s) => s.clearApartment);
  const setToast = useApp((s) => s.setToast);

  return (
    <AnimatePresence>
      {apt && (
        <motion.aside
          key="drawer"
          initial={{ x: '110%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '110%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="absolute bottom-0 right-0 z-40 flex max-h-[88vh] w-full flex-col sm:bottom-6 sm:right-6 sm:max-h-[84vh] sm:w-[370px]"
        >
          <div className={cx(PANEL_SOLID, 'scroll-slim flex flex-col overflow-y-auto p-5')}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={LABEL}>
                  {blockLabel(apt.building, lang)} · {floorLabel(apt.floor, lang)}
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  {t(lang, 'apartment')} {String(apt.index).padStart(2, '0')}
                </h2>
                <p className="mt-0.5 font-mono text-[10px] opacity-45">{apt.id}</p>
              </div>
              <button
                type="button"
                onClick={clearApartment}
                className={cx(BTN, 'h-8 w-8 !px-0')}
                aria-label={t(lang, 'close')}
              >
                ✕
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className={cx('h-2.5 w-2.5 rounded-full', STATUS_DOT[apt.status])} />
              <span className={cx('text-xs font-semibold uppercase tracking-arch', STATUS_TEXT[apt.status])}>
                {t(lang, apt.status)}
              </span>
              {apt.rooms >= 4 && (
                <span className="ml-auto rounded-full border border-bronze-500/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-arch text-bronze-500">
                  {t(lang, 'penthouse')}
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Stat label={t(lang, 'area')} value={`${formatArea(apt.area)} ${t(lang, 'm2')}`} />
              <Stat label={t(lang, 'rooms')} value={roomsLabel(apt.rooms, lang)} />
              <Stat label={t(lang, 'pricePerM2')} value={formatUsd(apt.pricePerM2, lang)} />
              <Stat label={t(lang, 'price')} value={formatUsd(apt.price, lang)} />
            </div>

            <div className="mt-4">
              <p className={LABEL}>{t(lang, 'blueprintTitle')}</p>
              <div className="mt-2 rounded-xl border border-black/10 bg-bone-50 p-3 text-ink-800 dark:border-white/10">
                <Blueprint2D apt={apt} />
              </div>
            </div>

            <div className="mt-4">
              <p className={LABEL}>{t(lang, 'gallery')}</p>
              <div className="mt-2">
                <RenderGallery shots={shotsFor(apt.renderSet)} lang={lang} columns={2} />
              </div>
              <p className="mt-2 text-[10px] leading-snug opacity-45">
                {t(lang, 'renderDisclaimer')}
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setToast(t(lang, 'tourSoon'))}
                className={BTN_PRIMARY}
              >
                {t(lang, 'virtualTour')}
              </button>
              <button
                type="button"
                disabled={apt.status === 'sold'}
                onClick={() =>
                  setToast(
                    lang === 'uz'
                      ? `${apt.id} — soʻrov yuborildi`
                      : `${apt.id} — заявка отправлена`,
                  )
                }
                className={cx(BTN, 'py-2.5 disabled:cursor-not-allowed disabled:opacity-40')}
              >
                {apt.status === 'sold' ? t(lang, 'sold') : t(lang, 'reserve')}
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
