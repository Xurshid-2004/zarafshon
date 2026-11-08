# CLAUDE.md — Zarafshon Residence loyihasi holati

> Bu fayl sessiyalar orasida xotira vazifasini bajaradi.
> Yangi suhbat boshlanganda birinchi boʻlib shuni oʻqing.
> Oxirgi yangilanish: 2026-11-07, 23:40 (Asia/Tashkent)

---

## 1. Loyiha

**Nomi:** Zarafshon Residence — qurilish kompaniyasi uchun interaktiv 3D xonadon selektori
**Papka:** `C:\Users\ANUBIS PC\Downloads\uy-joy-web.cloud`
**Maqsad:** Ikki bino (A = 7 qavat, B = 11 qavat), 69 xonadon, qavat izolyatsiyasi, xonadon kartochkasi, 2D reja. UZ/RU.
**Turi:** Namoyish / portfolio (haqiqiy mijoz loyihasi emas) — maʼlumotlar oʻylab topilgan, shunday qolaveradi.

---

## 2. HOZIRGI HOLAT — nima ishlaydi

Loyiha **toʻliq ishlaydi va tekshirilgan**. 51 ta manba fayl kompyuterda joyida.

- `next build` toza oʻtadi, TypeScript xatosiz
- Headless Chrome'da render tekshirildi: qurilish animatsiyasi, exploded view, xonadon drawer, 2D reja — hammasi ishlaydi
- Statik eksport ham ishlaydi, artifact sifatida chop etilgan

**Qolgan yagona qadam (foydalanuvchi bajaradi):**
```powershell
cd "C:\Users\ANUBIS PC\Downloads\uy-joy-web.cloud"
Remove-Item -Recurse -Force node_modules
npm ci
npm run dev
```
`node_modules` chala qolgan — koʻprik orqali yozish sekin boʻlgani uchun toʻxtatilgan.

---

## 3. Texnologiyalar

| Qatlam | Versiya |
|---|---|
| Next.js | 16.4.5 (App Router, Turbopack) |
| React | 19.3.1 |
| three.js | 0.187.0 |
| @react-three/fiber | 9.8.2 |
| @react-three/drei | 10.7.9 |
| @react-three/postprocessing | 3.2.2 |
| postprocessing | 6.39.6 |
| GSAP | 3.15.1 |
| zustand | 5.1.0 |
| Tailwind CSS | 3.4.19 |
| TypeScript | 7.0.2 |

---

## 4. ⚠️ QAYTA TOPMASLIK UCHUN — hal qilingan xatolar

Bular allaqachon tuzatilgan. **Qaytadan kiritmang.**

1. **`n8ao` paketi three 0.187 bilan mos emas.** Har kadrda `setupRenderTarget` xatosi beradi va **soyalarni butunlay oʻchiradi**. Paket olib tashlangan; oʻrniga `postprocessing` ning oʻz `SSAO` effekti ishlatiladi.
2. **GSAP `lagSmoothing`.** Oʻchirilgan (`gsap.ticker.lagSmoothing(0)` — `lib/introTimeline.ts`). Aks holda birinchi kadr sekin boʻlganda 5 soniyalik animatsiya daqiqalarga choʻziladi.
3. **Teksturalar animatsiyadan oldin tayyorlanadi.** `components/SceneShell.tsx` canvas'ni `texturesReady` boʻlguncha mount qilmaydi.
4. **`drei/Sky` ishlatilmaydi.** U 450 000 birlik masofada joylashadi, kamera `far` = 1200 — clipping, hech qachon koʻrinmaydi. Oʻrniga oʻz shader gumbazimiz: `components/scene/SkyDome.tsx`.
5. **R3F `gridHelper` tuzogʻi.** Obyekt qayta yaratilganda GSAP eski materialni animatsiya qilaverardi va toʻr oʻchmay qolardi. `Foundation.tsx` endi opacity ni har kadrda `introTimeline().totalTime()` dan oʻqiydi, tween ishlatmaydi.
6. **`tsconfig.json` da `baseUrl` boʻlmasligi kerak** — TypeScript 7 da olib tashlangan. Faqat `paths: { "@/*": ["./*"] }`.
7. **Artifact serveri `_` bilan boshlanadigan yoʻllarni qabul qilmaydi.** Statik eksportni chop etish uchun `out/_next` → `assets` deb nomlab, barcha `/_next/` havolalarini `/assets/` ga almashtirish kerak, `_buildManifest.js` va boshqa `_*` fayllarni oʻchirish kerak (ular zarur emas).
8. **`reactStrictMode: false`** — majburiy. StrictMode mount effektlarini ikki marta chaqiradi, GSAP tween'lari ikki marta registratsiya qilinadi.

