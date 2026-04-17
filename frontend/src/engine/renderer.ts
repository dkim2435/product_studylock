// Sprite-based Canvas 2D renderer
// Reference: pixel-agents renderer.ts
// Uses actual PNG sprite assets via drawImage()

import { TILE_SIZE, DEFAULT_ZOOM, Character, FurnitureItem, WindowDef } from './types';
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
  private windows: WindowDef[] = [];
  private outdoor: boolean = false;
  private maskCanvas: HTMLCanvasElement | null = null;
  private maskCtx: CanvasRenderingContext2D | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.zoom = DEFAULT_ZOOM;
  }

  private getMaskContext(): CanvasRenderingContext2D {
    if (!this.maskCanvas) {
      this.maskCanvas = document.createElement('canvas');
      this.maskCtx = this.maskCanvas.getContext('2d');
    }
    if (
      this.maskCanvas!.width !== this.canvas.width ||
      this.maskCanvas!.height !== this.canvas.height
    ) {
      this.maskCanvas!.width = this.canvas.width;
      this.maskCanvas!.height = this.canvas.height;
    }
    return this.maskCtx!;
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

  setWindows(windows: WindowDef[]) {
    this.windows = windows;
  }

  setOutdoor(outdoor: boolean) {
    this.outdoor = outdoor;
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

    // 2. Render windows with sky/weather
    this.renderWindows(ctx, offsetX, offsetY, zoom, tileScreenSize);

    // 3. Collect all z-sortable entities
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

    // 4. Z-sort and draw
    drawables.sort((a, b) => a.zY - b.zY);
    drawables.forEach(d => d.draw(ctx));

    // 5. Dark Room spotlight effect
    if (this.isDarkRoom) {
      // Reuse a single offscreen canvas for the darkness mask across frames
      const mctx = this.getMaskContext();
      const maskCanvas = this.maskCanvas!;

      // Reset any prior composite op from the previous frame
      mctx.globalCompositeOperation = 'source-over';

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

      // Punch out windows too — moonlight/daylight comes through
      this.windows.forEach(win => {
        const wx = offsetX + (win.col * TILE_SIZE + TILE_SIZE * 0.25) * zoom;
        const wy = offsetY + (win.row * TILE_SIZE + TILE_SIZE * 0.25) * zoom;
        const ww = (win.width * TILE_SIZE - TILE_SIZE * 0.5) * zoom;
        const wh = (win.height * TILE_SIZE - TILE_SIZE * 0.5) * zoom;
        const cx = wx + ww / 2;
        const cy = wy + wh / 2;
        const radius = TILE_SIZE * zoom * 3;

        const gradient = mctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.6)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
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

      // Cool moonlight glow from windows
      if (!this.isRaining) {
        this.windows.forEach(win => {
          const cx = offsetX + (win.col + win.width / 2) * TILE_SIZE * zoom;
          const cy = offsetY + (win.row + win.height) * TILE_SIZE * zoom;
          const radius = TILE_SIZE * zoom * 3;

          const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
          gradient.addColorStop(0, 'rgba(100, 120, 200, 0.08)');
          gradient.addColorStop(0.5, 'rgba(80, 100, 180, 0.03)');
          gradient.addColorStop(1, 'rgba(60, 80, 160, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
        });
      }
    } else if (this.isNight) {
      // Normal night overlay (slightly dimmed room)
      ctx.fillStyle = this.outdoor ? 'rgba(10, 10, 50, 0.35)' : 'rgba(10, 10, 50, 0.2)';
      ctx.fillRect(offsetX, offsetY, mapW, mapH);
    }

    // 6. Outdoor rain — falls on the entire room
    if (this.outdoor && this.isRaining) {
      this.renderOutdoorRain(ctx, offsetX, offsetY, mapW, mapH);
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
          if (this.outdoor && row <= 1) {
            // Outdoor: top wall replaced with sky
            this.drawSkyTile(ctx, x, y, tileScreenSize, row, col, cols);
          } else {
            // Wall
            ctx.fillStyle = this.wallColor;
            ctx.fillRect(x, y, tileScreenSize, tileScreenSize);

            // Wall top highlight
            ctx.fillStyle = this.wallHighlight;
            ctx.fillRect(x, y, tileScreenSize, Math.floor(tileScreenSize * 0.3));
          }
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

  private renderWindows(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    offsetY: number,
    zoom: number,
    tileScreenSize: number,
  ) {
    if (this.windows.length === 0) return;

    const frame = Math.max(1, Math.floor(zoom * 2)); // Frame thickness in pixels

    for (const win of this.windows) {
      const wx = offsetX + win.col * tileScreenSize;
      const wy = offsetY + win.row * tileScreenSize;
      const ww = win.width * tileScreenSize;
      const wh = win.height * tileScreenSize;

      // Inset for the glass area (inside the frame)
      const inset = frame + Math.max(1, Math.floor(zoom));
      const gx = wx + inset;
      const gy = wy + inset;
      const gw = ww - inset * 2;
      const gh = wh - inset * 2;

      // --- Sky background ---
      if (this.isNight) {
        // Night sky gradient
        const grad = ctx.createLinearGradient(gx, gy, gx, gy + gh);
        grad.addColorStop(0, '#0a0e2a');
        grad.addColorStop(0.4, '#111840');
        grad.addColorStop(1, '#1a2050');
        ctx.fillStyle = grad;
      } else if (this.isRaining) {
        // Overcast sky
        const grad = ctx.createLinearGradient(gx, gy, gx, gy + gh);
        grad.addColorStop(0, '#6b7b8d');
        grad.addColorStop(0.5, '#8494a5');
        grad.addColorStop(1, '#9aabb8');
        ctx.fillStyle = grad;
      } else {
        // Clear day sky gradient
        const grad = ctx.createLinearGradient(gx, gy, gx, gy + gh);
        grad.addColorStop(0, '#4a90d9');
        grad.addColorStop(0.5, '#6bb3f0');
        grad.addColorStop(1, '#87ceeb');
        ctx.fillStyle = grad;
      }
      ctx.fillRect(gx, gy, gw, gh);

      // --- Sky details ---
      if (this.isNight && !this.isRaining) {
        // Stars (deterministic per window position)
        ctx.fillStyle = '#ffffff';
        const starSeed = win.col * 7 + win.row * 13;
        for (let i = 0; i < 5; i++) {
          const sx = gx + ((starSeed + i * 37) % Math.max(1, gw - 2)) + 1;
          const sy = gy + ((starSeed + i * 23) % Math.max(1, gh - 4)) + 1;
          const starSize = Math.max(1, Math.floor(zoom * 0.5));
          // Twinkle: some stars blink
          if (i % 3 === 0 && this.frameCount % 90 < 15) continue;
          ctx.fillRect(sx, sy, starSize, starSize);
        }
        // Moon (only in the first window)
        if (win === this.windows[0]) {
          const moonR = Math.max(2, Math.floor(zoom * 2));
          const mx = gx + gw - moonR * 2;
          const my = gy + moonR + 2;
          ctx.fillStyle = '#e8e0c8';
          ctx.beginPath();
          ctx.arc(mx, my, moonR, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (!this.isNight && !this.isRaining) {
        // Clouds (simple pixel rectangles)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        const cloudSeed = win.col * 11 + win.row * 7;
        // Animated drift
        const drift = (this.frameCount * 0.3) % (gw + 20);
        for (let i = 0; i < 2; i++) {
          const cloudW = Math.max(4, Math.floor(zoom * 4));
          const cloudH = Math.max(2, Math.floor(zoom * 1.5));
          const cx = gx + ((cloudSeed + i * 50 + Math.floor(drift)) % Math.max(1, gw + cloudW)) - cloudW;
          const cy = gy + Math.floor(gh * 0.2) + i * Math.floor(gh * 0.3);
          // Clip to glass area
          if (cx + cloudW > gx && cx < gx + gw) {
            const clippedX = Math.max(gx, cx);
            const clippedW = Math.min(cx + cloudW, gx + gw) - clippedX;
            ctx.fillRect(clippedX, cy, clippedW, cloudH);
            // Cloud bottom puff
            ctx.fillRect(clippedX + Math.floor(clippedW * 0.2), cy + cloudH, Math.floor(clippedW * 0.6), Math.floor(cloudH * 0.6));
          }
        }
      }

      // --- Rain inside window ---
      if (this.isRaining) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(gx, gy, gw, gh);
        ctx.clip();

        ctx.strokeStyle = 'rgba(180, 210, 240, 0.6)';
        ctx.lineWidth = Math.max(1, Math.floor(zoom * 0.5));
        const rainCount = Math.max(4, Math.floor(gw / (zoom * 2)));
        for (let i = 0; i < rainCount; i++) {
          const rx = gx + ((this.frameCount * 1.5 + i * 31) % gw);
          const ry = gy + ((this.frameCount * 3 + i * 47) % gh);
          const len = Math.max(3, Math.floor(zoom * 3));
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - Math.floor(zoom * 0.5), ry + len);
          ctx.stroke();
        }

        // Rain drops hitting window sill
        if (this.frameCount % 8 < 4) {
          ctx.fillStyle = 'rgba(180, 210, 240, 0.3)';
          for (let i = 0; i < 3; i++) {
            const dx = gx + ((this.frameCount * 2 + i * 41 + win.col * 17) % gw);
            const dropSize = Math.max(1, Math.floor(zoom * 0.8));
            ctx.fillRect(dx, gy + gh - dropSize * 2, dropSize * 2, dropSize);
          }
        }

        ctx.restore();
      }

      // --- Window frame ---
      // Outer frame (dark wood)
      ctx.strokeStyle = '#2a1a0e';
      ctx.lineWidth = frame;
      ctx.strokeRect(wx + frame / 2, wy + frame / 2, ww - frame, wh - frame);

      // Inner frame (lighter wood)
      const innerFrame = Math.max(1, Math.floor(zoom * 0.8));
      ctx.strokeStyle = '#5a3a20';
      ctx.lineWidth = innerFrame;
      ctx.strokeRect(gx - innerFrame / 2, gy - innerFrame / 2, gw + innerFrame, gh + innerFrame);

      // Cross divider
      const divider = Math.max(1, Math.floor(zoom * 0.8));
      ctx.strokeStyle = '#3d2510';
      ctx.lineWidth = divider;
      // Vertical divider
      ctx.beginPath();
      ctx.moveTo(gx + gw / 2, gy);
      ctx.lineTo(gx + gw / 2, gy + gh);
      ctx.stroke();
      // Horizontal divider
      ctx.beginPath();
      ctx.moveTo(gx, gy + gh / 2);
      ctx.lineTo(gx + gw, gy + gh / 2);
      ctx.stroke();

      // Window sill (bottom ledge)
      const sillH = Math.max(2, Math.floor(zoom * 1.5));
      ctx.fillStyle = '#4a2a14';
      ctx.fillRect(wx - Math.floor(zoom), wy + wh, ww + Math.floor(zoom * 2), sillH);
      // Sill highlight
      ctx.fillStyle = '#6a4a30';
      ctx.fillRect(wx - Math.floor(zoom), wy + wh, ww + Math.floor(zoom * 2), Math.max(1, Math.floor(sillH * 0.4)));

      // --- Window light spill onto floor (day only, not dark room) ---
      if (!this.isNight && !this.isDarkRoom && !this.isRaining) {
        // Warm sunlight trapezoid below window
        const lightTop = wy + wh + sillH;
        const lightH = tileScreenSize * 2;
        const gradient = ctx.createLinearGradient(gx, lightTop, gx, lightTop + lightH);
        gradient.addColorStop(0, 'rgba(255, 240, 180, 0.15)');
        gradient.addColorStop(1, 'rgba(255, 240, 180, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(gx - Math.floor(zoom * 2), lightTop, gw + Math.floor(zoom * 4), lightH);
      }
    }
  }

  private drawSkyTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    row: number,
    col: number,
    cols: number,
  ) {
    // Side columns (col 0 and last col) stay as low fence/hedge
    if (col === 0 || col === cols - 1) {
      ctx.fillStyle = '#2a4030';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#3a5840';
      ctx.fillRect(x, y, size, Math.floor(size * 0.4));
      return;
    }

    // Sky gradient based on time/weather
    const t = row / 2; // 0 = top row, 0.5 = second row
    if (this.isNight) {
      const r = Math.floor(10 + t * 8);
      const g = Math.floor(14 + t * 10);
      const b = Math.floor(42 + t * 20);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
    } else if (this.isRaining) {
      const r = Math.floor(107 + t * 20);
      const g = Math.floor(123 + t * 15);
      const b = Math.floor(141 + t * 10);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
    } else {
      const r = Math.floor(74 + t * 30);
      const g = Math.floor(144 + t * 20);
      const b = Math.floor(217 + t * 15);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
    }
    ctx.fillRect(x, y, size, size);

    // Stars at night
    if (this.isNight && !this.isRaining) {
      ctx.fillStyle = '#ffffff';
      const seed = col * 7 + row * 13;
      for (let i = 0; i < 2; i++) {
        if ((seed + i) % 3 === 0 && this.frameCount % 80 < 10) continue;
        const sx = x + ((seed + i * 31) % Math.max(1, size - 2)) + 1;
        const sy = y + ((seed + i * 19) % Math.max(1, size - 2)) + 1;
        const starSize = Math.max(1, Math.floor(this.zoom * 0.5));
        ctx.fillRect(sx, sy, starSize, starSize);
      }
    }

    // Clouds during day
    if (!this.isNight && !this.isRaining && row === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      const drift = (this.frameCount * 0.2) % (size * cols);
      const seed = col * 11;
      if (seed % 5 < 2) {
        const cloudW = Math.max(4, Math.floor(this.zoom * 5));
        const cloudH = Math.max(2, Math.floor(this.zoom * 1.5));
        const cx = x + ((seed * 7 + Math.floor(drift)) % (size + cloudW)) - cloudW / 2;
        if (cx + cloudW > x && cx < x + size) {
          const clippedX = Math.max(x, cx);
          const clippedW = Math.min(cx + cloudW, x + size) - clippedX;
          ctx.fillRect(clippedX, y + Math.floor(size * 0.3), clippedW, cloudH);
        }
      }
    }
  }

  private renderOutdoorRain(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    offsetY: number,
    mapW: number,
    mapH: number,
  ) {
    ctx.strokeStyle = 'rgba(150, 200, 255, 0.5)';
    ctx.lineWidth = Math.max(1, Math.floor(this.zoom * 0.5));
    const rainCount = Math.max(40, Math.floor(mapW / 4));
    for (let i = 0; i < rainCount; i++) {
      const x = offsetX + ((this.frameCount * 2 + i * 47) % mapW);
      const y = offsetY + ((this.frameCount * 4 + i * 73) % mapH);
      const len = Math.max(4, Math.floor(this.zoom * 4));
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - Math.floor(this.zoom), y + len);
      ctx.stroke();
    }

    // Splash effect on floor area (bottom half of map)
    if (this.frameCount % 6 < 3) {
      ctx.fillStyle = 'rgba(180, 220, 255, 0.2)';
      for (let i = 0; i < 10; i++) {
        const sx = offsetX + ((this.frameCount * 3 + i * 67) % mapW);
        const sy = offsetY + mapH * 0.5 + ((this.frameCount + i * 41) % Math.floor(mapH * 0.45));
        const splashSize = Math.max(2, Math.floor(this.zoom * 1.5));
        ctx.fillRect(sx, sy, splashSize, Math.max(1, Math.floor(splashSize * 0.3)));
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

  getZoom() {
    return this.zoom;
  }
}
