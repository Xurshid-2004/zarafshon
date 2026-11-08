// ============================================================================
//  Scene colour + lighting values for the two ambient modes.
// ============================================================================

import type { ApartmentStatus, Theme } from './types';

export interface ScenePalette {
  bg: string;
  /** Colour the ground plane dissolves into; matched to the sky horizon. */
  fogColor: string;
  fogNear: number;
  fogFar: number;

  ambient: number;
  sunIntensity: number;
  sunColor: string;
  /** Direction of the key light; the sky dome uses the same vector. */
  sun: [number, number, number];
  /** Sky dome gradient. */
  skyZenith: string;
  skyHorizon: string;
  skyGround: string;
  sunDisc: string;
  /** 0 = clear, 1 = heavy cloud. */
  cloudAmount: number;
  hemiIntensity: number;
  skyColor: string;
  groundBounce: string;

  terrain: string;
  grass: string;
  grassDark: string;
  concrete: string;
  plaza: string;
  asphalt: string;
  lineMark: string;

  slab: string;
  frame: string;
  wood: string;
  core: string;
  glass: string;
  glassOpacity: number;
  railing: string;

  shopGlass: string;
  shopGlow: string;
  signage: string;

  trunk: string;
  foliage: [string, string, string];
  bench: string;
  lampPost: string;
  lampGlow: string;

  playFrame: string;
  playSoft: string;
  playAccent: string;
  sand: string;

  carBody: string[];
  carGlass: string;
  wheel: string;

  gridLine: string;
  guide: string;
}

const dark: ScenePalette = {
  bg: '#1A2230',
  fogColor: '#4A4334',
  fogNear: 120,
  fogFar: 340,

  ambient: 0.14,
  sunIntensity: 1.5,
  sunColor: '#FFB071',
  sun: [96, 7, 30],
  skyZenith: '#132038',
  skyHorizon: '#C97A3C',
  skyGround: '#241E16',
  sunDisc: '#FFC07A',
  cloudAmount: 0.6,
  hemiIntensity: 0.26,
  skyColor: '#2A3F60',
  groundBounce: '#241F18',

  terrain: '#3B3327',
  grass: '#2B4428',
  grassDark: '#20341F',
  concrete: '#3A3F45',
  plaza: '#4A4942',
  asphalt: '#22262A',
  lineMark: '#C9C6B8',

  slab: '#C6C0B4',
  frame: '#6A665E',
  wood: '#A9703C',
  core: '#6E675E',
  glass: '#4D6B84',
  glassOpacity: 0.95,
  railing: '#A9C6D8',

  shopGlass: '#8FD3E8',
  shopGlow: '#FFCE85',
  signage: '#E0A458',

  trunk: '#564130',
  foliage: ['#4C7A3A', '#5E8F45', '#3A6230'],
  bench: '#8A5E34',
  lampPost: '#2B3036',
  lampGlow: '#FFD9A0',

  playFrame: '#C45B48',
  playSoft: '#94553C',
  playAccent: '#F0C040',
  sand: '#C9AE78',

  carBody: ['#B8C0C7', '#2F3A46', '#8E2F33', '#20506B', '#D8D4CC', '#38424A'],
  carGlass: '#1B2127',
  wheel: '#14171A',

  gridLine: '#2DD4A7',
  guide: '#5BE0C0',
};

const light: ScenePalette = {
  ...dark,
  bg: '#C7DAEA',
  // warm haze so distance reads as aerial perspective, not as a grey wall
  fogColor: '#C2C2B2',
  fogNear: 150,
  fogFar: 540,

  // Low sun, low ambient: contrast is what makes a render read as a photo.
  ambient: 0.15,
  sunIntensity: 4.0,
  sunColor: '#FFDDB6',
  sun: [86, 26, 44],
  skyZenith: '#1D56A4',
  skyHorizon: '#DACBB4',
  skyGround: '#6C6049',
  sunDisc: '#FFEDD2',
  cloudAmount: 0.42,
  hemiIntensity: 0.28,
  skyColor: '#86ACDC',
  groundBounce: '#7C6744',

  terrain: '#6B5E46',
  grass: '#4A6B38',
  grassDark: '#33502A',
  concrete: '#A8A49C',
  plaza: '#B9B2A4',
  asphalt: '#5E6166',
  lineMark: '#EDEAE2',

  slab: '#C9C2B4',
  frame: '#6E6A62',
  wood: '#C08347',
  core: '#9A948B',
  glass: '#7CA3C2',
  glassOpacity: 0.95,
  railing: '#CFE2EE',

  shopGlass: '#BCE4F2',
  shopGlow: '#FFE2AE',

  trunk: '#6B5440',
  foliage: ['#6B9A48', '#83B45C', '#4E7A38'],
  bench: '#A8763F',
  lampPost: '#5B6168',
  lampGlow: '#FFEBC4',

  sand: '#DCC693',
  gridLine: '#13856B',
  guide: '#1FA587',
};

export const PALETTE: Record<Theme, ScenePalette> = { dark, light };

export const STATUS_COLOR: Record<ApartmentStatus, string> = {
  available: '#2DD4A7',
  reserved: '#F0A33C',
  sold: '#D4556B',
};

export const STATUS_CLASS: Record<ApartmentStatus, string> = {
  available: 'text-status-available',
  reserved: 'text-status-reserved',
  sold: 'text-status-sold',
};