---

## 5. Fayl strukturasi

```
app/              layout, page, globals.css, icon.svg
components/
  SceneShell.tsx       tekstura warm-up + canvas + UI
  scene/
    SceneCanvas.tsx    <Canvas>, ACES tone mapping, ekspozitsiya 0.82
    Experience.tsx     sahna ildizi, IBL, OrbitControls, SSAO+Bloom+SMAA
    SkyDome.tsx        procedural osmon (GLSL)
    Lighting.tsx       quyosh + hemisphere + rim
    Ground.tsx         zamin, maysa, yoʻlak, parkovka, bordyur
    Foundation.tsx     0-1s poydevor toʻri
    Building.tsx       bino ildizi, tom, balkon LOD
    Floor.tsx          bitta qavat, exploded view
    ApartmentMesh.tsx  xonadon hajmi + userData metadata
    Commercial.tsx     1-qavat tijorat
    FloorInterior.tsx  ichki devorlar + mebel bloklari
    Environs.tsx       daraxt (billboard), mashina (extrude), maydoncha
    Instanced.tsx      InstancedMesh yordamchisi
    materials.ts       PBR material/geometriya keshi + fasad teksturasi
    buildingGeo.ts     bino geometriyasi
    siteLayout.ts      uchastka koordinatalari
  ui/                  TopBar, FloorPanel, ApartmentDrawer, Blueprint2D,
                       Legend, ControlsHint, IntroOverlay, Toast
lib/
  types.ts  buildingConfig.ts  rng.ts  noise.ts  textures.ts
  palette.ts  store.ts  i18n.ts  introTimeline.ts  format.ts  ui.ts
```

### Mesh nomlanishi (raycasting uchun)
| Obyekt | Nom |
|---|---|
| Bino | `Building_A`, `Building_B` |
| Qavat guruhi | `bld7_floor_5`, `bld11_floor_5` |
| Qavat alt nomi | `userData.specName` = `Bld11_Floor_05` |
| Xonadon | `Bld11_F05_Apt02` |

---

## 6. QABUL QILINGAN QARORLAR (2026-11-07)

Foydalanuvchi 3 ta Instagram reel yubordi (`montani3d` va b.) va dizaynni toʻliq oʻzgartirishni soʻradi.

**Koʻrilgan reel (`montani3d`, Dc1Dn2Dxs2p) uslubi:**
- Tashqi: terrakota vertikal panjara, har balkonda zich oʻsimlik, shahar siluetı, kech tushdan keyingi yumshoq quyosh
- Oshxona: shalfey yashil qirrali (fluted) shkaflar, oq marmar, iliq eman parket, chiziqli yashirin yoritgich, shiftdan polgacha oyna
- Yotoqxona: yongʻoq yogʻoch panel, pogʻonali shiftda cove-yoritish, nozik parda, qatlamli matolar, naqshli gilam
- Umumiy: iliq yogʻoch + tabiiy tosh + oʻsimlik, sayoz DOF, sekin kamera

*(2 va 3-reel ochilmadi — Instagram ijro eta olmadi. Kerak boʻlsa ekran suratlari soʻrash kerak.)*

**Foydalanuvchi javoblari:**

| Savol | Javob |
|---|---|
| Arxitektura | **Shisha fasad qolsin, sifat oshsin** (terrakota minoraga oʻtilmaydi) |
| Fotorealizm | **Toʻliq pre-render** — Claude brauzer orqali boshqa AI'larga prompt berib rasmlarni yasatadi, yoki foydalanuvchiga promptlar beriladi |
| Interyer | **Ikkalasi** — real-time 3D xona + fotorealistik rasm galereyasi |
| Loyiha turi | **Namoyish / portfolio** |

---

## 7. KEYINGI QADAMLAR (ertaga shu yerdan davom)

