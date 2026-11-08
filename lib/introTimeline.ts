// ============================================================================
//  One shared GSAP timeline for the 0 s -> 5 s construction sequence.
//
//  Every scene component registers its own tweens at absolute positions on
//  this timeline during its mount effect. The timeline is created paused and
//  starts on the next animation frame, by which point React has committed all
//  of them — so the floors, the environment and the camera stay in lockstep
//  and "skip" is a single progress(1) call.
//
//  Requires reactStrictMode: false (see next.config.mjs) so mount effects run
//  exactly once and tweens are not registered twice.
// ============================================================================

import gsap from 'gsap';

/**
 * Run the intro on real time.
 *
 * GSAP's default lag smoothing freezes its clock whenever a frame takes longer
 * than 500 ms, so on a slow first paint — shader compilation, texture
 * generation — a 5-second sequence can take minutes of wall clock to finish.
 * The construction sequence is a timed presentation, not gameplay: it should
 * always take five seconds and simply drop frames on weak hardware.
 */
if (typeof window !== 'undefined') {
  gsap.ticker.lagSmoothing(0);
}

let tl: gsap.core.Timeline | null = null;

export function introTimeline(): gsap.core.Timeline {
  if (!tl) {
    tl = gsap.timeline({ paused: true });
    if (typeof window !== 'undefined') {
      // handy for QA: window.__introTL.pause().progress(0.4)
      (window as unknown as Record<string, unknown>).__introTL = tl;
      requestAnimationFrame(() => {
        tl?.play(0);
      });
    }
  }
  return tl;
}

/** Jump straight to the finished state; callbacks on the way still fire. */
export function skipIntroTimeline(): void {
  tl?.progress(1);
}

export function disposeIntroTimeline(): void {
  tl?.kill();
  tl = null;
}
