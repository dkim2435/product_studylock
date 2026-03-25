// Room layout definitions
// All study floors are same size (20x14), different furniture arrangements
// 14 unique themes, then repeat with variations

import { RoomLayout, FurnitureItem, WindowDef } from './types';

const W = 0;
const F = 1;
const COLS = 20;
const ROWS = 14;
const MAX_PER_FLOOR = 20;
const MAX_BREAK_ROOM = 30;

// Theme colors per floor
export const FLOOR_THEMES: { name: string; icon: string; floorPattern: number; wallColor: string; wallHighlight: string; bgColor: string }[] = [
  { name: 'Classic Library',  icon: '📖', floorPattern: 1, wallColor: '#3d2b1f', wallHighlight: '#4e3829', bgColor: '#1a1410' },
  { name: 'Modern Study',    icon: '📚', floorPattern: 3, wallColor: '#2a2a3d', wallHighlight: '#3a3a50', bgColor: '#12121e' },
  { name: 'Cozy Corner',     icon: '🛋', floorPattern: 2, wallColor: '#3d2020', wallHighlight: '#4e3030', bgColor: '#1a1010' },
  { name: 'Quiet Room',      icon: '🤫', floorPattern: 4, wallColor: '#20303d', wallHighlight: '#304050', bgColor: '#101820' },
  { name: 'Night Owl',       icon: '🦉', floorPattern: 6, wallColor: '#1a1a2e', wallHighlight: '#252540', bgColor: '#0a0a18' },
  { name: 'Greenhouse',      icon: '🌱', floorPattern: 7, wallColor: '#1e3320', wallHighlight: '#2a4030', bgColor: '#0e1a10' },
  { name: 'Minimal',         icon: '⬜', floorPattern: 0, wallColor: '#333333', wallHighlight: '#444444', bgColor: '#1a1a1a' },
  { name: 'Vintage',         icon: '📜', floorPattern: 5, wallColor: '#3d3020', wallHighlight: '#4e4030', bgColor: '#1a1510' },
  { name: 'Open Study',      icon: '🌃', floorPattern: 8, wallColor: '#1a2030', wallHighlight: '#283040', bgColor: '#0a1018' },
  { name: 'Art Studio',      icon: '🎨', floorPattern: 2, wallColor: '#332b3d', wallHighlight: '#443850', bgColor: '#18141a' },
  { name: 'Music Room',      icon: '🎵', floorPattern: 4, wallColor: '#2d2030', wallHighlight: '#3e3040', bgColor: '#141018' },
  { name: 'Zen Room',        icon: '🧘', floorPattern: 0, wallColor: '#2a3028', wallHighlight: '#3a4038', bgColor: '#121814' },
  { name: 'Archive',         icon: '📦', floorPattern: 1, wallColor: '#302820', wallHighlight: '#403830', bgColor: '#181410' },
  { name: 'Dark Room',       icon: '🌑', floorPattern: 1, wallColor: '#1a1410', wallHighlight: '#241c14', bgColor: '#0a0806' },
];

export const BREAK_THEMES: Record<string, { name: string; icon: string; floorPattern: number; wallColor: string; wallHighlight: string; bgColor: string }> = {
  cafe:   { name: 'Cafe Lounge',     icon: '☕', floorPattern: 5, wallColor: '#3d3020', wallHighlight: '#4e4030', bgColor: '#1a1510' },
  garden: { name: 'Outdoor Garden',  icon: '🌿', floorPattern: 7, wallColor: '#1e3320', wallHighlight: '#2a4030', bgColor: '#0e1a10' },
};

export function getFloorTheme(floor: number) {
  const idx = (floor - 1) % FLOOR_THEMES.length;
  const theme = FLOOR_THEMES[idx];
  const isRepeat = floor > FLOOR_THEMES.length;
  return {
    ...theme,
    name: isRepeat ? `${theme.name} II` : theme.name,
    isDarkRoom: idx === 13, // Dark Room special rendering
  };
}

export { MAX_PER_FLOOR, MAX_BREAK_ROOM };

function makeEmptyTiles(): number[][] {
  return Array.from({ length: ROWS }, (_, y) =>
    Array.from({ length: COLS }, (_, x) =>
      (y <= 1 || y === ROWS - 1 || x === 0 || x === COLS - 1) ? W : F
    )
  );
}

function addDeskRow(
  furniture: FurnitureItem[], seats: RoomLayout['seats'],
  sid: number, deskRow: number, startCol: number, count: number, spacing: number,
  prefix: string, chairType: string = 'WOODEN_CHAIR/WOODEN_CHAIR_BACK',
): number {
  for (let i = 0; i < count; i++) {
    const col = startCol + i * spacing;
    furniture.push({ id: `${prefix}_d${i}`, type: 'DESK/DESK_FRONT', col, row: deskRow, widthTiles: 2, heightTiles: 1 });
    furniture.push({ id: `${prefix}_c${i}`, type: chairType, col, row: deskRow + 1, widthTiles: 1, heightTiles: 1, isSeat: true, seatOffset: { x: 0, y: -6 } });
    seats.push({ id: `seat_${sid}`, col, row: deskRow + 1, furnitureId: `${prefix}_c${i}` });
    sid++;
  }
  return sid;
}

