export enum GameStatus {
  IDLE = 'IDLE',
  SPAWNING = 'SPAWNING',
  COUNTDOWN = 'COUNTDOWN',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST'
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
}

export interface ParticleData {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  color: string;
  type: 'seed' | 'leaf' | 'dust';
  size: number;
  rotation: number;
}