// Asset loader - loads all PNG sprite images
// Uses Image() objects for drawImage-based rendering

export interface LoadedAssets {
  characters: HTMLImageElement[]; // char_0.png through char_5.png
  floors: HTMLImageElement[]; // floor_0.png through floor_8.png
  furniture: Map<string, HTMLImageElement>; // keyed by path
  loaded: boolean;
}

const FURNITURE_ASSETS = [
  'BOOKSHELF/BOOKSHELF',
  'DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF',
  'DESK/DESK_FRONT',
  'DESK/DESK_SIDE',
  'WOODEN_CHAIR/WOODEN_CHAIR_FRONT',
  'WOODEN_CHAIR/WOODEN_CHAIR_BACK',
  'CUSHIONED_CHAIR/CUSHIONED_CHAIR_FRONT',
  'CUSHIONED_CHAIR/CUSHIONED_CHAIR_BACK',
  'PC/PC_FRONT_ON_1',
  'PC/PC_FRONT_ON_2',
  'PC/PC_BACK',
  'PLANT/PLANT',
  'LARGE_PLANT/LARGE_PLANT',
  'CACTUS/CACTUS',
  'CLOCK/CLOCK',
  'LARGE_PAINTING/LARGE_PAINTING',
  'SMALL_PAINTING/SMALL_PAINTING',
  'SMALL_PAINTING_2/SMALL_PAINTING_2',
  'HANGING_PLANT/HANGING_PLANT',
  'COFFEE/COFFEE',
  'COFFEE_TABLE/COFFEE_TABLE',
  'CUSHIONED_BENCH/CUSHIONED_BENCH',
  'SMALL_TABLE/SMALL_TABLE_FRONT',
  'SMALL_TABLE/SMALL_TABLE_SIDE',
  'TABLE_FRONT/TABLE_FRONT',
  'SOFA/SOFA_FRONT',
  'SOFA/SOFA_SIDE',
  'PLANT_2/PLANT_2',
  'WOODEN_BENCH/WOODEN_BENCH',
  'BIN/BIN',
  'POT/POT',
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn(`Failed to load: ${src}`);
      // Return a 1x1 transparent image as fallback
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const fallback = new Image();
      fallback.src = canvas.toDataURL();
      fallback.onload = () => resolve(fallback);
    };
    img.src = src;
  });
}

export async function loadAllAssets(): Promise<LoadedAssets> {
  // Load characters (6 variants)
  const characterPromises = Array.from({ length: 6 }, (_, i) =>
    loadImage(`/assets/characters/char_${i}.png`)
  );

  // Load floors (9 variants)
  const floorPromises = Array.from({ length: 9 }, (_, i) =>
    loadImage(`/assets/floors/floor_${i}.png`)
  );

  // Load furniture
  const furniturePromises = FURNITURE_ASSETS.map(async (path) => {
    const img = await loadImage(`/assets/furniture/${path}.png`);
    return { key: path, img };
  });

  const [characters, floors, furnitureResults] = await Promise.all([
    Promise.all(characterPromises),
    Promise.all(floorPromises),
    Promise.all(furniturePromises),
  ]);

  const furniture = new Map<string, HTMLImageElement>();
  furnitureResults.forEach(({ key, img }) => furniture.set(key, img));

  return { characters, floors, furniture, loaded: true };
}

// Character sprite sheet constants
// Each character PNG is 112x96
// 7 columns (frames) x 16px wide = 112
// 3 rows (directions) x 32px tall = 96
// Visible sprite is 16x24, bottom-aligned in 16x32 cell
export const CHAR_FRAME_W = 16;
export const CHAR_FRAME_H = 32;
export const CHAR_VISIBLE_H = 24;
export const CHAR_COLS = 7;
// Row 0 = DOWN, Row 1 = UP, Row 2 = RIGHT
// Frame order: walk1, walk2, walk3, type1, type2, read1, read2

export function getCharacterFrame(
  direction: 'down' | 'up' | 'right' | 'left',
  state: 'idle' | 'walking' | 'typing',
  animFrame: number
): { row: number; col: number; flipX: boolean } {
  let row: number;
  let flipX = false;

  switch (direction) {
    case 'down': row = 0; break;
    case 'up': row = 1; break;
    case 'right': row = 2; break;
    case 'left': row = 2; flipX = true; break;
  }

  let col: number;
  switch (state) {
    case 'idle':
      col = 1; // walk2 = standing pose
      break;
    case 'walking':
      // Cycle: walk1, walk2, walk3, walk2
      const walkFrames = [0, 1, 2, 1];
      col = walkFrames[animFrame % 4];
      break;
    case 'typing':
      // Cycle: type1, type2
      col = 3 + (animFrame % 2);
      break;
  }

  return { row, col, flipX };
}