function addSideBookShelves(furniture: FurnitureItem[], p: string, count: number) {
  for (let i = 0; i < count; i++) {
    furniture.push({ id: `${p}_lbs${i}`, type: 'BOOKSHELF/BOOKSHELF', col: 1, row: 3 + i * 2, widthTiles: 1, heightTiles: 2 });
    furniture.push({ id: `${p}_rbs${i}`, type: 'BOOKSHELF/BOOKSHELF', col: 18, row: 3 + i * 2, widthTiles: 1, heightTiles: 2 });
  }
}

function addWallDecor(furniture: FurnitureItem[], p: string, variant: number) {
  furniture.push({ id: `${p}_clk`, type: 'CLOCK/CLOCK', col: 9 + (variant % 3), row: 0, widthTiles: 1, heightTiles: 2 });
  if (variant % 2 === 0) {
    furniture.push({ id: `${p}_pt1`, type: 'LARGE_PAINTING/LARGE_PAINTING', col: 5 + (variant % 4), row: 0, widthTiles: 2, heightTiles: 2 });
  } else {
    furniture.push({ id: `${p}_pt1`, type: 'SMALL_PAINTING/SMALL_PAINTING', col: 6, row: 0, widthTiles: 1, heightTiles: 2 });
    furniture.push({ id: `${p}_pt2`, type: 'SMALL_PAINTING_2/SMALL_PAINTING_2', col: 13, row: 0, widthTiles: 1, heightTiles: 2 });
  }
  furniture.push({ id: `${p}_hp1`, type: 'HANGING_PLANT/HANGING_PLANT', col: 4 + (variant % 5), row: 1, widthTiles: 1, heightTiles: 1 });
  furniture.push({ id: `${p}_hp2`, type: 'HANGING_PLANT/HANGING_PLANT', col: 12 + (variant % 3), row: 1, widthTiles: 1, heightTiles: 1 });
}

function addCornerPlants(furniture: FurnitureItem[], p: string) {
  furniture.push({ id: `${p}_p1`, type: 'LARGE_PLANT/LARGE_PLANT', col: 2, row: 2, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_p2`, type: 'LARGE_PLANT/LARGE_PLANT', col: 17, row: 2, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_p3`, type: 'PLANT/PLANT', col: 2, row: 12, widthTiles: 1, heightTiles: 1 });
  furniture.push({ id: `${p}_p4`, type: 'PLANT/PLANT', col: 17, row: 12, widthTiles: 1, heightTiles: 1 });
}

// Standard window placements for top wall (row 0, 2 tiles wide x 2 tiles tall)
// Avoids col 0 and col 19 (side walls) and checks around existing wall furniture
function addTopWindows(cols: number[], windows: WindowDef[]): WindowDef[] {
  cols.forEach(c => windows.push({ col: c, row: 0, width: 2, height: 2 }));
  return windows;
}

