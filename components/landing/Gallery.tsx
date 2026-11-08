'use client';

import { useRef, useState } from 'react';
import { STAGES, stageImage } from '@/lib/construction';
import { COPY } from '@/lib/landingCopy';
import { useApp } from '@/lib/store';
import { SectionHead, WRAP } from './Sections';

const SHOTS = STAGES.filter((s) => s.key !== 'site');

/* eslint-disable @next/next/no-img-element */
export default function Gallery() {
  const lang = useApp((s) => s.lang);
  const c = COPY[lang].gallery;
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const step = (d: number) => setIndex((i) => (i + d + SHOTS.length) % SHOTS.length);
  const current = SHOTS[index];

  return (
    <section id="gallery" className={WRAP}>
      <SectionHead eyebrow={c.eyebrow} title={c.title} text={c.note} />
      <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SHOTS.map((s, i) => (
          <li key={s.key}>
            <button onClick={() => open(i)} aria-label={`${c.open}: ${s.title[lang]}`} className="group block w-full text-left">
              <img
                src={stageImage(s.key)}
                alt=""
                width={1600}
                height={900}
                loading="lazy"
                className="aspect-video w-full rounded-xl object-cover transition duration-500 group-hover:opacity-85"
              />
              <span className="mt-3 block font-serif text-xl font-light">{s.title[lang]}</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label={current.title[lang]}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
        }}
        className="m-auto w-[min(1200px,94vw)] rounded-2xl bg-ink-800 p-0 font-body text-bone-50 backdrop:bg-ink-900/90"
      >
        <img src={stageImage(current.key)} alt={current.title[lang]} width={1600} height={900} className="aspect-video w-full object-cover" />
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="font-serif text-xl font-light">{current.title[lang]}</p>
          <div className="flex gap-2 text-xs">
            <button onClick={() => step(-1)} className="min-h-10 rounded-full border border-white/25 px-4">
              {c.prev}
            </button>
            <button onClick={() => step(1)} className="min-h-10 rounded-full border border-white/25 px-4">
              {c.next}
            </button>
            <button onClick={() => dialog.current?.close()} className="min-h-10 rounded-full bg-bronze-500 px-4 font-semibold text-ink-900">
              {c.close}
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
