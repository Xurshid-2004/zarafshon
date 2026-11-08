// ============================================================================
//  UZ / RU dictionary. The switcher lives in the top bar; the active language
//  is kept in the zustand store so both the DOM overlay and the in-canvas
//  labels read from one source.
// ============================================================================

import type { Lang, RoomKind } from './types';

const uz = {
  brand: 'ZARAFSHON RESIDENCE',
  tagline: 'Zamonaviy turar-joy majmuasi',

  block: 'blok',
  floor: 'qavat',
  floorsTitle: 'Qavatlar',
  buildingsTitle: 'Binolar',
  apartment: 'Xonadon',
  apartments: 'Xonadonlar',

  available: 'Boʻsh',
  reserved: 'Band',
  sold: 'Sotilgan',

  area: 'Maydon',
  rooms: 'Xonalar',
  price: 'Narx',
  pricePerM2: '1 m² narxi',
  m2: 'm²',

  totalUnits: 'Jami xonadon',
  availableUnits: 'Boʻsh xonadon',
  priceFrom: 'Narxi',
  from: 'dan boshlab',

  selectFloorHint: 'Qavatni tanlang',
  selectApartmentHint: 'Xonadonni tanlang',
  noUnits: 'Bu qavatda xonadon yoʻq',

  close: 'Yopish',
  back: 'Orqaga',
  resetView: 'Koʻrinishni tiklash',
  virtualTour: '360° virtual tur',
  tourSoon: 'Virtual tur tez kunda ulanadi',
  reserve: 'Band qilish',
  showInterior: 'Ichki reja',
  hideInterior: 'Rejani yashirish',
  blueprintTitle: 'Reja',

  commercial: 'Tijorat maydoni',
  commercialDesc: 'Birinchi qavat: doʻkonlar, kafe va xizmat koʻrsatish shoxobchalari',
  penthouse: 'Penthaus',

  legend: 'Belgilar',
  amenityPlayground: 'Bolalar maydonchasi',
  amenityParking: 'Parkovka',
  amenityGreen: 'Yashil hudud',
  amenityShops: 'Doʻkonlar',

  introStep1: 'Poydevor va oʻlchov toʻri',
  introStep2: 'Karkas va qavatlar',
  introStep3: 'Shisha fasad',
  introStep4: 'Hudud obodonlashtirish',
  introStep5: 'Tayyor',
  skip: 'Oʻtkazib yuborish',
  loading: 'Yuklanmoqda',

  controlsTitle: 'Boshqaruv',
  ctrlRotate: 'Aylantirish — chap tugma',
  ctrlZoom: 'Masshtab — gʻildirak',
  ctrlPan: 'Surish — oʻrta tugma',

  themeDark: 'Tungi rejim',
  themeLight: 'Kunduzgi rejim',

  roomLiving: 'Mehmonxona',
  roomBedroom: 'Yotoqxona',
  roomKitchen: 'Oshxona',
  roomBath: 'Sanuzel',
  roomHall: 'Dahliz',
  roomBalcony: 'Balkon',

  gallery: 'Fotogalereya',
  complexGallery: 'Majmua galereyasi',
  renderDisclaimer: 'Vizualizatsiya. Yakuniy koʻrinish farq qilishi mumkin.',
  enterScene: 'Interaktiv 3D rejaga oʻtish',
  heroEyebrow: 'Yangi turar-joy majmuasi',
  priceFromShort: 'Narxidan boshlab',
  prevPhoto: 'Oldingi surat',
  nextPhoto: 'Keyingi surat',
} as const;