// ============ 1F Classic Library ============
function layout_classic(p: string): RoomLayout {
  const tiles = makeEmptyTiles();
  const furniture: FurnitureItem[] = [];
  const seats: RoomLayout['seats'] = [];
  let sid = 0;

  // Top wall bookshelves (reduced to make room for windows)
  furniture.push({ id: `${p}_tbs0`, type: 'DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF', col: 1, row: 1, widthTiles: 2, heightTiles: 2 });
  furniture.push({ id: `${p}_tbs1`, type: 'DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF', col: 7, row: 1, widthTiles: 2, heightTiles: 2 });
  furniture.push({ id: `${p}_tbs2`, type: 'DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF', col: 16, row: 1, widthTiles: 2, heightTiles: 2 });
  furniture.push({ id: `${p}_clk`, type: 'CLOCK/CLOCK', col: 10, row: 0, widthTiles: 1, heightTiles: 2 });
  addSideBookShelves(furniture, p, 5);
  // Center bookshelves
  furniture.push({ id: `${p}_cb1`, type: 'BOOKSHELF/BOOKSHELF', col: 9, row: 3, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_cb2`, type: 'BOOKSHELF/BOOKSHELF', col: 10, row: 3, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_cb3`, type: 'BOOKSHELF/BOOKSHELF', col: 9, row: 9, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_cb4`, type: 'BOOKSHELF/BOOKSHELF', col: 10, row: 9, widthTiles: 1, heightTiles: 2 });
  // Desks
  sid = addDeskRow(furniture, seats, sid, 5, 3, 3, 2, `${p}_l1`);
  sid = addDeskRow(furniture, seats, sid, 8, 3, 3, 2, `${p}_l2`);
  sid = addDeskRow(furniture, seats, sid, 5, 12, 3, 2, `${p}_r1`);
  sid = addDeskRow(furniture, seats, sid, 8, 12, 3, 2, `${p}_r2`);
  // Reading nook
  furniture.push({ id: `${p}_cc1`, type: 'CUSHIONED_CHAIR/CUSHIONED_CHAIR_FRONT', col: 4, row: 11, widthTiles: 1, heightTiles: 1, isSeat: true, seatOffset: { x: 0, y: -6 } });
  seats.push({ id: `seat_${sid++}`, col: 4, row: 11, furnitureId: `${p}_cc1` });
  furniture.push({ id: `${p}_cc2`, type: 'CUSHIONED_CHAIR/CUSHIONED_CHAIR_FRONT', col: 15, row: 11, widthTiles: 1, heightTiles: 1, isSeat: true, seatOffset: { x: 0, y: -6 } });
  seats.push({ id: `seat_${sid++}`, col: 15, row: 11, furnitureId: `${p}_cc2` });
  furniture.push({ id: `${p}_cf1`, type: 'COFFEE/COFFEE', col: 5, row: 11, widthTiles: 1, heightTiles: 1 });
  furniture.push({ id: `${p}_cf2`, type: 'COFFEE/COFFEE', col: 14, row: 11, widthTiles: 1, heightTiles: 1 });
  addCornerPlants(furniture, p);
  // Windows on top wall
  const windows: WindowDef[] = [];
  addTopWindows([4, 12], windows);
  return { cols: COLS, rows: ROWS, tiles, furniture, seats, windows };
}

// ============ 2F Modern Study ============
function layout_modern(p: string): RoomLayout {
  const tiles = makeEmptyTiles();
  const furniture: FurnitureItem[] = [];
  const seats: RoomLayout['seats'] = [];
  let sid = 0;
  furniture.push({ id: `${p}_clk`, type: 'CLOCK/CLOCK', col: 9, row: 0, widthTiles: 1, heightTiles: 2 });
  addSideBookShelves(furniture, p, 3);
  // Bookshelves at edges, windows in between
  furniture.push({ id: `${p}_tbs0`, type: 'DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF', col: 1, row: 1, widthTiles: 2, heightTiles: 2 });
  furniture.push({ id: `${p}_tbs1`, type: 'DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF', col: 16, row: 1, widthTiles: 2, heightTiles: 2 });
  sid = addDeskRow(furniture, seats, sid, 4, 3, 4, 3, `${p}_r1`, 'CUSHIONED_CHAIR/CUSHIONED_CHAIR_BACK');
  sid = addDeskRow(furniture, seats, sid, 7, 4, 4, 3, `${p}_r2`, 'CUSHIONED_CHAIR/CUSHIONED_CHAIR_BACK');
  sid = addDeskRow(furniture, seats, sid, 10, 3, 4, 3, `${p}_r3`, 'CUSHIONED_CHAIR/CUSHIONED_CHAIR_BACK');
  addCornerPlants(furniture, p);
  const windows: WindowDef[] = [];
  addTopWindows([4, 12], windows);
  return { cols: COLS, rows: ROWS, tiles, furniture, seats, windows };
}

// ============ 3F Cozy Corner ============
function layout_cozy(p: string): RoomLayout {
  const tiles = makeEmptyTiles();
  const furniture: FurnitureItem[] = [];
  const seats: RoomLayout['seats'] = [];
  let sid = 0;
  furniture.push({ id: `${p}_clk`, type: 'CLOCK/CLOCK', col: 10, row: 0, widthTiles: 1, heightTiles: 2 });
  addSideBookShelves(furniture, p, 4);
  // Bookshelves with windows between
  furniture.push({ id: `${p}_tbs0`, type: 'DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF', col: 1, row: 1, widthTiles: 2, heightTiles: 2 });
  furniture.push({ id: `${p}_tbs1`, type: 'DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF', col: 7, row: 1, widthTiles: 2, heightTiles: 2 });
  furniture.push({ id: `${p}_tbs2`, type: 'DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF', col: 16, row: 1, widthTiles: 2, heightTiles: 2 });
  // Sofa + table groups
  const spots = [[3, 4], [8, 4], [13, 4], [3, 7], [8, 7], [13, 7], [5, 10], [10, 10]];
  spots.forEach(([col, row], i) => {
    furniture.push({ id: `${p}_sf${i}`, type: 'SOFA/SOFA_FRONT', col, row, widthTiles: 2, heightTiles: 1 });
    furniture.push({ id: `${p}_st${i}`, type: 'COFFEE_TABLE/COFFEE_TABLE', col, row: row + 1, widthTiles: 1, heightTiles: 1 });
    furniture.push({ id: `${p}_sc${i}`, type: 'CUSHIONED_CHAIR/CUSHIONED_CHAIR_FRONT', col: col + 1, row: row + 1, widthTiles: 1, heightTiles: 1, isSeat: true, seatOffset: { x: 0, y: -6 } });
    seats.push({ id: `seat_${sid++}`, col: col + 1, row: row + 1, furnitureId: `${p}_sc${i}` });
    furniture.push({ id: `${p}_cf${i}`, type: 'COFFEE/COFFEE', col, row: row + 1, widthTiles: 1, heightTiles: 1 });
  });
  addCornerPlants(furniture, p);
  const windows: WindowDef[] = [];
  addTopWindows([4, 12], windows);
  return { cols: COLS, rows: ROWS, tiles, furniture, seats, windows };
}

// ============ 4F Research Lab ============
function layout_lab(p: string): RoomLayout {
  const tiles = makeEmptyTiles();
  const furniture: FurnitureItem[] = [];
  const seats: RoomLayout['seats'] = [];
  let sid = 0;
  furniture.push({ id: `${p}_clk`, type: 'CLOCK/CLOCK', col: 10, row: 0, widthTiles: 1, heightTiles: 2 });
  // Long tables
  for (const row of [4, 7, 10]) {
    for (let i = 0; i < 4; i++) furniture.push({ id: `${p}_t${row}_${i}`, type: 'TABLE_FRONT/TABLE_FRONT', col: 3 + i * 3, row, widthTiles: 2, heightTiles: 1 });
    sid = addDeskRow(furniture, seats, sid, row, 3, 5, 3, `${p}_r${row}`);
  }
  addSideBookShelves(furniture, p, 3);
  addCornerPlants(furniture, p);
  const windows: WindowDef[] = [];
  addTopWindows([3, 8, 14], windows);
  return { cols: COLS, rows: ROWS, tiles, furniture, seats, windows };
}

// ============ 5F Night Owl ============
function layout_nightowl(p: string): RoomLayout {
  const tiles = makeEmptyTiles();
  const furniture: FurnitureItem[] = [];
  const seats: RoomLayout['seats'] = [];
  let sid = 0;
  furniture.push({ id: `${p}_clk`, type: 'CLOCK/CLOCK', col: 10, row: 0, widthTiles: 1, heightTiles: 2 });
  addSideBookShelves(furniture, p, 5);
  furniture.push({ id: `${p}_tbs0`, type: 'DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF', col: 1, row: 1, widthTiles: 2, heightTiles: 2 });
  furniture.push({ id: `${p}_tbs1`, type: 'DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF', col: 7, row: 1, widthTiles: 2, heightTiles: 2 });
  furniture.push({ id: `${p}_tbs2`, type: 'DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF', col: 16, row: 1, widthTiles: 2, heightTiles: 2 });
  sid = addDeskRow(furniture, seats, sid, 4, 3, 5, 3, `${p}_r1`);
  sid = addDeskRow(furniture, seats, sid, 7, 4, 4, 3, `${p}_r2`);
  sid = addDeskRow(furniture, seats, sid, 10, 3, 5, 3, `${p}_r3`);
  addCornerPlants(furniture, p);
  furniture.push({ id: `${p}_cac1`, type: 'CACTUS/CACTUS', col: 9, row: 12, widthTiles: 1, heightTiles: 1 });
  const windows: WindowDef[] = [];
  addTopWindows([4, 12], windows);
  return { cols: COLS, rows: ROWS, tiles, furniture, seats, windows };
}

// ============ 6F Greenhouse ============
function layout_greenhouse(p: string): RoomLayout {
  const tiles = makeEmptyTiles();
  const furniture: FurnitureItem[] = [];
  const seats: RoomLayout['seats'] = [];
  let sid = 0;
  // Plants along top wall (between windows)
  furniture.push({ id: `${p}_tp0`, type: 'LARGE_PLANT/LARGE_PLANT', col: 1, row: 1, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_tp1`, type: 'LARGE_PLANT/LARGE_PLANT', col: 7, row: 1, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_tp2`, type: 'LARGE_PLANT/LARGE_PLANT', col: 11, row: 1, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_tp3`, type: 'LARGE_PLANT/LARGE_PLANT', col: 17, row: 1, widthTiles: 1, heightTiles: 2 });
  for (let i = 0; i < 5; i++) {
    furniture.push({ id: `${p}_lp${i}`, type: i % 2 === 0 ? 'LARGE_PLANT/LARGE_PLANT' : 'PLANT_2/PLANT_2', col: 1, row: 3 + i * 2, widthTiles: 1, heightTiles: i % 2 === 0 ? 2 : 1 });
    furniture.push({ id: `${p}_rp${i}`, type: i % 2 === 0 ? 'LARGE_PLANT/LARGE_PLANT' : 'PLANT/PLANT', col: 18, row: 3 + i * 2, widthTiles: 1, heightTiles: i % 2 === 0 ? 2 : 1 });
  }
  furniture.push({ id: `${p}_mp1`, type: 'PLANT/PLANT', col: 9, row: 6, widthTiles: 1, heightTiles: 1 });
  furniture.push({ id: `${p}_mp2`, type: 'PLANT_2/PLANT_2', col: 10, row: 6, widthTiles: 1, heightTiles: 1 });
  sid = addDeskRow(furniture, seats, sid, 4, 3, 3, 2, `${p}_l1`);
  sid = addDeskRow(furniture, seats, sid, 7, 3, 3, 2, `${p}_l2`);
  sid = addDeskRow(furniture, seats, sid, 4, 12, 3, 2, `${p}_r1`);
  sid = addDeskRow(furniture, seats, sid, 7, 12, 3, 2, `${p}_r2`);
  sid = addDeskRow(furniture, seats, sid, 10, 5, 4, 3, `${p}_b1`);
  // Greenhouse gets extra windows — lots of natural light
  const windows: WindowDef[] = [];
  addTopWindows([3, 8, 13], windows);
  return { cols: COLS, rows: ROWS, tiles, furniture, seats, windows };
}