### Qadam 1 — Rasmlarni generatsiya qilish
Pastdagi promptlar bilan fotorealistik rasmlar yaratiladi (8-bo'lim).
Imkoniyatlar:
- **a)** Claude sessiyadagi rasm generatsiya vositalarini sinab koʻradi (Canva / Figma / Gamma MCP) — avval ishlashini tekshirish kerak, kafolat yoʻq
- **b)** Claude foydalanuvchi brauzeri orqali uning AI hisobidan foydalanadi — **kerakli ruxsat:** Chrome ochiq + kengaytma ulangan + oʻsha sayt uchun ruxsat berilgan. Qaysi xizmat ishlatilishini foydalanuvchi aytishi kerak (Midjourney / ChatGPT / Leonardo / Freepik va h.k.)
- **c)** Foydalanuvchi promptlarni oʻzi ishlatadi va rasmlarni papkaga tashlaydi

### Qadam 2 — Rasmlarni loyihaga ulash
```
public/renders/
  exterior/hero-01.jpg  hero-02.jpg  aerial-01.jpg  evening-01.jpg
  interior/
    1room/living.jpg  bedroom.jpg  bath.jpg
    2room/living.jpg  bedroom.jpg  kitchen.jpg  bath.jpg
    3room/living.jpg  bedroom-01.jpg  bedroom-02.jpg  kitchen.jpg  bath.jpg
    penthouse/living.jpg  bedroom.jpg  terrace.jpg
  amenity/lobby.jpg  playground.jpg  courtyard.jpg  parking.jpg
```
- `lib/types.ts` → `Apartment` ga `renderSet: string` maydoni qoʻshiladi (`'1room' | '2room' | '3room' | 'penthouse'`)
- `components/ui/ApartmentDrawer.tsx` → 2D reja ostiga **rasm galereyasi** (lightbox bilan)
- Yangi komponent: `components/ui/RenderGallery.tsx`

### Qadam 3 — Shisha fasad sifatini oshirish
- Oyna romlari (mullion) hozir teksturada — eng koʻrinadigan qavatlarda haqiqiy geometriyaga oʻtkazish
- Balkon panjaralariga nozikroq detal, balkonlarga oʻsimlik (instanced)
- Fasad teksturasini 1024×512 dan 2048×1024 ga chiqarish
- Reflection probe / screen-space reflection koʻrib chiqish

### Qadam 4 — Hero sahifa
Pre-render rasmlar bilan kirish ekrani: fotorealistik hero rasm → 3D sahnaga silliq oʻtish.

---

## 8. RASM GENERATSIYA PROMPTLARI

> Ingliz tilida — rasm modellari ingliz tilida ancha yaxshi ishlaydi.
> Har biri uchun: **16:9** (exterior/hero), **3:2** (interior).
> Umumiy uslub kaliti har promptda takrorlanadi — bu izchillik uchun muhim.

### Umumiy uslub satri (har promptga qoʻshiladi)
```
architectural visualization, photorealistic, V-Ray / Corona render quality,
soft late-afternoon natural daylight, warm and calm colour grading,
shallow depth of field, no text, no watermark, no people unless stated,
8k, highly detailed, physically based materials
```

### 8.1 Tashqi — hero (16:9)
```
Photorealistic architectural visualization of a modern two-building residential
complex at golden hour. Left building 7 storeys, right building 11 storeys.
Full-height glass curtain wall facades with slim dark bronze mullions, warm
timber spandrel bands between floors, cantilevered balconies with frameless
glass balustrades and planted boxes. Ground floor is retail with lit shopfronts.
Landscaped courtyard between the buildings: manicured lawn, mature trees,
stone paving, modern benches, warm path lighting. Clear blue sky with thin
high clouds. Camera at eye level, three-quarter view, 35mm lens.
[umumiy uslub satri]
```

### 8.2 Tashqi — aerial (16:9)
```
Aerial architectural visualization of a modern residential complex, drone view
from 60 metres, slight tilt. Two glass-facade buildings (7 and 11 storeys) with
warm timber accent bands, flat roofs with parapets and rooftop plant rooms.
Surrounding site: green lawns, children's playground with terracotta rubber
surfacing, outdoor parking with marked bays and cars, tree-lined walkways.
Late afternoon, long soft shadows.
[umumiy uslub satri]
```

### 8.3 Tashqi — kechki (16:9)
```
Photorealistic evening architectural visualization of a modern residential
complex. Glass facades glowing with warm interior light, some apartments lit,
others dark. Ground-floor retail brightly lit. Warm path lighting across the
landscaped courtyard, lamp posts, illuminated playground. Deep blue twilight
sky. Reflections of light on glass and wet paving.
[umumiy uslub satri]
```

