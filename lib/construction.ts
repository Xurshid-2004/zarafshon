// ============================================================================
//  Construction sequence: ONE normalised progress value (0..1) drives
//  everything: the 3D model, the camera and the DOM progress indicator.
//
//  `constructionState.progress` is written by the ScrollTrigger tween only.
//  Readers (useFrame in the scene, gsap.ticker in the overlay) poll it every
//  frame and write straight to Three.js objects / DOM nodes through refs,
//  so no React state is touched while scrolling.
//
//  Every visual state is a pure function of `progress`, so scrolling back up
//  replays the sequence in reverse with no extra code.
// ============================================================================

import { ARCH } from './architecture';
import type { Lang } from './types';

export const constructionState = { progress: 0 };

/** Set by the pinned section: scroll the page to a given construction progress. */
export const constructionScroll = {
  toProgress: (_p: number): void => {},
};

export interface Stage {
  key: 'site' | 'foundation' | 'frame' | 'floors' | 'facade' | 'final' | 'environment';
  start: number;
  end: number;
  title: Record<Lang, string>;
  text: Record<Lang, string>;
}

export const STAGES: readonly Stage[] = [
  {
    key: 'site',
    start: 0,
    end: 0.06,
    title: { uz: 'Bo‘sh maydon', ru: 'Пустой участок' },
    text: {
      uz: 'Uchastka belgilanadi, poydevor uchun chuqur qaziladi.',
      ru: 'Участок размечается, под фундамент вырывается котлован.',
    },
  },
  {
    key: 'foundation',
    start: 0.06,
    end: 0.17,
    title: { uz: 'Poydevor', ru: 'Фундамент' },
    text: {
      uz: 'Qoziqlar, rostverk va monolit plita: butun yuk shu yerga tushadi.',
      ru: 'Сваи, ростверк и монолитная плита принимают всю нагрузку.',
    },
  },
  {
    key: 'frame',
    start: 0.17,
    end: 0.44,
    title: { uz: 'Karkas', ru: 'Каркас' },
    text: {
      uz: 'Har qavatda plita quyiladi, ustunlar va lift shaxtasi ko‘tariladi.',
      ru: 'Этаж за этажом заливаются плиты, растут колонны и лифтовая шахта.',
    },
  },
  {
    key: 'floors',
    start: 0.44,
    end: 0.56,
    title: { uz: 'Qavatlar', ru: 'Этажи' },
    text: {
      uz: 'Qavatlar yopiladi: ichki hajm va yog‘och spandrel panellari.',
      ru: 'Этажи закрываются: внутренний объём и деревянные спандрелы.',
    },
  },
  {
    key: 'facade',
    start: 0.56,
    end: 0.74,
    title: { uz: 'Fasad', ru: 'Фасад' },
    text: {
      uz: 'Shisha fasad, metall profillar va osma balkonlar o‘rnatiladi.',
      ru: 'Монтируются стеклянный фасад, профили и консольные балконы.',
    },
  },
  {
    key: 'final',
    start: 0.74,
    end: 0.84,
    title: { uz: 'Yakuniy arxitektura', ru: 'Финальная архитектура' },
    text: {
      uz: 'Tom parapeti, kirish soyaboni va yoritish. Kranlar demontaj qilinadi.',
      ru: 'Парапет кровли, козырёк входа и освещение. Краны демонтируются.',
    },
  },
  {
    key: 'environment',
    start: 0.84,
    end: 1,
    title: { uz: 'Atrof-muhit', ru: 'Благоустройство' },
    text: {
      uz: 'Maysalar, daraxtlar, yo‘laklar, parkovka va bolalar maydonchasi.',
      ru: 'Газоны, деревья, дорожки, парковка и детская площадка.',
    },
  },
];

/** Still frame of each stage, rendered from this same 3D model. */
export const stageImage = (key: Stage['key']) => `/gallery/${key}.jpg`;

export function stageIndexAt(p: number): number {
  for (let i = STAGES.length - 1; i >= 0; i--) if (p >= STAGES[i].start) return i;
  return 0;
}

// ---------------------------------------------------------------------------
//  Timing helpers shared by the 3D schedule and the overlay counters.
//  Storeys of both towers rise in lockstep: level L of A and of B start
//  together, so the 7-storey tower tops out while the 11-storey one continues.
// ---------------------------------------------------------------------------
export const MAX_LEVELS = Math.max(...ARCH.towers.map((t) => t.floors));

const stepOf = (from: number, span: number) => (level: number) =>
  from + ((level - 1) / MAX_LEVELS) * span;

/** Slab of storey L is poured (roof slab = floors + 1). */
export const frameAt = stepOf(0.17, 0.25);
/** Storey L is enclosed (interior + spandrel band). */
export const encloseAt = stepOf(0.44, 0.1);
/** Storey L is glazed. */
export const glazeAt = stepOf(0.56, 0.1);
/** Balconies of storey L are hung. */
export const balconyAt = stepOf(0.62, 0.1);

export const SLAB_DURATION = 0.014;

/** Storeys whose slab is fully in place at progress p, for one tower. */
export function floorsBuiltAt(p: number, floors: number): number {
  let n = 0;
  for (let l = 1; l <= floors; l++) if (p >= frameAt(l) + SLAB_DURATION) n = l;
  return n;
}