// ============ 7F Minimal ============
function layout_minimal(p: string): RoomLayout {
  const tiles = makeEmptyTiles();
  const furniture: FurnitureItem[] = [];
  const seats: RoomLayout['seats'] = [];
  let sid = 0;
  furniture.push({ id: `${p}_clk`, type: 'CLOCK/CLOCK', col: 9, row: 0, widthTiles: 1, heightTiles: 2 });
  // Very few items, lots of space — big windows for open feel
  sid = addDeskRow(furniture, seats, sid, 5, 4, 3, 4, `${p}_r1`, 'CUSHIONED_CHAIR/CUSHIONED_CHAIR_BACK');
  sid = addDeskRow(furniture, seats, sid, 9, 5, 3, 4, `${p}_r2`, 'CUSHIONED_CHAIR/CUSHIONED_CHAIR_BACK');
  furniture.push({ id: `${p}_p1`, type: 'PLANT/PLANT', col: 2, row: 3, widthTiles: 1, heightTiles: 1 });
  furniture.push({ id: `${p}_p2`, type: 'PLANT/PLANT', col: 17, row: 3, widthTiles: 1, heightTiles: 1 });
  // Minimal room = lots of windows
  const windows: WindowDef[] = [];
  addTopWindows([2, 6, 12, 16], windows);
  return { cols: COLS, rows: ROWS, tiles, furniture, seats, windows };
}

