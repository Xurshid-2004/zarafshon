import type { Lang } from './types';

const GROUP: Record<Lang, string> = { uz: ' ', ru: ' ' };

/** 1234567 -> "1 234 567" */
export function groupDigits(value: number, lang: Lang = 'uz'): string {
  const sign = value < 0 ? '-' : '';
  const digits = Math.round(Math.abs(value)).toString();
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += GROUP[lang];
    out += digits[i];
  }
  return sign + out;
}

export function formatUsd(value: number, lang: Lang = 'uz'): string {
  return '$' + groupDigits(value, lang);
}

export function formatArea(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '');
}
