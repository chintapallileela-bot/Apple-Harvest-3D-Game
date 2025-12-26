export enum GameStatus {
  IDLE = 'IDLE',
  SPAWNING = 'SPAWNING',
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
}