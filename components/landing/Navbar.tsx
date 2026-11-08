'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { COPY, NAV_ANCHORS } from '@/lib/landingCopy';
import { useApp } from '@/lib/store';

/** Native smooth scrolling on <html> fights ScrollTrigger, so links scroll per click. */
function goTo(id: string) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

export default function Navbar() {
  const lang = useApp((s) => s.lang);
  const toggleLang = useApp((s) => s.toggleLang);
  const [open, setOpen] = useState(false);
  const c = COPY[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 font-body text-bone-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-md focus:bg-bronze-500 focus:px-4 focus:py-2 focus:text-ink-900"
      >
        {c.skip}
      </a>
      <div className="flex items-center justify-between gap-4 bg-gradient-to-b from-ink-900/85 to-transparent px-4 py-4 sm:px-8 lg:px-14">
        <a href="#top" className="font-serif text-xl tracking-wide" onClick={() => setOpen(false)}>
          Zarafshon <span className="text-bronze-400">Residence</span>
        </a>

        <nav className="hidden items-center gap-6 lg:flex" aria-label={c.menu}>
          {NAV_ANCHORS.map((id) => (
            <button
              key={id}
              onClick={() => goTo(id)}
              className="text-xs uppercase tracking-arch text-bone-50/80 transition hover:text-bronze-400"
            >
              {c.nav[id]}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLang}
            aria-label={lang === 'uz' ? 'Русский язык' : 'O‘zbek tili'}
            className="min-h-10 min-w-10 px-2 text-xs uppercase tracking-arch"
          >
            <span className={lang === 'uz' ? 'text-bone-50' : 'text-bronze-400'}>UZ</span>
            <span className="text-bone-50/50"> / </span>
            <span className={lang === 'ru' ? 'text-bone-50' : 'text-bronze-400'}>RU</span>
          </button>
          <Link
            href="/selector"
            className="hidden rounded-full bg-gradient-to-r from-[#B98A4E] via-[#F3D998] to-[#B98A4E] shadow-[0_0_28px_rgba(224,180,122,0.45)] transition hover:brightness-110 px-5 py-2.5 text-xs font-semibold uppercase tracking-arch text-ink-900 sm:inline-block"
          >
            {c.cta}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="min-h-10 rounded-full border border-white/25 px-4 text-xs uppercase tracking-arch lg:hidden"
          >
            {c.menu}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label={c.menu} className="mx-4 rounded-2xl border border-white/10 bg-ink-800/95 p-3 backdrop-blur-xl lg:hidden">
          {NAV_ANCHORS.map((id) => (
            <button
              key={id}
              onClick={() => {
                setOpen(false);
                goTo(id);
              }}
              className="block min-h-11 w-full rounded-lg px-3 text-left text-sm hover:bg-white/5"
            >
              {c.nav[id]}
            </button>
          ))}
          <Link href="/selector" className="mt-2 block rounded-lg bg-bronze-500 px-3 py-3 text-center text-sm font-semibold text-ink-900 sm:hidden">
            {c.cta}
          </Link>
        </nav>
      )}
    </header>
  );
}
