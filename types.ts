
export enum GameStatus {
  IDLE = 'IDLE',
  SELECT_THEME = 'SELECT_THEME',
  SPAWNING = 'SPAWNING',
  COUNTDOWN = 'COUNTDOWN',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST',
  VIEWING = 'VIEWING'
}

export interface Theme {
  id: string;
  name: string;
  image: string;
  unlocked: boolean;
}

export interface AppleData {
  id: string;
  x: number;
  y: number;
  z: number; 
  size: number;
  rotation: number;
  delay: number;
  color: 'red' | 'green';
  variationSeed: number;
  targetThemeId?: string;
}

export interface ParticleData {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  color: string;
  type: 'seed' | 'leaf' | 'dust' | 'juice' | 'flesh';
  size: number;
  rotation: number;
  spinSpeed: number;
}
