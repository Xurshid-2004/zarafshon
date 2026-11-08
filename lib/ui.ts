/** Shared class strings so every overlay panel reads as one design system. */

export const PANEL =
  'rounded-2xl border border-black/10 bg-white/70 text-ink-800 shadow-glass backdrop-blur-xl ' +
  'dark:border-white/10 dark:bg-ink-900/70 dark:text-bone-50';

export const PANEL_SOLID =
  'rounded-2xl border border-black/10 bg-white/90 text-ink-800 shadow-lift backdrop-blur-2xl ' +
  'dark:border-white/10 dark:bg-ink-800/90 dark:text-bone-50';

export const CHIP =
  'rounded-full border border-black/10 bg-white/60 px-3 py-1 text-[11px] font-medium ' +
  'dark:border-white/10 dark:bg-white/5';

export const BTN =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2 ' +
  'text-xs font-medium transition hover:bg-white active:scale-[0.98] ' +
  'dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10';

export const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-bronze-500 px-4 py-2.5 text-xs font-semibold ' +
  'uppercase tracking-arch text-ink-900 transition hover:bg-bronze-400 active:scale-[0.98] ' +
  'disabled:cursor-not-allowed disabled:opacity-40';

export const LABEL =
  'text-[10px] font-medium uppercase tracking-arch text-ink-800/55 dark:text-bone-50/45';

export const STATUS_DOT: Record<string, string> = {
  available: 'bg-status-available',
  reserved: 'bg-status-reserved',
  sold: 'bg-status-sold',
};

export const STATUS_TEXT: Record<string, string> = {
  available: 'text-status-available',
  reserved: 'text-status-reserved',
  sold: 'text-status-sold',
};

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
