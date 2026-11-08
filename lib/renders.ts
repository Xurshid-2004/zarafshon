// ============================================================================
//  Photoreal render manifest.
//
//  Files live under /public/renders. Every shot has two files on disk:
//    full   /renders/<file>            1760 px wide, used by the lightbox
//    thumb  /renders/thumbs/<file>      640 px wide, used by the grid
//  The thumbnail path is derived, so adding a shot means adding one line here.
//
//  A missing file is not a crash: RenderGallery drops any image whose <img>
//  fires onError, and renders nothing at all when the whole set is missing.
// ============================================================================

import type { RenderSet } from './types';

export interface RenderShot {
  /** Path relative to /renders, e.g. `interior/living-a.jpg`. */
  file: string;
  /** Caption, Uzbek. */
  uz: string;
  /** Caption, Russian. */
  ru: string;
}

const BASE = '/renders';

export function fullSrc(shot: RenderShot): string {
  return `${BASE}/${shot.file}`;
}

export function thumbSrc(shot: RenderShot): string {
  return `${BASE}/thumbs/${shot.file}`;
}

// --- site-wide shots -------------------------------------------------------

export const HERO_SHOT: RenderShot = {
  file: 'exterior/hero.jpg',
  uz: 'Majmuaning umumiy koʻrinishi',
  ru: 'Общий вид комплекса',
};

export const EXTERIOR_SHOTS: readonly RenderShot[] = [
  HERO_SHOT,
  { file: 'exterior/evening.jpg', uz: 'Kechki yoritish', ru: 'Вечернее освещение' },
  { file: 'exterior/aerial.jpg', uz: 'Qush parvozidan', ru: 'Вид с высоты' },
];

export const AMENITY_SHOTS: readonly RenderShot[] = [
  { file: 'amenity/courtyard.jpg', uz: 'Ichki hovli', ru: 'Внутренний двор' },
  { file: 'amenity/lobby.jpg', uz: 'Lobbi', ru: 'Лобби' },
  { file: 'amenity/playground.jpg', uz: 'Bolalar maydonchasi', ru: 'Детская площадка' },
  { file: 'amenity/parking.jpg', uz: 'Parkovka va tijorat qatori', ru: 'Парковка и торговая линия' },
];

/** Everything shown in the complex-wide gallery modal. */
export const COMPLEX_SHOTS: readonly RenderShot[] = [...EXTERIOR_SHOTS, ...AMENITY_SHOTS];

// --- interior shots, grouped by apartment type -----------------------------

const LIVING_A: RenderShot = { file: 'interior/living-a.jpg', uz: 'Mehmonxona va oshxona', ru: 'Гостиная и кухня' };
const LIVING_B: RenderShot = { file: 'interior/living-b.jpg', uz: 'Mehmonxona', ru: 'Гостиная' };
const LIVING_C: RenderShot = { file: 'interior/living-c.jpg', uz: 'Mehmonxona va oshxona', ru: 'Гостиная и кухня' };
const LIVING_PH: RenderShot = { file: 'interior/living-ph.jpg', uz: 'Ikki yorugʻlikli mehmonxona', ru: 'Гостиная с двойным светом' };
const LOUNGE_PH: RenderShot = { file: 'interior/lounge-ph.jpg', uz: 'Kamin zonasi', ru: 'Каминная зона' };
const KITCHEN_A: RenderShot = { file: 'interior/kitchen-a.jpg', uz: 'Oshxona', ru: 'Кухня' };
const KITCHEN_B: RenderShot = { file: 'interior/kitchen-b.jpg', uz: 'Oshxona va ovqatlanish zonasi', ru: 'Кухня и столовая' };
const BEDROOM_A: RenderShot = { file: 'interior/bedroom-a.jpg', uz: 'Yotoqxona', ru: 'Спальня' };
const BEDROOM_B: RenderShot = { file: 'interior/bedroom-b.jpg', uz: 'Asosiy yotoqxona', ru: 'Главная спальня' };
const BATH_A: RenderShot = { file: 'interior/bath-a.jpg', uz: 'Sanuzel', ru: 'Санузел' };
const BATH_B: RenderShot = { file: 'interior/bath-b.jpg', uz: 'Hammom', ru: 'Ванная комната' };
const TERRACE: RenderShot = { file: 'interior/terrace.jpg', uz: 'Penthaus terrassasi', ru: 'Терраса пентхауса' };

export const INTERIOR_SHOTS: Record<RenderSet, readonly RenderShot[]> = {
  '1room': [LIVING_A, BATH_A],
  '2room': [LIVING_B, BEDROOM_A, BATH_A],
  '3room': [LIVING_C, KITCHEN_B, BEDROOM_B, BATH_B],
  penthouse: [LIVING_PH, LOUNGE_PH, KITCHEN_A, BEDROOM_B, BATH_B, TERRACE],
};

/** Which photo set an apartment of this size is shown with. */
export function renderSetFor(rooms: number): RenderSet {
  if (rooms >= 4) return 'penthouse';
  if (rooms <= 1) return '1room';
  if (rooms === 2) return '2room';
  return '3room';
}

export function shotsFor(set: RenderSet): readonly RenderShot[] {
  return INTERIOR_SHOTS[set];
}
