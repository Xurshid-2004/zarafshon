// All text of the landing page, Uzbek and Russian. The project is a portfolio
// demonstration: the wording says so wherever a visitor could otherwise take
// it for a real offer.

import type { Lang } from './types';

export const NAV_ANCHORS = ['about', 'architecture', 'gallery', 'apartments', 'location', 'contact'] as const;
export type Anchor = (typeof NAV_ANCHORS)[number];

interface Copy {
  skip: string;
  nav: Record<Anchor, string>;
  menu: string;
  cta: string;
  hero: { eyebrow: string; title: string; text: string; scroll: string; units: string; from: string; floors: string };
  overlay: { floors: string; stages: string; canvas: string; timeline: string };
  about: { eyebrow: string; title: string; text: string; points: { t: string; d: string }[] };
  arch: {
    eyebrow: string;
    title: string;
    text: string;
    rows: { floors: string; size: string; storey: string; module: string; balcony: string; height: string };
    tower: string;
    metres: string;
    storeys: string;
  };
  gallery: { eyebrow: string; title: string; note: string; close: string; prev: string; next: string; open: string };
  apts: {
    eyebrow: string;
    title: string;
    text: string;
    rooms: (n: number) => string;
    area: string;
    from: string;
    available: string;
    choose: string;
  };
  loc: { eyebrow: string; title: string; text: string; plan: string; legend: Record<'tower' | 'lawn' | 'path' | 'parking' | 'play', string> };
  contact: {
    eyebrow: string;
    title: string;
    text: string;
    name: string;
    phone: string;
    message: string;
    send: string;
    demo: string;
  };
  footer: string;
  fallback: { title: string; text: string };
  back: string;
}

