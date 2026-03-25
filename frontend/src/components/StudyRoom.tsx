'use client';

import { useEffect, useRef, useState } from 'react';
import { Renderer } from '@/engine/renderer';
import { GameLoop } from '@/engine/gameLoop';
import { CharacterManager } from '@/engine/characters';
import { getLayoutForRoom, getFloorTheme, BREAK_THEMES } from '@/engine/tileMap';
import { loadAllAssets, LoadedAssets } from '@/engine/assetLoader';
import { DEFAULT_ZOOM } from '@/engine/types';
import { usePresence } from '@/hooks/usePresence';
import { useWeather } from '@/hooks/useWeather';

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
  const cmRef = useRef<CharacterManager | null>(null);
  const onUserCountChangeRef = useRef(onUserCountChange);
  onUserCountChangeRef.current = onUserCountChange;

  const isCafe = roomId === 'cafe';
  const isGarden = roomId === 'garden';
  const isBreakRoom = isCafe || isGarden;

  // Real-time presence
  const { users, totalCount } = usePresence(roomId, localPalette);
  // Live weather data
  const weather = useWeather();

  // Sync presence users → character manager
  const prevUserIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const cm = cmRef.current;
    if (!cm) return;

    const currentIds = new Set(users.map(u => u.id));
    const prevIds = prevUserIdsRef.current;

    // Add new users
    users.forEach(u => {
      if (!prevIds.has(u.id)) {
        cm.addCharacter(u.id, false, u.palette);
      }
    });

    // Remove left users
    prevIds.forEach(id => {
      if (!currentIds.has(id)) {
        cm.removeCharacter(id);
      }
    });

    prevUserIdsRef.current = currentIds;
    onUserCountChangeRef.current?.(totalCount);
  }, [users, totalCount]);

  // Update weather on existing renderer without reinitializing
  useEffect(() => {
    const renderer = rendererRef.current;
    if (renderer) {
      renderer.setTimeOfDay(weather.isNight);
      renderer.setWeather(weather.isRaining);
    }
  }, [weather.isNight, weather.isRaining]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    let gameLoop: GameLoop | undefined;
    let resizeObserver: ResizeObserver | undefined;
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

      // Window positions for weather visuals
      renderer.setWindows(layout.windows ?? []);
      renderer.setOutdoor(layout.outdoor ?? false);

      // Weather-driven visuals via MCP weather data
      renderer.setTimeOfDay(weather.isNight);
      renderer.setWeather(weather.isRaining);

      const resizeCanvas = () => {
        const rect = container.getBoundingClientRect();
        renderer.resize(rect.width, rect.height);
      };
      resizeCanvas();
      resizeObserver = new ResizeObserver(resizeCanvas);
      resizeObserver.observe(container);

      // Character manager — local player only, others come from presence
      const cm = new CharacterManager(layout);
      cm.addCharacter('local', true, localPalette);
      cmRef.current = cm;
      prevUserIdsRef.current = new Set();

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
      resizeObserver?.disconnect();
      cmRef.current = null;
    };
  }, [roomId, localPalette, zoom]);

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
      {weather.isRaining && !isBreakRoom && (
        <div className="absolute top-2 left-2 bg-blue-900/80 text-blue-200 text-xs px-2 py-1 rounded font-mono z-20">
          🌧 Raining outside
        </div>
      )}
      {weather.isNight && !isBreakRoom && !weather.isRaining && (
        <div className="absolute top-2 left-2 bg-indigo-900/80 text-indigo-200 text-xs px-2 py-1 rounded font-mono z-20">
          🌙 Night mode
        </div>
      )}
    </div>
  );
}
