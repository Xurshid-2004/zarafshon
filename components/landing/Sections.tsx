'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { LAWNS, PARKING, PAVING, PLAYGROUND } from '@/components/scene/siteLayout';
import { ARCH, towerHeight } from '@/lib/architecture';
import { ALL_APARTMENTS } from '@/lib/buildingConfig';
import { formatUsd } from '@/lib/format';
import { COPY } from '@/lib/landingCopy';
import { useApp } from '@/lib/store';

export function SectionHead({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-[11px] uppercase tracking-arch text-bronze-400">{eyebrow}</p>
      <h2 className="mt-4 font-serif text-4xl font-light leading-tight sm:text-6xl">{title}</h2>
      {text && <p className="mt-5 max-w-xl text-sm leading-relaxed text-bone-50/75 sm:text-base">{text}</p>}
    </div>
  );
}

export const WRAP = 'mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-8 sm:py-32';

export function About() {
  const c = COPY[useApp((s) => s.lang)].about;
  return (
    <section id="about" className={WRAP}>
      <SectionHead eyebrow={c.eyebrow} title={c.title} text={c.text} />
      <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3">
        {c.points.map((p) => (
          <li key={p.t} className="bg-ink-900 p-7">
            <h3 className="font-serif text-2xl font-light">{p.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-bone-50/70">{p.d}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Architecture() {
  const c = COPY[useApp((s) => s.lang)].arch;
  const m = c.metres;
  const [a, b] = ARCH.towers;
  const rows: [string, string, string][] = [
    [c.rows.floors, `${a.floors}`, `${b.floors}`],
    [c.rows.size, `${a.width} × ${a.depth} ${m}`, `${b.width} × ${b.depth} ${m}`],
    [c.rows.height, `${towerHeight(a).toFixed(1)} ${m}`, `${towerHeight(b).toFixed(1)} ${m}`],
    [c.rows.storey, `${ARCH.floorHeight} ${m}`, `${ARCH.floorHeight} ${m}`],
    [c.rows.module, `${ARCH.curtainWall.module} ${m}`, `${ARCH.curtainWall.module} ${m}`],
    [c.rows.balcony, `${ARCH.balcony.depth} ${m}`, `${ARCH.balcony.depth} ${m}`],
  ];
  return (
    <section id="architecture" className={WRAP}>
      <SectionHead eyebrow={c.eyebrow} title={c.title} text={c.text} />
      <div className="mt-14 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/15 text-[11px] uppercase tracking-arch text-bone-50/60">
              <th scope="col" className="py-3 font-normal">
                <span className="sr-only">{c.rows.floors}</span>
              </th>
              <th scope="col" className="py-3 text-right font-normal">
                {c.tower} A
              </th>
              <th scope="col" className="py-3 text-right font-normal">
                {c.tower} B
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, av, bv]) => (
              <tr key={label} className="border-b border-white/10">
                <th scope="row" className="py-4 font-normal text-bone-50/80">
                  {label}
                </th>
                <td className="py-4 text-right font-mono tabular-nums">{av}</td>
                <td className="py-4 text-right font-mono tabular-nums">{bv}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function Apartments() {
  const c = COPY[useApp((s) => s.lang)].apts;
  const groups = useMemo(() => {
    const rooms = [...new Set(ALL_APARTMENTS.map((a) => a.rooms))].sort((x, y) => x - y);
    return rooms.map((n) => {
      const list = ALL_APARTMENTS.filter((a) => a.rooms === n);
      const free = list.filter((a) => a.status === 'available');
      return {
        n,
        free: free.length,
        min: Math.min(...list.map((a) => a.area)),
        max: Math.max(...list.map((a) => a.area)),
        price: Math.min(...(free.length ? free : list).map((a) => a.price)),
      };
    });
  }, []);

  return (
    <section id="apartments" className={WRAP}>
      <SectionHead eyebrow={c.eyebrow} title={c.title} text={c.text} />
      <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((g) => (
          <li key={g.n} className="flex flex-col rounded-2xl border border-white/10 p-6">
            <h3 className="font-serif text-3xl font-light">{c.rooms(g.n)}</h3>
            <dl className="mt-5 flex-1 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-bone-50/65">{c.area}</dt>
                <dd className="font-mono tabular-nums">
                  {g.min.toFixed(0)}–{g.max.toFixed(0)} m²
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-bone-50/65">{c.from}</dt>
                <dd className="font-mono tabular-nums">{formatUsd(g.price)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-bone-50/65">{c.available}</dt>
                <dd className="font-mono tabular-nums text-status-available">{g.free}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      <Link
        href="/selector"
        className="mt-10 inline-block rounded-full bg-bronze-500 px-7 py-3 text-xs font-semibold uppercase tracking-arch text-ink-900 transition hover:bg-bronze-400"
      >
        {c.choose}
      </Link>
    </section>
  );
}

const PLAN_COLORS = {
  tower: '#E0B47A',
  lawn: '#3F6A3A',
  path: '#8A8578',
  parking: '#3A3F45',
  play: '#B5573F',
} as const;

export function Location() {
  const c = COPY[useApp((s) => s.lang)].loc;
  return (
    <section id="location" className={WRAP}>
      <SectionHead eyebrow={c.eyebrow} title={c.title} text={c.text} />
      <div className="mt-14 grid items-start gap-8 lg:grid-cols-[1fr_220px]">
        <svg viewBox="-46 -32 92 72" role="img" aria-label={c.plan} className="w-full rounded-2xl bg-ink-800">
          {LAWNS.map((l, i) => (
            <rect key={i} x={l.x - l.w / 2} y={l.z - l.d / 2} width={l.w} height={l.d} fill={PLAN_COLORS.lawn} />
          ))}
          {PAVING.map((p, i) => (
            <rect key={i} x={p.x - p.w / 2} y={p.z - p.d / 2} width={p.w} height={p.d} fill={PLAN_COLORS.path} />
          ))}
          {PARKING.map((p, i) => (
            <rect key={i} x={p.x - p.w / 2} y={p.z - p.d / 2} width={p.w} height={p.d} fill={PLAN_COLORS.parking} />
          ))}
          <rect
            x={PLAYGROUND.x - PLAYGROUND.w / 2}
            y={PLAYGROUND.z - PLAYGROUND.d / 2}
            width={PLAYGROUND.w}
            height={PLAYGROUND.d}
            fill={PLAN_COLORS.play}
          />
          {ARCH.towers.map((t) => (
            <g key={t.id}>
              <rect
                x={t.position[0] - t.width / 2}
                y={t.position[2] - t.depth / 2}
                width={t.width}
                height={t.depth}
                fill={PLAN_COLORS.tower}
              />
              <text x={t.position[0]} y={t.position[2] + 2} textAnchor="middle" fontSize="6" fill="#070A0F">
                {t.id}
              </text>
            </g>
          ))}
        </svg>
        <ul className="space-y-3 text-sm">
          {(Object.keys(c.legend) as (keyof typeof c.legend)[]).map((k) => (
            <li key={k} className="flex items-center gap-3">
              <span aria-hidden className="block size-3 rounded-sm" style={{ background: PLAN_COLORS[k] }} />
              {c.legend[k]}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Footer() {
  const lang = useApp((s) => s.lang);
  return (
    <footer className="border-t border-white/10 px-4 py-10 text-center text-xs text-bone-50/60 sm:px-8">
      <p className="font-serif text-lg text-bone-50">Zarafshon Residence</p>
      <p className="mt-2">{COPY[lang].footer}</p>
    </footer>
  );
}
