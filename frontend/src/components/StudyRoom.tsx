'use client';

import { useEffect, useRef, useState } from 'react';
import { Renderer } from '@/engine/renderer';
import { GameLoop } from '@/engine/gameLoop';
import { CharacterManager } from '@/engine/characters';
import { getLayoutForRoom, getFloorTheme, BREAK_THEMES } from '@/engine/tileMap';
import { loadAllAssets, LoadedAssets } from '@/engine/assetLoader';
import { DEFAULT_ZOOM } from '@/engine/types';

interface StudyRoomProps {
  onUserCountChange?: (count: number) => void;
  roomId: string;
  localPalette: number;
}

export default function StudyRoom({ onUserCountChange, roomId, localPalette }: StudyRoomProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const assetsRef = useRef<LoadedAssets | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  // Use ref for callback to avoid re-triggering useEffect
  const onUserCountChangeRef = useRef(onUserCountChange);
  onUserCountChangeRef.current = onUserCountChange;

  const isCafe = roomId === 'cafe';
  const isGarden = roomId === 'garden';
  const isBreakRoom = isCafe || isGarden;

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    let gameLoop: GameLoop | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let userSimInterval: NodeJS.Timeout | undefined;
    let cancelled = false;

    async function init() {
      const canvas = canvasRef.current!;
      const container = containerRef.current!;

      if (!assetsRef.current) {
        assetsRef.current = await loadAllAssets();
      }
      if (cancelled) return;
      setLoading(false);

      const layout = getLayoutForRoom(roomId);

      // Get theme
      let theme;
      if (roomId === 'cafe' || roomId === 'garden') {
        theme = { ...BREAK_THEMES[roomId], isDarkRoom: false };
      } else {
        const match = roomId.match(/^(\d+)F$/);
        const floor = match ? parseInt(match[1]) : 1;
        theme = getFloorTheme(floor);
      }

      const renderer = new Renderer(canvas);
      renderer.setAssets(assetsRef.current);
      renderer.setZoom(zoom);
      renderer.setTheme(theme);
      rendererRef.current = renderer;

      const hour = new Date().getHours();
      renderer.setTimeOfDay(hour >= 20 || hour < 6);

      // Resize once + observe
      const resizeCanvas = () => {
        const rect = container.getBoundingClientRect();
        renderer.resize(rect.width, rect.height);
      };
      resizeCanvas();
      resizeObserver = new ResizeObserver(resizeCanvas);
      resizeObserver.observe(container);

      // Characters
      const cm = new CharacterManager(layout);

      // Simulated users
      const seed = roomId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const fakeCount = isBreakRoom ? 2 + (seed % 4) : 4 + (seed % 6);
      for (let i = 0; i < fakeCount; i++) {
        cm.addCharacter(`${roomId}-user-${i}`, false);
      }
      cm.addCharacter('local', true, localPalette);
      onUserCountChangeRef.current?.(cm.getCharacters().length);

      // Periodic user simulation
      userSimInterval = setInterval(() => {
        const chars = cm.getCharacters();
        const nonLocal = chars.filter(c => !c.isLocal);

        if (Math.random() > 0.45 && cm.getAvailableSeats() > 1) {
          const newId = `${roomId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          cm.addCharacter(newId, false);
        } else if (nonLocal.length > 2) {
          const leaving = nonLocal[Math.floor(Math.random() * nonLocal.length)];
          if (leaving) cm.removeCharacter(leaving.id);
        }
        onUserCountChangeRef.current?.(cm.getCharacters().length);
      }, 10000 + Math.random() * 15000);

      // Game loop
      gameLoop = new GameLoop((dt) => {
        cm.update(dt);
        renderer.render(layout.tiles, layout.furniture, cm.getCharacters(), layout.cols, layout.rows);
      });
      gameLoop.start();
    }

    init();

    return () => {
      cancelled = true;
      gameLoop?.stop();
      if (userSimInterval) clearInterval(userSimInterval);
      resizeObserver?.disconnect();
    };
  }, [roomId, localPalette, zoom, isBreakRoom]);

  const handleZoomIn = () => setZoom(z => Math.min(z + 1, 8));
  const handleZoomOut = () => setZoom(z => Math.max(z - 1, 1));

  return (
    <div className="relative" ref={containerRef} style={{ minHeight: '480px' }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-900 rounded-lg z-10">
          <span className="text-amber-200 font-mono text-sm animate-pulse">Loading...</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="rounded-lg border-2 border-amber-900/50 shadow-2xl w-full"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="absolute top-2 right-2 flex flex-col gap-1 z-20">
        <button onClick={handleZoomIn} className="w-7 h-7 bg-stone-800/80 hover:bg-stone-700 text-stone-300 rounded text-sm font-mono border border-stone-600/50">+</button>
        <button onClick={handleZoomOut} className="w-7 h-7 bg-stone-800/80 hover:bg-stone-700 text-stone-300 rounded text-sm font-mono border border-stone-600/50">-</button>
      </div>
      {isBreakRoom && (
        <div className="absolute top-2 left-2 bg-amber-800/80 text-amber-200 text-xs px-2 py-1 rounded font-mono z-20">
          {isCafe ? '☕' : '🌿'} Break Time
        </div>
      )}
    </div>
  );
}
