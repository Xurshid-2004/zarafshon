'use client';

// ============================================================================
//  The opening of the site: hero + pinned 3D construction. One GSAP tween maps
//  scroll to constructionState.progress (0..1). Nothing else writes that value
//  and no React state changes while scrolling; scene and overlay poll it.
//  Without WebGL, or after a lost context, a static stage list takes over.
// ============================================================================

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { STAGES, constructionScroll, constructionState, stageImage } from '@/lib/construction';
import { COPY } from '@/lib/landingCopy';
import { useApp } from '@/lib/store';
import ConstructionOverlay from './ConstructionOverlay';

const ConstructionCanvas = dynamic(() => import('./ConstructionCanvas'), { ssr: false });

/** Scroll distance of the whole sequence, in viewport heights. */
const SCROLL_SCREENS = 6;

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

function StaticStages() {
  const lang = useApp((s) => s.lang);
  const c = COPY[lang];
  return (
    <section className="bg-ink-900 px-4 pb-20 pt-32 font-body text-bone-50 sm:px-8 lg:px-14" data-testid="webgl-fallback">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] uppercase tracking-arch text-bronze-400">{c.hero.eyebrow}</p>
        <h1 className="mt-4 font-serif text-5xl font-light sm:text-7xl">{c.hero.title}</h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-bone-50/75">{c.fallback.text}</p>
        <h2 className="mt-14 font-serif text-3xl font-light">{c.fallback.title}</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STAGES.map((s, i) => (
            <li key={s.key}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stageImage(s.key)}
                alt={s.title[lang]}
                width={1600}
                height={900}
                loading={i < 3 ? 'eager' : 'lazy'}
                className="aspect-video w-full rounded-lg object-cover"
              />
              <h3 className="mt-3 font-serif text-2xl font-light">
                <span className="mr-2 font-mono text-xs text-bronze-400">{String(i + 1).padStart(2, '0')}</span>
                {s.title[lang]}
              </h3>
              <p className="mt-1 text-sm text-bone-50/70">{s.text[lang]}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/**
 * The pinned section is its own component on purpose. ScrollTrigger moves the
 * element into a generated pin-spacer, and React can only remove it from the
 * parent it remembers. A deleted component runs its layout-effect cleanup
 * before its DOM node is removed, so the pin is reverted just in time, both
 * on route changes and when a lost WebGL context swaps in the static view.
 */
function PinnedConstruction({
  webgl,
  reducedMotion,
  onContextLost,
  heroImage,
}: {
  heroImage?: string;
  webgl: boolean;
  reducedMotion: boolean;
  onContextLost: () => void;
}) {
  const lang = useApp((s) => s.lang);
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!webgl || !section) return;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    // GSAP's lag smoothing slows its clock on long frames, which would leave
    // the scrub trailing the scrollbar for seconds on weak GPUs.
    gsap.ticker.lagSmoothing(0);

    const tween = gsap.to(constructionState, {
      progress: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${window.innerHeight * SCROLL_SCREENS}`,
        pin: true,
        anticipatePin: 1,
        // a short catch-up smooths wheel steps; reduced motion follows scroll exactly
        scrub: reducedMotion ? true : 0.5,
        invalidateOnRefresh: true,
      },
    });

    constructionScroll.toProgress = (p) => {
      const st = tween.scrollTrigger;
      if (!st) return;
      window.scrollTo({
        top: st.start + p * (st.end - st.start),
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    };

    return () => {
      constructionScroll.toProgress = () => {};
      tween.scrollTrigger?.kill();
      tween.kill();
      constructionState.progress = 0;
    };
  }, [webgl, reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="top"
      aria-label={COPY[lang].overlay.canvas}
      data-testid="construction"
      className="relative h-svh w-full overflow-hidden bg-ink-900"
    >
      {webgl && <ConstructionCanvas reducedMotion={reducedMotion} onContextLost={onContextLost} />}
      <ConstructionOverlay heroImage={heroImage} />
    </section>
  );
}

export default function ConstructionSection({ heroImage }: { heroImage?: string }) {
  /** null until the browser has been checked, which cannot happen on the server. */
  const [mode, setMode] = useState<'webgl' | 'static' | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setMode(supportsWebGL() ? 'webgl' : 'static');
  }, []);

  const onContextLost = useCallback(() => setMode('static'), []);

  if (mode === 'static') return <StaticStages />;
  return <PinnedConstruction webgl={mode === 'webgl'} reducedMotion={reducedMotion} onContextLost={onContextLost} heroImage={heroImage} />;
}
