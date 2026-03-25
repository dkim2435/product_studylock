// Sprite-based Canvas 2D renderer
// Reference: pixel-agents renderer.ts
// Uses actual PNG sprite assets via drawImage()

import { TILE_SIZE, DEFAULT_ZOOM, Character, FurnitureItem } from './types';
import { LoadedAssets, CHAR_FRAME_W, CHAR_FRAME_H, getCharacterFrame } from './assetLoader';

interface ZDrawable {
  zY: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private zoom: number;
  private assets: LoadedAssets | null = null;
  private isNight: boolean = false;
  private isRaining: boolean = false;
  private frameCount: number = 0;
  private floorPattern: number = 1;
  private wallColor: string = '#3d2b1f';
  private wallHighlight: string = '#4e3829';
  private bgColor: string = '#1a1410';
  private isDarkRoom: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.zoom = DEFAULT_ZOOM;
  }

  setAssets(assets: LoadedAssets) {
    this.assets = assets;
  }

  setZoom(zoom: number) {
    this.zoom = Math.max(1, Math.min(10, Math.round(zoom)));
  }

  setTimeOfDay(isNight: boolean) {
    this.isNight = isNight;
  }

  setTheme(theme: { floorPattern?: number; wallColor?: string; wallHighlight?: string; bgColor?: string; isDarkRoom?: boolean }) {
    this.isDarkRoom = theme.isDarkRoom ?? false;
    if (theme.floorPattern !== undefined) this.floorPattern = theme.floorPattern;
    if (theme.wallColor) this.wallColor = theme.wallColor;
    if (theme.wallHighlight) this.wallHighlight = theme.wallHighlight;
    if (theme.bgColor) this.bgColor = theme.bgColor;
  }

  setWeather(isRaining: boolean) {
    this.isRaining = isRaining;
  }

  resize(containerWidth: number, containerHeight: number) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = containerWidth * dpr;
    this.canvas.height = containerHeight * dpr;
    this.canvas.style.width = `${containerWidth}px`;
    this.canvas.style.height = `${containerHeight}px`;
  }

  render(
    tiles: number[][],
    furniture: FurnitureItem[],
    characters: Character[],
    cols: number,
    rows: number,
  ) {
    if (!this.assets?.loaded) return;

    this.frameCount++;
    const ctx = this.ctx;
    const zoom = this.zoom;
    const tileScreenSize = TILE_SIZE * zoom;

    // Pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;

    // Clear
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Center the map in canvas
    const mapW = cols * tileScreenSize;
    const mapH = rows * tileScreenSize;
    const offsetX = Math.floor((this.canvas.width - mapW) / 2);
    const offsetY = Math.floor((this.canvas.height - mapH) / 2);

    // 1. Render floor tiles and walls
    this.renderTiles(ctx, tiles, cols, rows, offsetX, offsetY, zoom, tileScreenSize);

    // 2. Collect all z-sortable entities
    const drawables: ZDrawable[] = [];

    // Add furniture
    furniture.forEach(f => {
      const zY = f.zY ?? (f.row + f.heightTiles) * TILE_SIZE;
      drawables.push({
        zY,
        draw: (c) => this.drawFurniture(c, f, offsetX, offsetY, zoom),
      });
    });

    // Add characters
    characters.forEach(ch => {
      const zY = ch.y + TILE_SIZE / 2 + 0.5;
      drawables.push({
        zY,
        draw: (c) => this.drawCharacter(c, ch, offsetX, offsetY, zoom),
      });
    });

    // 3. Z-sort and draw
    drawables.sort((a, b) => a.zY - b.zY);
    drawables.forEach(d => d.draw(ctx));

    // 4. Dark Room spotlight effect
    if (this.isDarkRoom) {
      // Use a separate offscreen canvas for the darkness mask
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = this.canvas.width;
      maskCanvas.height = this.canvas.height;
      const mctx = maskCanvas.getContext('2d')!;

      // Fill entire mask with darkness
      mctx.fillStyle = 'rgba(5, 3, 0, 0.7)';
      mctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

      // Punch out bright holes around each character
      mctx.globalCompositeOperation = 'destination-out';
      characters.forEach(ch => {
        const cx = offsetX + ch.x * zoom;
        const cy = offsetY + ch.y * zoom - 6 * zoom;
        const radius = TILE_SIZE * zoom * 2.5;

        const gradient = mctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.7)');
        gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        mctx.fillStyle = gradient;
        mctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      });

      // Draw the mask onto main canvas
      ctx.drawImage(maskCanvas, 0, 0);

      // Add warm lamp glow on top
      characters.forEach(ch => {
        const cx = offsetX + ch.x * zoom;
        const cy = offsetY + ch.y * zoom - 6 * zoom;
        const radius = TILE_SIZE * zoom * 2;

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, 'rgba(255, 180, 80, 0.12)');
        gradient.addColorStop(0.4, 'rgba(255, 160, 60, 0.06)');
        gradient.addColorStop(1, 'rgba(255, 140, 40, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      });
    } else if (this.isNight) {
      // Normal night overlay
      ctx.fillStyle = 'rgba(10, 10, 50, 0.3)';
      ctx.fillRect(offsetX, offsetY, mapW, mapH);
    }

    // 5. Rain effect
    if (this.isRaining) {
      this.renderRain(ctx, offsetX, offsetY, mapW, mapH);
    }
  }

  private renderTiles(
    ctx: CanvasRenderingContext2D,
    tiles: number[][],
    cols: number,
    rows: number,
    offsetX: number,
    offsetY: number,
    zoom: number,
    tileScreenSize: number,
  ) {
    if (!this.assets) return;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tileType = tiles[row]?.[col] ?? 0;
        const x = offsetX + col * tileScreenSize;
        const y = offsetY + row * tileScreenSize;

        if (tileType === 0) {
          // Wall
          ctx.fillStyle = this.wallColor;
          ctx.fillRect(x, y, tileScreenSize, tileScreenSize);

          // Wall top highlight
          ctx.fillStyle = this.wallHighlight;
          ctx.fillRect(x, y, tileScreenSize, Math.floor(tileScreenSize * 0.3));
        } else {
          // Floor - use floor tile sprite
          const floorImg = this.assets.floors[this.floorPattern];
          if (floorImg && floorImg.width > 1) {
            ctx.drawImage(floorImg, 0, 0, TILE_SIZE, TILE_SIZE, x, y, tileScreenSize, tileScreenSize);
          } else {
            // Fallback: checkerboard
            ctx.fillStyle = (row + col) % 2 === 0 ? '#4a3728' : '#3d2e1f';
            ctx.fillRect(x, y, tileScreenSize, tileScreenSize);
          }
        }
      }
    }
  }

  private drawFurniture(
    ctx: CanvasRenderingContext2D,
    item: FurnitureItem,
    offsetX: number,
    offsetY: number,
    zoom: number,
  ) {
    if (!this.assets) return;

    const img = this.assets.furniture.get(item.type);
    if (!img || img.width <= 1) return;

    // Furniture is drawn at its tile position
    // Sprites may be taller than their footprint (e.g., bookshelf)
    const screenX = offsetX + item.col * TILE_SIZE * zoom;
    // Align bottom of sprite with bottom of footprint
    const footprintBottomY = (item.row + item.heightTiles) * TILE_SIZE;
    const spriteH = img.height;
    const screenY = offsetY + (footprintBottomY - spriteH) * zoom;

    ctx.drawImage(
      img,
      0, 0, img.width, img.height,
      screenX, screenY,
      img.width * zoom, img.height * zoom,
    );

    // Animated PC screens
    if (item.type.startsWith('PC/PC_FRONT_ON') && this.frameCount % 40 < 20) {
      const altType = item.type.endsWith('1') ? 'PC/PC_FRONT_ON_2' : 'PC/PC_FRONT_ON_1';
      const altImg = this.assets.furniture.get(altType);
      if (altImg && altImg.width > 1) {
        ctx.drawImage(
          altImg,
          0, 0, altImg.width, altImg.height,
          screenX, screenY,
          altImg.width * zoom, altImg.height * zoom,
        );
      }
    }
  }

  private drawCharacter(
    ctx: CanvasRenderingContext2D,
    ch: Character,
    offsetX: number,
    offsetY: number,
    zoom: number,
  ) {
    if (!this.assets) return;

    const charImg = this.assets.characters[ch.palette % 6];
    if (!charImg || charImg.width <= 1) return;

    const { row, col, flipX } = getCharacterFrame(ch.direction, ch.state, ch.animFrame);

    // Source rectangle from sprite sheet
    const sx = col * CHAR_FRAME_W;
    const sy = row * CHAR_FRAME_H;

    // Sitting offset
    const sittingOffset = ch.state === 'typing' ? 6 : 0;

    // Character anchor = bottom-center of tile
    const drawW = CHAR_FRAME_W * zoom;
    const drawH = CHAR_FRAME_H * zoom;
    const drawX = Math.round(offsetX + ch.x * zoom - drawW / 2);
    const drawY = Math.round(offsetY + (ch.y + sittingOffset) * zoom - drawH);

    if (flipX) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(
        charImg,
        sx, sy, CHAR_FRAME_W, CHAR_FRAME_H,
        -(drawX + drawW), drawY, drawW, drawH,
      );
      ctx.restore();
    } else {
      ctx.drawImage(
        charImg,
        sx, sy, CHAR_FRAME_W, CHAR_FRAME_H,
        drawX, drawY, drawW, drawH,
      );
    }

    // Local player indicator
    if (ch.isLocal) {
      // Green outline
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.strokeRect(drawX - 1, drawY - 1, drawW + 2, drawH + 2);

      // "You" label
      ctx.fillStyle = '#00ff88';
      ctx.font = `bold ${Math.max(10, zoom * 4)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('You', drawX + drawW / 2, drawY - 4);
    }

    // Typing animation dots
    if (ch.state === 'typing' && this.frameCount % 60 < 30) {
      ctx.fillStyle = '#ffffff';
      const dotSize = Math.max(2, zoom);
      ctx.fillRect(drawX + drawW / 2 - dotSize * 3, drawY - dotSize * 2, dotSize, dotSize);
      ctx.fillRect(drawX + drawW / 2, drawY - dotSize * 3, dotSize, dotSize);
      ctx.fillRect(drawX + drawW / 2 + dotSize * 3, drawY - dotSize * 2, dotSize, dotSize);
    }
  }

  private renderRain(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    offsetY: number,
    mapW: number,
    mapH: number,
  ) {
    ctx.strokeStyle = 'rgba(150, 200, 255, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 80; i++) {
      const x = offsetX + ((this.frameCount * 2 + i * 47) % mapW);
      const y = offsetY + ((this.frameCount * 4 + i * 73) % mapH);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y + 8);
      ctx.stroke();
    }
  }

  getZoom() {
    return this.zoom;
  }
}
