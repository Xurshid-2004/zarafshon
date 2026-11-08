// ============================================================================
//  Global UI + selection state.
//
//  Design note: the 3D scene never subscribes to this store through hooks for
//  hover-rate values. Scene meshes read `useApp.getState()` inside useFrame and
//  lerp their own materials, so moving the pointer across 69 apartment meshes
//  costs zero React re-renders. Only the DOM overlay uses hook selectors.
// ============================================================================

import { create } from 'zustand';
import { APARTMENT_BY_ID, BUILDING_BY_ID, getFloor } from './buildingConfig';
import type { Apartment, BuildingId, FloorData, Lang, Theme } from './types';

export type Phase = 'intro' | 'ready';
export type Quality = 'high' | 'low';

export interface AppState {
  lang: Lang;
  theme: Theme;
  phase: Phase;
  quality: Quality;

  /** The hero screen gates the WebGL canvas: the build sequence starts on enter. */
  entered: boolean;
  /** Complex-wide photo gallery modal. */
  galleryOpen: boolean;

  hoveredFloor: string | null;
  hoveredApartment: string | null;
  hoveredAmenity: string | null;

  selectedBuilding: BuildingId | null;
  selectedFloor: number | null;
  selectedApartment: string | null;

  showInterior: boolean;
  toast: string | null;

  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  toggleTheme: () => void;
  setPhase: (phase: Phase) => void;
  setQuality: (q: Quality) => void;
  enter: () => void;
  setGalleryOpen: (open: boolean) => void;

  setHoveredFloor: (id: string | null) => void;
  setHoveredApartment: (id: string | null) => void;
  setHoveredAmenity: (id: string | null) => void;

  selectFloor: (building: BuildingId, level: number) => void;
  clearFloor: () => void;
  selectApartment: (id: string) => void;
  clearApartment: () => void;
  toggleInterior: () => void;
  resetView: () => void;
  setToast: (msg: string | null) => void;
}

export const useApp = create<AppState>((set, get) => ({
  lang: 'uz',
  theme: 'light',
  phase: 'intro',
  quality: 'high',

  entered: false,
  galleryOpen: false,

  hoveredFloor: null,
  hoveredApartment: null,
  hoveredAmenity: null,

  selectedBuilding: null,
  selectedFloor: null,
  selectedApartment: null,

  showInterior: false,
  toast: null,

  setLang: (lang) => set({ lang }),
  toggleLang: () => set({ lang: get().lang === 'uz' ? 'ru' : 'uz' }),
  toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
  setPhase: (phase) => set({ phase }),
  setQuality: (quality) => {
    if (get().quality !== quality) set({ quality });
  },
  enter: () => {
    if (!get().entered) set({ entered: true, galleryOpen: false });
  },
  setGalleryOpen: (galleryOpen) => set({ galleryOpen }),

  setHoveredFloor: (id) => {
    if (get().hoveredFloor !== id) set({ hoveredFloor: id });
  },
  setHoveredApartment: (id) => {
    if (get().hoveredApartment !== id) set({ hoveredApartment: id });
  },
  setHoveredAmenity: (id) => {
    if (get().hoveredAmenity !== id) set({ hoveredAmenity: id });
  },

  selectFloor: (building, level) => {
    const s = get();
    // Clicking the open floor again closes it.
    if (s.selectedBuilding === building && s.selectedFloor === level) {
      set({ selectedBuilding: null, selectedFloor: null, selectedApartment: null, showInterior: false });
      return;
    }
    set({
      selectedBuilding: building,
      selectedFloor: level,
      selectedApartment: null,
      showInterior: false,
    });
  },

  clearFloor: () =>
    set({
      selectedBuilding: null,
      selectedFloor: null,
      selectedApartment: null,
      showInterior: false,
    }),

  selectApartment: (id) => {
    const apt = APARTMENT_BY_ID.get(id);
    if (!apt) return;
    set({
      selectedApartment: id,
      selectedBuilding: apt.building,
      selectedFloor: apt.floor,
    });
  },

  clearApartment: () => set({ selectedApartment: null }),

  toggleInterior: () => set({ showInterior: !get().showInterior }),

  resetView: () =>
    set({
      selectedBuilding: null,
      selectedFloor: null,
      selectedApartment: null,
      showInterior: false,
      hoveredFloor: null,
      hoveredApartment: null,
      hoveredAmenity: null,
    }),

  setToast: (toast) => set({ toast }),
}));

// --- derived selectors -----------------------------------------------------

export function useSelectedFloorData(): FloorData | null {
  const building = useApp((s) => s.selectedBuilding);
  const level = useApp((s) => s.selectedFloor);
  if (!building || level === null) return null;
  return getFloor(building, level) ?? null;
}

export function useSelectedApartment(): Apartment | null {
  const id = useApp((s) => s.selectedApartment);
  if (!id) return null;
  return APARTMENT_BY_ID.get(id) ?? null;
}

/** Imperative read used by useFrame loops — no subscription, no re-render. */
export const appState = () => useApp.getState();

export function floorAvailableCount(building: BuildingId, level: number): number {
  const f = getFloor(building, level);
  if (!f) return 0;
  return f.apartments.filter((a) => a.status === 'available').length;
}

export function buildingOf(id: BuildingId) {
  return BUILDING_BY_ID[id];
}