// ============ 8F Vintage ============
function layout_vintage(p: string): RoomLayout {
  const tiles = makeEmptyTiles();
  const furniture: FurnitureItem[] = [];
  const seats: RoomLayout['seats'] = [];
  let sid = 0;
  furniture.push({ id: `${p}_clk`, type: 'CLOCK/CLOCK', col: 10, row: 0, widthTiles: 1, heightTiles: 2 });
  // Bookshelves with windows — old library with natural light
  furniture.push({ id: `${p}_tbs0`, type: 'DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF', col: 1, row: 1, widthTiles: 2, heightTiles: 2 });
  furniture.push({ id: `${p}_tbs1`, type: 'DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF', col: 6, row: 1, widthTiles: 2, heightTiles: 2 });
  furniture.push({ id: `${p}_tbs2`, type: 'DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF', col: 12, row: 1, widthTiles: 2, heightTiles: 2 });
  furniture.push({ id: `${p}_tbs3`, type: 'DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF', col: 16, row: 1, widthTiles: 2, heightTiles: 2 });
  addSideBookShelves(furniture, p, 5);
  furniture.push({ id: `${p}_cb1`, type: 'BOOKSHELF/BOOKSHELF', col: 5, row: 5, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_cb2`, type: 'BOOKSHELF/BOOKSHELF', col: 14, row: 5, widthTiles: 1, heightTiles: 2 });
  sid = addDeskRow(furniture, seats, sid, 4, 7, 3, 2, `${p}_r1`);
  sid = addDeskRow(furniture, seats, sid, 7, 3, 2, 3, `${p}_r2l`);
  sid = addDeskRow(furniture, seats, sid, 7, 12, 2, 3, `${p}_r2r`);
  sid = addDeskRow(furniture, seats, sid, 10, 5, 4, 3, `${p}_r3`);
  addCornerPlants(furniture, p);
  const windows: WindowDef[] = [];
  addTopWindows([4, 14], windows);
  return { cols: COLS, rows: ROWS, tiles, furniture, seats, windows };
}

// ============ 9F Rooftop ============
function layout_rooftop(p: string): RoomLayout {
  const tiles = makeEmptyTiles();
  const furniture: FurnitureItem[] = [];
  const seats: RoomLayout['seats'] = [];
  let sid = 0;
  // Open feel — mostly windows across the top wall (rooftop view!)
  furniture.push({ id: `${p}_hp1`, type: 'HANGING_PLANT/HANGING_PLANT', col: 1, row: 1, widthTiles: 1, heightTiles: 1 });
  furniture.push({ id: `${p}_hp2`, type: 'HANGING_PLANT/HANGING_PLANT', col: 18, row: 1, widthTiles: 1, heightTiles: 1 });
  // Scattered seating — outdoor cafe style
  const spots = [[3, 4], [7, 3], [12, 4], [16, 3], [4, 7], [9, 7], [14, 7], [6, 10], [11, 10]];
  spots.forEach(([col, row], i) => {
    furniture.push({ id: `${p}_t${i}`, type: 'COFFEE_TABLE/COFFEE_TABLE', col, row, widthTiles: 1, heightTiles: 1 });
    furniture.push({ id: `${p}_c${i}`, type: 'WOODEN_CHAIR/WOODEN_CHAIR_BACK', col, row: row + 1, widthTiles: 1, heightTiles: 1, isSeat: true, seatOffset: { x: 0, y: -6 } });
    seats.push({ id: `seat_${sid++}`, col, row: row + 1, furnitureId: `${p}_c${i}` });
  });
  // Plants as railing
  for (let i = 0; i < 6; i++) furniture.push({ id: `${p}_rp${i}`, type: 'PLANT/PLANT', col: 1 + i * 3, row: 12, widthTiles: 1, heightTiles: 1 });
  furniture.push({ id: `${p}_lp1`, type: 'LARGE_PLANT/LARGE_PLANT', col: 1, row: 3, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_lp2`, type: 'LARGE_PLANT/LARGE_PLANT', col: 18, row: 3, widthTiles: 1, heightTiles: 2 });
  // Rooftop = panoramic windows
  const windows: WindowDef[] = [];
  addTopWindows([3, 6, 9, 12, 15], windows);
  return { cols: COLS, rows: ROWS, tiles, furniture, seats, windows };
}

// ============ 10F Art Studio ============
function layout_artstudio(p: string): RoomLayout {
  const tiles = makeEmptyTiles();
  const furniture: FurnitureItem[] = [];
  const seats: RoomLayout['seats'] = [];
  let sid = 0;
  // Paintings on wall (fewer, with windows for natural light)
  furniture.push({ id: `${p}_wp0`, type: 'LARGE_PAINTING/LARGE_PAINTING', col: 1, row: 0, widthTiles: 2, heightTiles: 2 });
  furniture.push({ id: `${p}_wp1`, type: 'SMALL_PAINTING/SMALL_PAINTING', col: 7, row: 0, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_wp2`, type: 'SMALL_PAINTING_2/SMALL_PAINTING_2', col: 11, row: 0, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_wp3`, type: 'LARGE_PAINTING/LARGE_PAINTING', col: 16, row: 0, widthTiles: 2, heightTiles: 2 });
  addSideBookShelves(furniture, p, 3);
  sid = addDeskRow(furniture, seats, sid, 4, 3, 4, 3, `${p}_r1`, 'CUSHIONED_CHAIR/CUSHIONED_CHAIR_BACK');
  sid = addDeskRow(furniture, seats, sid, 7, 4, 4, 3, `${p}_r2`, 'CUSHIONED_CHAIR/CUSHIONED_CHAIR_BACK');
  sid = addDeskRow(furniture, seats, sid, 10, 3, 4, 3, `${p}_r3`, 'CUSHIONED_CHAIR/CUSHIONED_CHAIR_BACK');
  addCornerPlants(furniture, p);
  // Art studio needs good natural light
  const windows: WindowDef[] = [];
  addTopWindows([4, 8, 13], windows);
  return { cols: COLS, rows: ROWS, tiles, furniture, seats, windows };
}

