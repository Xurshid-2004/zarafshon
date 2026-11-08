'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useLayoutEffect } from 'react';
import { COPY } from '@/lib/landingCopy';
import { useApp } from '@/lib/store';

/** The interactive 3D apartment selector. Arrivals from the landing skip its old entry screen. */
const SceneShell = dynamic(
  () =>
    import('@/components/SceneShell').then((m) => {
      useApp.getState().enter();
      return m;
    }),
  { ssr: false },
);

export default function SelectorPage() {
  const lang = useApp((s) => s.lang);

  // the selector is a full-screen app; only the landing scrolls
  useLayoutEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <>
      <SceneShell />
      <Link
        href="/"
        className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border border-white/20 bg-ink-900/80 px-4 py-2 text-xs text-bone-50 backdrop-blur-xl"
      >
        ← {COPY[lang].back}
      </Link>
    </>
  );
}