### 8.4 Interyer — mehmonxona + oshxona (3:2)
```
Photorealistic interior visualization of a modern open-plan living and kitchen
area in a new apartment. Sage-green fluted kitchen cabinetry with a white
marble waterfall island and brushed brass tapware. Warm oak herringbone floor.
Linear recessed ceiling lighting in a stepped plaster ceiling. Floor-to-ceiling
glazing with sheer curtains opening to a planted balcony. Low linen sofa, boucle
armchair, travertine coffee table, large potted plant, abstract art.
Soft late-afternoon daylight raking across the floor.
[umumiy uslub satri]
```

### 8.5 Interyer — yotoqxona (3:2)
```
Photorealistic interior visualization of a calm modern bedroom. Full-height
walnut timber wall panelling behind the bed, stepped ceiling with warm cove
lighting, slim recessed downlights. Upholstered bed with layered linen bedding
in cream and warm brown, patterned wool rug on oak flooring. Sheer floor-to-
ceiling curtains diffusing soft daylight. Bedside tables with ceramic lamps,
a framed artwork, a single plant.
[umumiy uslub satri]
```

### 8.6 Interyer — sanuzel (3:2)
```
Photorealistic interior visualization of a modern bathroom. Large-format
travertine wall and floor tiles, wall-hung oak vanity with an integrated stone
basin, backlit mirror, matte black fittings. Walk-in shower with fluted glass
screen. Niche with rolled towels and a small plant. Soft natural light from a
frosted window.
[umumiy uslub satri]
```

### 8.7 Interyer — penthaus terrassasi (3:2)
```
Photorealistic visualization of a penthouse terrace at sunset. Timber decking,
glass balustrade, outdoor lounge seating with cream cushions, planters with
ornamental grasses, a low fire table. City skyline in the distance under a warm
orange and violet sky. Warm integrated lighting in the decking edges.
[umumiy uslub satri]
```

### 8.8 Lobbi (3:2)
```
Photorealistic interior visualization of a residential building lobby.
Double-height space, travertine floor, warm timber slat wall, floating
reception desk, large pendant light cluster, lounge seating, tall planters.
Floor-to-ceiling glazing to a landscaped courtyard. Soft daylight plus warm
accent lighting.
[umumiy uslub satri]
```

### 8.9 Bolalar maydonchasi (3:2)
```
Photorealistic visualization of a modern residential courtyard playground.
Terracotta rubber safety surfacing, timber and steel climbing frame, swings,
slide tower, sandpit, benches under mature trees, low planting borders.
Children playing. Late afternoon soft light, long shadows.
[umumiy uslub satri]
```

### 8.10 Hovli / landshaft (3:2)
```
Photorealistic visualization of a landscaped residential courtyard between two
glass-facade buildings. Stone paving in a running bond pattern, manicured lawn,
mature trees, modern timber benches, low ornamental grasses, warm bollard
lighting. People walking. Soft late-afternoon light.
[umumiy uslub satri]
```

---

## 9. OCHIQ SAVOLLAR

1. Qaysi rasm generatsiya xizmati ishlatiladi? (Midjourney / ChatGPT / Leonardo / Freepik / boshqa) — hisob maʼlumotlari foydalanuvchida
2. 2 va 3-reel nimani koʻrsatardi? Sayt interfeysi bormidi? — ekran suratlari kerak
3. Hero sahifa kerakmi yoki darhol 3D sahnaga kirilsinmi?

---

## 10. MUHIM ESLATMALAR

- Javoblar **faqat oʻzbek tilida, lotin yozuvida**. Kod va terminal buyruqlari inglizcha.
- Muhit **Windows + PowerShell** — `&&` bilan buyruq zanjirlash ishlamaydi, har buyruq alohida.
- Kod kerak boʻlsa **toʻliq fayl** beriladi, qism emas.
- Yangi yechimdan oldin qisqa reja berilib, tasdiq soʻraladi.
- Gʻoyalar maqtalmaydi, zaif tomonlar ochiq aytiladi.
- Koʻprik (device bridge) sessiya davomida bir necha marta uzildi — katta fayl yozishda buni hisobga olish kerak.
