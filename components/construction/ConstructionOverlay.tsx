'use client';

// ============================================================================
//  Hero and progress UI of the pinned section.
//
//  React renders this only when the language changes. A gsap.ticker callback
//  reads the same `constructionState.progress` the 3D scene reads and writes
//  the bar, the percentage, the floor counters and the active stage straight
//  into the DOM through refs, so the indicator cannot drift from the model.
// ============================================================================

import gsap from 'gsap';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { ARCH } from '@/lib/architecture';
import { SITE_STATS } from '@/lib/buildingConfig';
import {
  STAGES,
  constructionScroll,
  constructionState,
  floorsBuiltAt,
  stageIndexAt,
} from '@/lib/construction';
import { formatUsd } from '@/lib/format';
import { COPY } from '@/lib/landingCopy';
import { useApp } from '@/lib/store';

const pad = (n: number) => String(n).padStart(2, '0');
const HERO_END = 0.04;

export default function ConstructionOverlay({ heroImage }: { heroImage?: string }) {
  const lang = useApp((s) => s.lang);
  const c = COPY[lang];

  const posterRef = useRef<HTMLImageElement>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const stageBlockRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const floorRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tickRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let lastP = -1;
    let lastStage = -1;
    const lastFloors = ARCH.towers.map(() => -1);

    const update = () => {
      const p = constructionState.progress;
      if (p === lastP) return;
      lastP = p;

      const heroVisible = Math.max(0, 1 - p / HERO_END);
      if (heroRef.current) {
        heroRef.current.style.opacity = String(heroVisible);
        heroRef.current.style.transform = `translateY(${(1 - heroVisible) * -24}px)`;
        // hidden content must also leave the tab order
        heroRef.current.style.visibility = heroVisible > 0 ? 'visible' : 'hidden';
      }
      if (posterRef.current) {
        // the photograph dissolves into the 3D site as soon as scrolling starts
        posterRef.current.style.opacity = String(heroVisible);
        posterRef.current.style.visibility = heroVisible > 0 ? 'visible' : 'hidden';
      }
      if (stageBlockRef.current) stageBlockRef.current.style.opacity = String(1 - heroVisible);

      if (pctRef.current) pctRef.current.textContent = String(Math.round(p * 100));
      if (barRef.current) barRef.current.style.transform = `scaleY(${p})`;

      ARCH.towers.forEach((t, i) => {
        const n = floorsBuiltAt(p, t.floors);
        if (n !== lastFloors[i]) {
          lastFloors[i] = n;
          const el = floorRefs.current[i];
          if (el) el.textContent = `${n}/${t.floors}`;
        }
      });

      const s = stageIndexAt(p);
      if (s !== lastStage) {
        lastStage = s;
        stageRefs.current.forEach((el, i) => el?.setAttribute('data-active', String(i === s)));
        tickRefs.current.forEach((el, i) => {
          el?.setAttribute('data-active', String(i === s));
          el?.setAttribute('data-done', String(i < s));
          if (i === s) el?.setAttribute('aria-current', 'step');
          else el?.removeAttribute('aria-current');
        });
        if (counterRef.current) counterRef.current.textContent = `${pad(s + 1)} / ${pad(STAGES.length)}`;
      }
    };

    update();
    gsap.ticker.add(update);
    return () => gsap.ticker.remove(update);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-body text-bone-50">
      {heroImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={posterRef}
          src={heroImage}
          alt=""
          fetchPriority="high"
          data-testid="hero-poster"
          className="absolute inset-0 h-full w-full object-cover object-[60%_center]"
        />
      )}

      {/* legibility gradients */}
      <div className="absolute inset-y-0 left-0 w-[min(620px,90vw)] bg-gradient-to-r from-ink-900/80 via-ink-900/40 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-[min(280px,50vw)] bg-gradient-to-l from-ink-900/65 via-ink-900/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink-900 via-ink-900/60 to-transparent" />

      {/* hero, part of the 3D opening frame */}
      <div ref={heroRef} className="absolute left-4 right-24 top-[20%] sm:left-8 sm:right-auto sm:w-[560px] lg:left-14 short:top-[72px] tiny:top-16">
        <p className="text-[11px] uppercase tracking-arch text-bronze-400">{c.hero.eyebrow}</p>
        <h1 className="mt-4 font-serif text-5xl font-light leading-[1.02] [text-shadow:0_0_42px_rgba(224,180,122,0.55)] sm:text-7xl short:mt-2 short:sm:text-6xl tiny:mt-1 tiny:text-4xl">{c.hero.title}</h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-bone-50/80 sm:text-base short:mt-3 tiny:mt-2 tiny:text-xs">{c.hero.text}</p>
        <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 short:mt-4 tiny:hidden">
          <div>
            <dt className="sr-only">{c.hero.units}</dt>
            <dd className="text-xl font-bold tabular-nums">
              {SITE_STATS.total} <span className="ml-1 text-sm font-normal text-bone-50/70">{c.hero.units}</span>
            </dd>
          </div>
          <div>
            <dt className="sr-only">{c.hero.floors}</dt>
            <dd className="text-xl font-bold tabular-nums">
              {ARCH.towers.map((t) => t.floors).join(' + ')} <span className="ml-1 text-sm font-normal text-bone-50/70">{c.hero.floors}</span>
            </dd>
          </div>
          <div>
            <dt className="sr-only">{c.hero.from}</dt>
            <dd className="text-xl font-bold tabular-nums">
              {formatUsd(SITE_STATS.minPrice)} <span className="ml-1 text-sm font-normal text-bone-50/70">{c.hero.from}</span>
            </dd>
          </div>
        </dl>
        <Link
          href="/selector"
          className="pointer-events-auto mt-8 short:mt-4 inline-block rounded-full bg-gradient-to-r from-[#B98A4E] via-[#F3D998] to-[#B98A4E] shadow-[0_0_28px_rgba(224,180,122,0.45)] transition hover:brightness-110 px-7 py-3 tiny:mt-3 short:py-2.5 tiny:py-2 text-xs font-semibold uppercase tracking-arch text-ink-900"
        >
          {c.cta}
        </Link>
      </div>

      {/* current stage */}
      <div
        ref={stageBlockRef}
        className="absolute left-4 right-24 top-[22%] opacity-0 sm:left-8 sm:right-auto sm:w-[440px] lg:left-14 short:top-20 tiny:top-16"
      >
        <span ref={counterRef} className="font-mono text-xs tabular-nums text-bronze-400">
          01 / {pad(STAGES.length)}
        </span>
        <div className="relative mt-3 h-52" aria-live="polite">
          {STAGES.map((s, i) => (
            <div
              key={s.key}
              ref={(el) => {
                stageRefs.current[i] = el;
              }}
              data-active={i === 0}
              className="absolute inset-0 translate-y-3 opacity-0 transition-all duration-500 ease-out data-[active=true]:translate-y-0 data-[active=true]:opacity-100"
            >
              <h2 className="font-serif text-4xl font-light leading-tight sm:text-6xl">{s.title[lang]}</h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-bone-50/80">{s.text[lang]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* progress column */}
      <div className="absolute bottom-28 right-4 top-20 flex w-20 flex-col items-end sm:right-8 sm:top-24 sm:w-24">
        <p className="text-3xl font-semibold tabular-nums text-[#DDF7A8] [text-shadow:0_0_22px_rgba(110,240,190,0.75)] sm:text-5xl">
          <span ref={pctRef} data-testid="construction-percent">
            0
          </span>
          <span className="text-base sm:text-xl">%</span>
        </p>
        <div className="relative mt-4 w-1 flex-1 overflow-hidden rounded-full bg-white/20">
          <div
            ref={barRef}
            data-testid="construction-bar"
            className="absolute inset-0 origin-top bg-[#7CF0C4] shadow-[0_0_14px_#7CF0C4]"
            style={{ transform: 'scaleY(0)' }}
          />
        </div>
        <div className="mt-4 space-y-1 whitespace-nowrap text-right text-xs tabular-nums text-bone-50/90">
          {ARCH.towers.map((t, i) => (
            <p key={t.id}>
              <span className="text-bronze-400">{t.id}:</span>{' '}
              <span
                ref={(el) => {
                  floorRefs.current[i] = el;
                }}
                data-testid={`construction-floors-${t.id}`}
              >
                0/{t.floors}
              </span>{' '}
              {c.overlay.floors}
            </p>
          ))}
        </div>
      </div>

      {/* stage ticks */}
      <nav
        className="pointer-events-auto absolute bottom-5 left-4 right-4 sm:left-8 sm:right-8 lg:left-14 lg:right-14"
        aria-label={c.overlay.stages}
      >
        <p className="mb-1 hidden text-[11px] uppercase tracking-arch text-bronze-400 sm:block short:hidden">{c.overlay.timeline}</p>
        <ol className="flex gap-1.5">
          {STAGES.map((s, i) => (
            <li key={s.key} className="min-w-0 flex-1" style={{ flexGrow: Math.max(0.6, (s.end - s.start) * 10) }}>
              <button
                ref={(el) => {
                  tickRefs.current[i] = el;
                }}
                data-active={i === 0}
                data-done={false}
                data-stage={s.key}
                aria-label={s.title[lang]}
                onClick={() => constructionScroll.toProgress(s.start + 0.001)}
                className="group block min-h-6 w-full py-2 text-left"
              >
                <span className="block h-[3px] rounded-full bg-white/25 transition-colors group-hover:bg-white/50 group-data-[active=true]:bg-bronze-400 group-data-[done=true]:bg-bronze-500/70" />
                <span className="mt-2 hidden truncate text-[10px] uppercase tracking-arch text-bone-50/60 transition-colors group-data-[active=true]:text-bone-50 sm:block">
                  {s.title[lang]}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