// ============ 11F Music Room ============
function layout_musicroom(p: string): RoomLayout {
  const tiles = makeEmptyTiles();
  const furniture: FurnitureItem[] = [];
  const seats: RoomLayout['seats'] = [];
  let sid = 0;
  furniture.push({ id: `${p}_clk`, type: 'CLOCK/CLOCK', col: 10, row: 0, widthTiles: 1, heightTiles: 2 });
  addSideBookShelves(furniture, p, 4);
  furniture.push({ id: `${p}_tbs0`, type: 'DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF', col: 1, row: 1, widthTiles: 2, heightTiles: 2 });
  furniture.push({ id: `${p}_tbs1`, type: 'DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF', col: 7, row: 1, widthTiles: 2, heightTiles: 2 });
  furniture.push({ id: `${p}_tbs2`, type: 'DOUBLE_BOOKSHELF/DOUBLE_BOOKSHELF', col: 16, row: 1, widthTiles: 2, heightTiles: 2 });
  // Scattered individual desks
  const deskSpots = [[3, 4], [7, 4], [12, 4], [16, 4], [5, 7], [10, 7], [14, 7], [4, 10], [8, 10], [13, 10], [17, 10]];
  deskSpots.forEach(([col, row], i) => {
    furniture.push({ id: `${p}_d${i}`, type: 'DESK/DESK_FRONT', col, row, widthTiles: 2, heightTiles: 1 });
    furniture.push({ id: `${p}_c${i}`, type: 'CUSHIONED_CHAIR/CUSHIONED_CHAIR_BACK', col, row: row + 1, widthTiles: 1, heightTiles: 1, isSeat: true, seatOffset: { x: 0, y: -6 } });
    seats.push({ id: `seat_${sid++}`, col, row: row + 1, furnitureId: `${p}_c${i}` });
  });
  addCornerPlants(furniture, p);
  const windows: WindowDef[] = [];
  addTopWindows([4, 12], windows);
  return { cols: COLS, rows: ROWS, tiles, furniture, seats, windows };
}

// ============ 12F Zen Room ============
function layout_zen(p: string): RoomLayout {
  const tiles = makeEmptyTiles();
  const furniture: FurnitureItem[] = [];
  const seats: RoomLayout['seats'] = [];
  let sid = 0;
  // Very clean, symmetrical — windows for tranquility
  furniture.push({ id: `${p}_clk`, type: 'CLOCK/CLOCK', col: 9, row: 0, widthTiles: 1, heightTiles: 2 });
  // Symmetrical desk pairs
  const pairs = [[4, 5], [14, 5], [4, 8], [14, 8], [9, 5], [9, 8]];
  pairs.forEach(([col, row], i) => {
    furniture.push({ id: `${p}_d${i}`, type: 'SMALL_TABLE/SMALL_TABLE_FRONT', col, row, widthTiles: 1, heightTiles: 1 });
    furniture.push({ id: `${p}_c${i}`, type: 'CUSHIONED_CHAIR/CUSHIONED_CHAIR_FRONT', col, row: row + 1, widthTiles: 1, heightTiles: 1, isSeat: true, seatOffset: { x: 0, y: -6 } });
    seats.push({ id: `seat_${sid++}`, col, row: row + 1, furnitureId: `${p}_c${i}` });
  });
  // Zen plants
  furniture.push({ id: `${p}_p1`, type: 'PLANT/PLANT', col: 2, row: 4, widthTiles: 1, heightTiles: 1 });
  furniture.push({ id: `${p}_p2`, type: 'PLANT/PLANT', col: 17, row: 4, widthTiles: 1, heightTiles: 1 });
  furniture.push({ id: `${p}_p3`, type: 'CACTUS/CACTUS', col: 2, row: 9, widthTiles: 1, heightTiles: 1 });
  furniture.push({ id: `${p}_p4`, type: 'CACTUS/CACTUS', col: 17, row: 9, widthTiles: 1, heightTiles: 1 });
  furniture.push({ id: `${p}_lp1`, type: 'LARGE_PLANT/LARGE_PLANT', col: 1, row: 6, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_lp2`, type: 'LARGE_PLANT/LARGE_PLANT', col: 18, row: 6, widthTiles: 1, heightTiles: 2 });
  const windows: WindowDef[] = [];
  addTopWindows([3, 6, 12, 15], windows);
  return { cols: COLS, rows: ROWS, tiles, furniture, seats, windows };
}

// ============ 13F Archive ============
function layout_archive(p: string): RoomLayout {
  const tiles = makeEmptyTiles();
  const furniture: FurnitureItem[] = [];
  const seats: RoomLayout['seats'] = [];
  let sid = 0;
  furniture.push({ id: `${p}_clk`, type: 'CLOCK/CLOCK', col: 10, row: 0, widthTiles: 1, heightTiles: 2 });
  // Bookshelves with small windows
  furniture.push({ id: `${p}_tbs0`, type: 'BOOKSHELF/BOOKSHELF', col: 1, row: 1, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_tbs1`, type: 'BOOKSHELF/BOOKSHELF', col: 2, row: 1, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_tbs2`, type: 'BOOKSHELF/BOOKSHELF', col: 6, row: 1, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_tbs3`, type: 'BOOKSHELF/BOOKSHELF', col: 13, row: 1, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_tbs4`, type: 'BOOKSHELF/BOOKSHELF', col: 16, row: 1, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_tbs5`, type: 'BOOKSHELF/BOOKSHELF', col: 17, row: 1, widthTiles: 1, heightTiles: 2 });
  addSideBookShelves(furniture, p, 5);
  // Rows of shelves with desks between
  for (let i = 0; i < 3; i++) {
    furniture.push({ id: `${p}_mbs${i}a`, type: 'BOOKSHELF/BOOKSHELF', col: 5, row: 3 + i * 3, widthTiles: 1, heightTiles: 2 });
    furniture.push({ id: `${p}_mbs${i}b`, type: 'BOOKSHELF/BOOKSHELF', col: 14, row: 3 + i * 3, widthTiles: 1, heightTiles: 2 });
  }
  sid = addDeskRow(furniture, seats, sid, 4, 7, 3, 2, `${p}_r1`);
  sid = addDeskRow(furniture, seats, sid, 7, 7, 3, 2, `${p}_r2`);
  sid = addDeskRow(furniture, seats, sid, 10, 7, 3, 2, `${p}_r3`);
  addCornerPlants(furniture, p);
  // Archive — just a couple small windows between bookshelves
  const windows: WindowDef[] = [];
  addTopWindows([4, 14], windows);
  return { cols: COLS, rows: ROWS, tiles, furniture, seats, windows };
}