export const COPY: Record<Lang, Copy> = {
  uz: {
    skip: 'Asosiy mazmunga o‘tish',
    nav: {
      about: 'Loyiha',
      architecture: 'Arxitektura',
      gallery: 'Galereya',
      apartments: 'Xonadonlar',
      location: 'Bosh reja',
      contact: 'Aloqa',
    },
    menu: 'Menyu',
    cta: 'Xonadon tanlash',
    hero: {
      eyebrow: 'Premium turar-joy majmuasi',
      title: 'Zarafshon Residence',
      text: 'Ikki bino noldan ko‘z oldingizda quriladi. Pastga aylantiring, yuqoriga qaytsangiz jarayon orqaga ketadi.',
      scroll: 'Pastga aylantiring',
      units: 'xonadon',
      from: 'dan boshlab',
      floors: 'qavatli binolar',
    },
    overlay: { floors: 'qavat', stages: 'Qurilish bosqichlari', timeline: 'Qurilish xronologiyasi', canvas: 'Ikki turar-joy binosining bosqichma-bosqich qurilishi' },
    about: {
      eyebrow: 'Loyiha haqida',
      title: 'Yorug‘lik, tabiat va sokinlik uchun qurilgan majmua',
      text: 'Ikki bino yashil hovli atrofida joylashgan. Birinchi qavatda tijorat maydonlari, yuqorida panoramali oynali xonadonlar.',
      points: [
        { t: 'Shiftdan polgacha oyna', d: 'Har bir xonaga kun bo‘yi tabiiy yorug‘lik tushadi.' },
        { t: 'Yashil hovli', d: 'Avtomobilsiz ichki hovli, daraxtlar va bolalar maydonchasi.' },
        { t: 'Balkon va terrasalar', d: 'Osma balkonlar va yuqori qavatlarda penthauslar.' },
      ],
    },
    arch: {
      eyebrow: 'Arxitektura',
      title: 'Aniq o‘lchamlar, halol materiallar',
      text: 'Shisha fasad, to‘q bronza profillar va yog‘och spandrel panellari binoga issiq, lekin qat’iy ko‘rinish beradi.',
      rows: { floors: 'Qavatlar', size: 'Bino o‘lchami', storey: 'Qavat balandligi', module: 'Fasad moduli', balcony: 'Balkon chuqurligi', height: 'Umumiy balandlik' },
      tower: 'Bino',
      metres: 'm',
      storeys: 'qavat',
    },
    gallery: {
      eyebrow: 'Galereya',
      title: 'Qurilish bosqichlari',
      note: 'Kadrlar shu sahifadagi 3D modeldan olingan.',
      close: 'Yopish',
      prev: 'Oldingi',
      next: 'Keyingi',
      open: 'Kattalashtirish',
    },
    apts: {
      eyebrow: 'Xonadonlar',
      title: 'O‘zingizga mos rejani toping',
      text: 'Narx va mavjudlik bo‘yicha tanlang, keyin 3D selektorda aniq qavat va xonadonni ko‘ring.',
      rooms: (n) => `${n} xonali`,
      area: 'Maydon',
      from: 'Narxi',
      available: 'bo‘sh',
      choose: '3D selektorda ko‘rish',
    },
    loc: {
      eyebrow: 'Bosh reja',
      title: 'Hammasi bir hovlida',
      text: 'Binolar, yo‘laklar, parkovka va bolalar maydonchasi uchastkada qanday joylashgani. Loyiha namoyish uchun, haqiqiy manzili yo‘q.',
      plan: 'Uchastka bosh rejasi: ikki bino, maysalar, yo‘laklar, parkovka va bolalar maydonchasi',
      legend: { tower: 'Binolar', lawn: 'Maysalar', path: 'Yo‘laklar', parking: 'Parkovka', play: 'Bolalar maydonchasi' },
    },
    contact: {
      eyebrow: 'Aloqa',
      title: 'Xonadonni ko‘rishga yoziling',
      text: 'Bu namoyish loyihasi: forma ishlash tartibini ko‘rsatadi, ma’lumotlar hech qayerga yuborilmaydi.',
      name: 'Ismingiz',
      phone: 'Telefon',
      message: 'Xabar',
      send: 'Yuborish',
      demo: 'Rahmat. Bu namoyish, so‘rovingiz yuborilmadi va saqlanmadi.',
    },
    footer: 'Namoyish / portfolio loyihasi. Barcha ma’lumotlar o‘ylab topilgan.',
    fallback: {
      title: 'Qurilish bosqichlari',
      text: 'Qurilmangizda WebGL mavjud emas, shuning uchun 3D sahna o‘rniga bosqichlar rasmlarda ko‘rsatilgan.',
    },
    back: 'Bosh sahifa',
  },
  ru: {
    skip: 'Перейти к содержанию',
    nav: {
      about: 'Проект',
      architecture: 'Архитектура',
      gallery: 'Галерея',
      apartments: 'Квартиры',
      location: 'Генплан',
      contact: 'Контакты',
    },
    menu: 'Меню',
    cta: 'Выбрать квартиру',
    hero: {
      eyebrow: 'Премиальный жилой комплекс',
      title: 'Zarafshon Residence',
      text: 'Два дома строятся с нуля у вас на глазах. Прокручивайте вниз, а при возврате наверх процесс пойдёт назад.',
      scroll: 'Прокрутите вниз',
      units: 'квартиры',
      from: 'от',
      floors: 'этажные дома',
    },
    overlay: { floors: 'эт.', stages: 'Этапы строительства', timeline: 'Хронология строительства', canvas: 'Поэтапное строительство двух жилых домов' },
    about: {
      eyebrow: 'О проекте',
      title: 'Комплекс для света, природы и тишины',
      text: 'Два дома расположены вокруг зелёного двора. На первом этаже коммерция, выше квартиры с панорамным остеклением.',
      points: [
        { t: 'Окна в пол', d: 'Естественный свет в каждой комнате в течение всего дня.' },
        { t: 'Зелёный двор', d: 'Двор без машин, деревья и детская площадка.' },
        { t: 'Балконы и террасы', d: 'Консольные балконы и пентхаусы на верхних этажах.' },
      ],
    },
    arch: {
      eyebrow: 'Архитектура',
      title: 'Точные размеры, честные материалы',
      text: 'Стеклянный фасад, тёмно-бронзовые профили и деревянные спандрелы дают дому тёплый и строгий облик.',
      rows: { floors: 'Этажи', size: 'Размер дома', storey: 'Высота этажа', module: 'Модуль фасада', balcony: 'Глубина балкона', height: 'Общая высота' },
      tower: 'Дом',
      metres: 'м',
      storeys: 'эт.',
    },
    gallery: {
      eyebrow: 'Галерея',
      title: 'Этапы строительства',
      note: 'Кадры сняты с 3D-модели на этой странице.',
      close: 'Закрыть',
      prev: 'Назад',
      next: 'Вперёд',
      open: 'Увеличить',
    },
    apts: {
      eyebrow: 'Квартиры',
      title: 'Найдите подходящую планировку',
      text: 'Выберите по цене и наличию, затем посмотрите конкретный этаж и квартиру в 3D-селекторе.',
      rooms: (n) => `${n}-комнатная`,
      area: 'Площадь',
      from: 'Цена',
      available: 'свободно',
      choose: 'Смотреть в 3D-селекторе',
    },
    loc: {
      eyebrow: 'Генплан',
      title: 'Всё в одном дворе',
      text: 'Как на участке расположены дома, дорожки, парковка и детская площадка. Проект демонстрационный, реального адреса нет.',
      plan: 'Генплан участка: два дома, газоны, дорожки, парковка и детская площадка',
      legend: { tower: 'Дома', lawn: 'Газоны', path: 'Дорожки', parking: 'Парковка', play: 'Детская площадка' },
    },
    contact: {
      eyebrow: 'Контакты',
      title: 'Запишитесь на просмотр',
      text: 'Это демонстрационный проект: форма показывает порядок работы, данные никуда не отправляются.',
      name: 'Ваше имя',
      phone: 'Телефон',
      message: 'Сообщение',
      send: 'Отправить',
      demo: 'Спасибо. Это демонстрация, заявка не отправлена и не сохранена.',
    },
    footer: 'Демонстрационный / портфолио-проект. Все данные вымышлены.',
    fallback: {
      title: 'Этапы строительства',
      text: 'Ваше устройство не поддерживает WebGL, поэтому вместо 3D-сцены этапы показаны на изображениях.',
    },
    back: 'На главную',
  },
};
