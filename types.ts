
export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST'
}

export interface AppleData {
  id: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  delay: number;
}