// ============ 14F Dark Room ============
function layout_darkroom(p: string): RoomLayout {
  const tiles = makeEmptyTiles();
  const furniture: FurnitureItem[] = [];
  const seats: RoomLayout['seats'] = [];
  let sid = 0;
  // Minimal wall decor
  furniture.push({ id: `${p}_clk`, type: 'CLOCK/CLOCK', col: 9, row: 0, widthTiles: 1, heightTiles: 2 });
  // Spread out desks with lots of space — each has its own "light pool"
  const deskSpots = [[4, 4], [9, 4], [14, 4], [4, 7], [9, 7], [14, 7], [4, 10], [9, 10], [14, 10]];
  deskSpots.forEach(([col, row], i) => {
    furniture.push({ id: `${p}_lamp${i}`, type: 'PLANT/PLANT', col: col - 1, row, widthTiles: 1, heightTiles: 1 });
    furniture.push({ id: `${p}_d${i}`, type: 'DESK/DESK_FRONT', col, row, widthTiles: 2, heightTiles: 1 });
    furniture.push({ id: `${p}_c${i}`, type: 'CUSHIONED_CHAIR/CUSHIONED_CHAIR_BACK', col, row: row + 1, widthTiles: 1, heightTiles: 1, isSeat: true, seatOffset: { x: 0, y: -6 } });
    seats.push({ id: `seat_${sid++}`, col, row: row + 1, furnitureId: `${p}_c${i}` });
  });
  // Side bookshelves for subtle depth
  furniture.push({ id: `${p}_bs1`, type: 'BOOKSHELF/BOOKSHELF', col: 1, row: 4, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_bs2`, type: 'BOOKSHELF/BOOKSHELF', col: 1, row: 8, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_bs3`, type: 'BOOKSHELF/BOOKSHELF', col: 18, row: 4, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: `${p}_bs4`, type: 'BOOKSHELF/BOOKSHELF', col: 18, row: 8, widthTiles: 1, heightTiles: 2 });
  // Dark room — one small window for moonlight/ambient
  const windows: WindowDef[] = [];
  addTopWindows([5], windows);
  return { cols: COLS, rows: ROWS, tiles, furniture, seats, windows };
}

