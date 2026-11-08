'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { cx } from '@/lib/ui';
import ApartmentDrawer from './ui/ApartmentDrawer';
import ComplexGallery from './ui/ComplexGallery';
import ControlsHint from './ui/ControlsHint';
import FloorPanel from './ui/FloorPanel';
import HeroScreen from './ui/HeroScreen';
import IntroOverlay from './ui/IntroOverlay';
import Legend from './ui/Legend';
import Toast from './ui/Toast';
import TopBar from './ui/TopBar';

/** WebGL only runs in the browser — keep the canvas out of the server render. */
const SceneCanvas = dynamic(() => import('./scene/SceneCanvas'), { ssr: false });

export default function SceneShell() {
  const theme = useApp((s) => s.theme);
  const phase = useApp((s) => s.phase);
  const entered = useApp((s) => s.entered);

  /**
   * Every surface texture is generated procedurally on the CPU. Doing that
   * while the construction sequence is already running would stall the main
   * thread mid-animation, so the canvas waits until the current theme's
   * material set is built.
   */
  const [texturesReady, setTexturesReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const mats = await import('./scene/materials');
      mats.getMaterials(useApp.getState().theme);
      if (!alive) return;
      // give the browser one frame to paint the overlay before the scene starts
      requestAnimationFrame(() => alive && setTexturesReady(true));
    })();
    return () => {
      alive = false;
    };
  }, []);

  /** Build the alternate ambient mode while the user is busy looking around. */
  useEffect(() => {
    if (phase !== 'ready') return;
    const other = theme === 'dark' ? 'light' : 'dark';
    const run = () => {
      void import('./scene/materials').then((m) => m.getMaterials(other));
    };
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    };
    if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 4000 });
    else window.setTimeout(run, 1200);
  }, [phase, theme]);

  return (
    <main
      className={cx(
        'relative h-dvh w-screen overflow-hidden',
        theme === 'dark' ? 'dark bg-ink-900' : 'bg-bone-100',
      )}
    >
      {texturesReady && entered && <SceneCanvas />}

      <TopBar />
      <FloorPanel />
      <Legend />
      <ControlsHint />
      <ApartmentDrawer />
      <Toast />
      <IntroOverlay />
      <ComplexGallery />
      <HeroScreen />
    </main>
  );
}
