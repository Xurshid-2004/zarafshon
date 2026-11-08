'use client';

import { BUILDINGS, BUILDING_STATS } from '@/lib/buildingConfig';
import { formatArea } from '@/lib/format';
import { blockLabel, floorLabel, roomsLabel, t } from '@/lib/i18n';
import { useApp, useSelectedFloorData } from '@/lib/store';
import { LABEL, PANEL, STATUS_DOT, cx } from '@/lib/ui';
import type { FloorData } from '@/lib/types';

function FloorRow({ floor }: { floor: FloorData }) {
  const lang = useApp((s) => s.lang);
  const hoveredFloor = useApp((s) => s.hoveredFloor);
  const selBuilding = useApp((s) => s.selectedBuilding);
  const selFloor = useApp((s) => s.selectedFloor);
  const setHoveredFloor = useApp((s) => s.setHoveredFloor);
  const selectFloor = useApp((s) => s.selectFloor);

  const isHovered = hoveredFloor === floor.id;
  const isSelected = selBuilding === floor.building && selFloor === floor.level;
  const free = floor.apartments.filter((a) => a.status === 'available').length;
  const total = floor.apartments.length;

  return (
    <button
      type="button"
      onMouseEnter={() => setHoveredFloor(floor.id)}
      onMouseLeave={() => setHoveredFloor(null)}
      onClick={() => selectFloor(floor.building, floor.level)}
      className={cx(
        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition',
        isSelected
          ? 'bg-bronze-500 text-ink-900'
          : isHovered
            ? 'bg-black/10 dark:bg-white/15'
            : 'hover:bg-black/5 dark:hover:bg-white/10',
      )}
    >
      <span className="w-5 shrink-0 font-mono text-[11px] font-semibold tabular-nums">
        {floor.level}
      </span>
      {floor.kind === 'commercial' ? (
        <span className="flex-1 truncate text-[10px] uppercase tracking-wide opacity-70">
          {t(lang, 'commercial')}
        </span>
      ) : (
        <>
          <span className="flex flex-1 items-center gap-[3px]">
            {floor.apartments.map((a) => (
              <span
                key={a.id}
                className={cx('h-1.5 flex-1 rounded-full', STATUS_DOT[a.status])}
                title={`${a.id} — ${t(lang, a.status)}`}
              />
            ))}
          </span>
          <span className="w-7 shrink-0 text-right font-mono text-[10px] tabular-nums opacity-60">
            {free}/{total}
          </span>
        </>
      )}
    </button>
  );
}

function UnitList({ floor }: { floor: FloorData }) {
  const lang = useApp((s) => s.lang);
  const selectedApartment = useApp((s) => s.selectedApartment);
  const hoveredApartment = useApp((s) => s.hoveredApartment);
  const selectApartment = useApp((s) => s.selectApartment);
  const setHoveredApartment = useApp((s) => s.setHoveredApartment);
  const showInterior = useApp((s) => s.showInterior);
  const toggleInterior = useApp((s) => s.toggleInterior);
  const clearFloor = useApp((s) => s.clearFloor);

  return (
    <div className={cx(PANEL, 'pointer-events-auto mt-2 p-3')}>
      <div className="flex items-center justify-between gap-2">
        <p className={LABEL}>
          {blockLabel(floor.building, lang)} · {floorLabel(floor.level, lang)}
        </p>
        <button
          type="button"
          onClick={clearFloor}
          className="rounded-md px-1.5 text-[13px] leading-none opacity-50 transition hover:opacity-100"
          aria-label={t(lang, 'close')}
        >
          ✕
        </button>
      </div>

      {floor.kind === 'commercial' ? (
        <p className="mt-2 text-[11px] leading-relaxed opacity-70">{t(lang, 'commercialDesc')}</p>
      ) : (
        <>
          <ul className="scroll-slim mt-2 max-h-[38vh] space-y-1 overflow-y-auto pr-1">
            {floor.apartments.map((a) => {
              const active = selectedApartment === a.id;
              const hot = hoveredApartment === a.id;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setHoveredApartment(a.id)}
                    onMouseLeave={() => setHoveredApartment(null)}
                    onClick={() => selectApartment(a.id)}
                    className={cx(
                      'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition',
                      active
                        ? 'bg-bronze-500 text-ink-900'
                        : hot
                          ? 'bg-black/10 dark:bg-white/15'
                          : 'hover:bg-black/5 dark:hover:bg-white/10',
                    )}
                  >
                    <span className={cx('h-2 w-2 shrink-0 rounded-full', STATUS_DOT[a.status])} />
                    <span className="w-6 shrink-0 font-mono text-[11px] tabular-nums">
                      {String(a.index).padStart(2, '0')}
                    </span>
                    <span className="flex-1 truncate text-[11px]">{roomsLabel(a.rooms, lang)}</span>
                    <span className="shrink-0 font-mono text-[10px] tabular-nums opacity-70">
                      {formatArea(a.area)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={toggleInterior}
            className={cx(
              'mt-2 w-full rounded-lg border px-2 py-1.5 text-[11px] font-medium transition',
              showInterior
                ? 'border-bronze-500 bg-bronze-500/15 text-bronze-500'
                : 'border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10',
            )}
          >
            {showInterior ? t(lang, 'hideInterior') : t(lang, 'showInterior')}
          </button>
        </>
      )}
    </div>
  );
}

export default function FloorPanel() {
  const lang = useApp((s) => s.lang);
  const phase = useApp((s) => s.phase);
  const selectedFloor = useSelectedFloorData();

  return (
    <aside
      className={cx(
        'absolute right-2 top-[6.5rem] z-20 w-[196px] transition-opacity duration-700 sm:right-6 sm:top-36 sm:w-[268px]',
        phase === 'ready' ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <div className={cx(PANEL, 'pointer-events-auto p-3')}>
        <p className={LABEL}>{t(lang, 'buildingsTitle')}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {BUILDINGS.map((b) => {
            const stats = BUILDING_STATS[b.id];
            return (
              <div key={b.id} className="min-w-0">
                <div className="mb-1.5 border-b border-black/10 pb-1 dark:border-white/10">
                  <p className="truncate text-[11px] font-semibold uppercase tracking-wide">
                    {blockLabel(b.id, lang)}
                  </p>
                  <p className="font-mono text-[9px] tabular-nums opacity-55">
                    {b.floorsCount} {t(lang, 'floor')} · {stats.available}/{stats.total}
                  </p>
                </div>
                <div className="scroll-slim max-h-[34vh] space-y-0.5 overflow-y-auto pr-0.5">
                  {[...b.floors].reverse().map((f) => (
                    <FloorRow key={f.id} floor={f} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {!selectedFloor && (
          <p className="mt-2 border-t border-black/10 pt-2 text-[10px] opacity-55 dark:border-white/10">
            {t(lang, 'selectFloorHint')}
          </p>
        )}
      </div>

      {selectedFloor && <UnitList floor={selectedFloor} />}
    </aside>
  );
}