// ============ CAFE ============
export function generateCafeLayout(): RoomLayout {
  const tiles = makeEmptyTiles();
  const furniture: FurnitureItem[] = [];
  const seats: RoomLayout['seats'] = [];
  let sid = 0;
  // Counter
  for (let i = 0; i < 3; i++) furniture.push({ id: `ct${i}`, type: 'TABLE_FRONT/TABLE_FRONT', col: 2 + i * 2, row: 2, widthTiles: 2, heightTiles: 1 });
  for (let i = 0; i < 3; i++) furniture.push({ id: `cc${i}`, type: 'COFFEE/COFFEE', col: 3 + i * 2, row: 2, widthTiles: 1, heightTiles: 1 });
  for (let i = 0; i < 4; i++) furniture.push({ id: `cbs${i}`, type: 'BOOKSHELF/BOOKSHELF', col: 2 + i * 2, row: 1, widthTiles: 1, heightTiles: 2 });
  addWallDecor(furniture, 'cafe', 7);
  // Cafe seating
  const spots = [[3, 5], [7, 5], [11, 5], [15, 5], [3, 8], [7, 8], [11, 8], [15, 8], [5, 11], [9, 11], [13, 11]];
  spots.forEach(([col, row], i) => {
    furniture.push({ id: `tbl${i}`, type: 'COFFEE_TABLE/COFFEE_TABLE', col, row, widthTiles: 1, heightTiles: 1 });
    furniture.push({ id: `cof${i}`, type: 'COFFEE/COFFEE', col, row, widthTiles: 1, heightTiles: 1 });
    furniture.push({ id: `ch${i}`, type: 'CUSHIONED_CHAIR/CUSHIONED_CHAIR_FRONT', col, row: row + 1, widthTiles: 1, heightTiles: 1, isSeat: true, seatOffset: { x: 0, y: -6 } });
    seats.push({ id: `seat_${sid++}`, col, row: row + 1, furnitureId: `ch${i}` });
  });
  furniture.push({ id: 'lp1', type: 'LARGE_PLANT/LARGE_PLANT', col: 1, row: 4, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: 'lp2', type: 'LARGE_PLANT/LARGE_PLANT', col: 18, row: 4, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: 'lp3', type: 'LARGE_PLANT/LARGE_PLANT', col: 1, row: 10, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: 'lp4', type: 'LARGE_PLANT/LARGE_PLANT', col: 18, row: 10, widthTiles: 1, heightTiles: 2 });
  furniture.push({ id: 'bn', type: 'BIN/BIN', col: 1, row: 2, widthTiles: 1, heightTiles: 1 });
  const windows: WindowDef[] = [];
  addTopWindows([12, 16], windows);
  return { cols: COLS, rows: ROWS, tiles, furniture, seats, windows };
}

// ============ GARDEN ============
export function generateGardenLayout(): RoomLayout {
  const tiles = makeEmptyTiles();
  const furniture: FurnitureItem[] = [];
  const seats: RoomLayout['seats'] = [];
  let sid = 0;
  // Plant border
  for (let i = 0; i < 6; i++) furniture.push({ id: `tp${i}`, type: 'LARGE_PLANT/LARGE_PLANT', col: 1 + i * 3, row: 1, widthTiles: 1, heightTiles: 2 });
  for (let i = 0; i < 5; i++) {
    furniture.push({ id: `lp${i}`, type: 'LARGE_PLANT/LARGE_PLANT', col: 1, row: 3 + i * 2, widthTiles: 1, heightTiles: 2 });
    furniture.push({ id: `rp${i}`, type: 'LARGE_PLANT/LARGE_PLANT', col: 18, row: 3 + i * 2, widthTiles: 1, heightTiles: 2 });
  }
  for (let i = 0; i < 5; i++) furniture.push({ id: `bp${i}`, type: i % 2 === 0 ? 'PLANT/PLANT' : 'PLANT_2/PLANT_2', col: 2 + i * 3, row: 12, widthTiles: 1, heightTiles: 1 });
  // Bench seating
  const spots = [[4, 4], [9, 4], [14, 4], [4, 7], [9, 7], [14, 7], [6, 10], [11, 10]];
  spots.forEach(([col, row], i) => {
    furniture.push({ id: `gt${i}`, type: 'COFFEE_TABLE/COFFEE_TABLE', col, row, widthTiles: 1, heightTiles: 1 });
    furniture.push({ id: `gc${i}a`, type: 'WOODEN_CHAIR/WOODEN_CHAIR_BACK', col, row: row + 1, widthTiles: 1, heightTiles: 1, isSeat: true, seatOffset: { x: 0, y: -6 } });
    seats.push({ id: `seat_${sid++}`, col, row: row + 1, furnitureId: `gc${i}a` });
    furniture.push({ id: `gc${i}b`, type: 'WOODEN_CHAIR/WOODEN_CHAIR_BACK', col: col + 1, row: row + 1, widthTiles: 1, heightTiles: 1, isSeat: true, seatOffset: { x: 0, y: -6 } });
    seats.push({ id: `seat_${sid++}`, col: col + 1, row: row + 1, furnitureId: `gc${i}b` });
    furniture.push({ id: `gcf${i}`, type: 'COFFEE/COFFEE', col, row, widthTiles: 1, heightTiles: 1 });
  });
  // Garden is outdoor — no windows, sky replaces top wall, rain falls everywhere
  return { cols: COLS, rows: ROWS, tiles, furniture, seats, outdoor: true };
}

// ============ LAYOUT DISPATCH ============
const FLOOR_LAYOUTS: ((p: string) => RoomLayout)[] = [
  layout_classic,    // 1F
  layout_modern,     // 2F
  layout_cozy,       // 3F
  layout_lab,        // 4F
  layout_nightowl,   // 5F
  layout_greenhouse, // 6F
  layout_minimal,    // 7F
  layout_vintage,    // 8F
  layout_rooftop,    // 9F
  layout_artstudio,  // 10F
  layout_musicroom,  // 11F
  layout_zen,        // 12F
  layout_archive,    // 13F
  layout_darkroom,   // 14F
];

export function getLayoutForRoom(roomId: string): RoomLayout {
  if (roomId === 'garden') return generateGardenLayout();
  if (roomId === 'cafe') return generateCafeLayout();
  const match = roomId.match(/^(\d+)F$/);
  if (match) {
    const floor = parseInt(match[1]);
    const idx = (floor - 1) % FLOOR_LAYOUTS.length;
    return FLOOR_LAYOUTS[idx](`f${floor}`);
  }
  return FLOOR_LAYOUTS[0]('f1');
}
