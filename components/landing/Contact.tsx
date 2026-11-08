'use client';

import { useState } from 'react';
import { COPY } from '@/lib/landingCopy';
import { useApp } from '@/lib/store';
import { SectionHead, WRAP } from './Sections';

const FIELD =
  'mt-2 block min-h-12 w-full rounded-lg border border-white/20 bg-ink-800 px-4 py-3 text-sm text-bone-50 focus:border-bronze-400';

export default function Contact() {
  const c = COPY[useApp((s) => s.lang)].contact;
  const [sent, setSent] = useState(false);

  return (
    <section id="contact" className={`${WRAP} grid gap-12 lg:grid-cols-2`}>
      <SectionHead eyebrow={c.eyebrow} title={c.title} text={c.text} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
        className="space-y-5"
      >
        <label className="block text-xs uppercase tracking-arch text-bone-50/70">
          {c.name}
          <input name="name" required autoComplete="name" className={FIELD} />
        </label>
        <label className="block text-xs uppercase tracking-arch text-bone-50/70">
          {c.phone}
          <input name="phone" type="tel" required autoComplete="tel" className={FIELD} />
        </label>
        <label className="block text-xs uppercase tracking-arch text-bone-50/70">
          {c.message}
          <textarea name="message" rows={4} className={FIELD} />
        </label>
        <button
          type="submit"
          className="min-h-12 rounded-full bg-bronze-500 px-8 text-xs font-semibold uppercase tracking-arch text-ink-900 transition hover:bg-bronze-400"
        >
          {c.send}
        </button>
        <p role="status" className="min-h-5 text-sm text-bronze-400">
          {sent ? c.demo : ''}
        </p>
      </form>
    </section>
  );
}