const ru: Record<keyof typeof uz, string> = {
  brand: 'ZARAFSHON RESIDENCE',
  tagline: 'Современный жилой комплекс',

  block: 'блок',
  floor: 'этаж',
  floorsTitle: 'Этажи',
  buildingsTitle: 'Корпуса',
  apartment: 'Квартира',
  apartments: 'Квартиры',

  available: 'Свободна',
  reserved: 'Забронирована',
  sold: 'Продана',

  area: 'Площадь',
  rooms: 'Комнат',
  price: 'Цена',
  pricePerM2: 'Цена за 1 m²',
  m2: 'm²',

  totalUnits: 'Всего квартир',
  availableUnits: 'Свободных',
  priceFrom: 'Цена',
  from: 'от',

  selectFloorHint: 'Выберите этаж',
  selectApartmentHint: 'Выберите квартиру',
  noUnits: 'На этом этаже нет квартир',

  close: 'Закрыть',
  back: 'Назад',
  resetView: 'Сбросить вид',
  virtualTour: '360° виртуальный тур',
  tourSoon: 'Виртуальный тур скоро будет доступен',
  reserve: 'Забронировать',
  showInterior: 'Планировка',
  hideInterior: 'Скрыть планировку',
  blueprintTitle: 'Планировка',

  commercial: 'Коммерческое помещение',
  commercialDesc: 'Первый этаж: магазины, кафе и сервисные точки',
  penthouse: 'Пентхаус',

  legend: 'Обозначения',
  amenityPlayground: 'Детская площадка',
  amenityParking: 'Парковка',
  amenityGreen: 'Зелёная зона',
  amenityShops: 'Магазины',

  introStep1: 'Фундамент и сетка',
  introStep2: 'Каркас и этажи',
  introStep3: 'Остекление фасада',
  introStep4: 'Благоустройство территории',
  introStep5: 'Готово',
  skip: 'Пропустить',
  loading: 'Загрузка',

  controlsTitle: 'Управление',
  ctrlRotate: 'Вращение — ЛКМ',
  ctrlZoom: 'Масштаб — колесо',
  ctrlPan: 'Панорама — СКМ',

  themeDark: 'Тёмный режим',
  themeLight: 'Светлый режим',

  roomLiving: 'Гостиная',
  roomBedroom: 'Спальня',
  roomKitchen: 'Кухня',
  roomBath: 'Санузел',
  roomHall: 'Прихожая',
  roomBalcony: 'Балкон',

  gallery: 'Фотогалерея',
  complexGallery: 'Галерея комплекса',
  renderDisclaimer: 'Визуализация. Финальный вид может отличаться.',
  enterScene: 'Перейти к интерактивному 3D',
  heroEyebrow: 'Новый жилой комплекс',
  priceFromShort: 'Цена от',
  prevPhoto: 'Предыдущее фото',
  nextPhoto: 'Следующее фото',
};

export type TKey = keyof typeof uz;

export const DICT: Record<Lang, Record<TKey, string>> = { uz, ru };

export function t(lang: Lang, key: TKey): string {
  return DICT[lang][key];
}

/** "3 xonali" / "3-комнатная" */
export function roomsLabel(rooms: number, lang: Lang): string {
  return lang === 'uz' ? `${rooms} xonali` : `${rooms}-комнатная`;
}

/** "A blok" / "блок A" */
export function blockLabel(id: string, lang: Lang): string {
  return lang === 'uz' ? `${id} ${uz.block}` : `${ru.block} ${id}`;
}

/** "5-qavat" / "5 этаж" */
export function floorLabel(level: number, lang: Lang): string {
  return lang === 'uz' ? `${level}-qavat` : `${level} этаж`;
}

const ROOM_KEYS: Record<RoomKind, TKey> = {
  living: 'roomLiving',
  bedroom: 'roomBedroom',
  kitchen: 'roomKitchen',
  bath: 'roomBath',
  hall: 'roomHall',
  balcony: 'roomBalcony',
};

export function roomKindLabel(kind: RoomKind, lang: Lang): string {
  return t(lang, ROOM_KEYS[kind]);
}

export const STATUS_KEY = {
  available: 'available',
  reserved: 'reserved',
  sold: 'sold',
} as const satisfies Record<string, TKey>;
