// Core types for the pixel-art study room engine

export const TILE_SIZE = 16; // Sprite pixels per tile
export const DEFAULT_ZOOM = 2; // Integer zoom level - shows full room

export interface Position {
  x: number; // In tile coordinates
  y: number;
}

export interface FurnitureItem {
  id: string;
  type: string; // Asset key e.g. 'DESK_FRONT', 'BOOKSHELF'
  col: number; // Tile column
  row: number; // Tile row
  widthTiles: number;
  heightTiles: number;
  isSeat?: boolean; // Can a character sit here
  seatOffset?: { x: number; y: number }; // Where character sits relative to furniture
  zY?: number; // For z-sorting
}

export interface Character {
  id: string;
  col: number; // Tile position
  row: number;
  x: number; // Pixel position (for smooth movement)
  y: number;
  palette: number; // 0-5 character sprite variant
  state: 'idle' | 'walking' | 'typing';
  direction: 'down' | 'up' | 'right' | 'left';
  animFrame: number;
  animTimer: number;
  seatId?: string;
  isLocal?: boolean;
}

export interface RoomLayout {
  cols: number;
  rows: number;
  tiles: number[][]; // 0=wall, 1=floor
  furniture: FurnitureItem[];
  seats: { id: string; col: number; row: number; furnitureId: string }[];
}

export interface AmbienceSound {
  id: string;
  name: string;
  icon: string;
  volume: number;
  src: string;
}

export interface TimerState {
  mode: 'focus' | 'break' | 'longBreak' | 'idle';
  timeLeft: number;
  totalPomodoros: number;
  isRunning: boolean;
}
