// Character management system with sprite-based animation
// Reference: pixel-agents characters.ts

import { Character, TILE_SIZE } from './types';
import { RoomLayout } from './types';

const WALK_ANIM_SPEED = 0.15; // seconds per frame
const TYPE_ANIM_SPEED = 0.3;
const CHARACTER_PALETTES = 6;

export class CharacterManager {
  private characters: Map<string, Character> = new Map();
  private occupiedSeats: Set<string> = new Set();
  private layout: RoomLayout;

  constructor(layout: RoomLayout) {
    this.layout = layout;
  }

  addCharacter(id: string, isLocal: boolean = false, forcePalette?: number): Character | null {
    // Find available seat
    const availableSeat = this.layout.seats.find(s => !this.occupiedSeats.has(s.id));
    if (!availableSeat) return null;

    this.occupiedSeats.add(availableSeat.id);

    const palette = forcePalette ?? (this.characters.size % CHARACTER_PALETTES);
    const character: Character = {
      id,
      col: availableSeat.col,
      row: availableSeat.row,
      // Pixel position: center of the tile
      x: availableSeat.col * TILE_SIZE + TILE_SIZE / 2,
      y: availableSeat.row * TILE_SIZE + TILE_SIZE / 2,
      palette,
      state: 'typing', // Sitting and working
      direction: 'down',
      animFrame: Math.floor(Math.random() * 4), // Randomize start frame
      animTimer: Math.random(), // Randomize animation offset
      seatId: availableSeat.id,
      isLocal,
    };

    this.characters.set(id, character);
    return character;
  }

  removeCharacter(id: string): void {
    const character = this.characters.get(id);
    if (character?.seatId) {
      this.occupiedSeats.delete(character.seatId);
    }
    this.characters.delete(id);
  }

  update(deltaTime: number): void {
    this.characters.forEach(ch => {
      ch.animTimer += deltaTime;

      const speed = ch.state === 'typing' ? TYPE_ANIM_SPEED : WALK_ANIM_SPEED;

      if (ch.animTimer >= speed) {
        ch.animTimer -= speed;
        ch.animFrame++;

        // Occasionally change direction while typing (looking around)
        if (ch.state === 'typing' && Math.random() < 0.05) {
          const dirs: Character['direction'][] = ['down', 'down', 'down', 'left', 'right'];
          ch.direction = dirs[Math.floor(Math.random() * dirs.length)];
        }
      }
    });
  }

  getCharacters(): Character[] {
    return Array.from(this.characters.values());
  }

  getAvailableSeats(): number {
    return this.layout.seats.length - this.occupiedSeats.size;
  }

  getMaxSeats(): number {
    return this.layout.seats.length;
  }

  clear(): void {
    this.characters.clear();
    this.occupiedSeats.clear();
  }
}
