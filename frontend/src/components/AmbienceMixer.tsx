'use client';

import { useRef, useEffect } from 'react';
import { useAmbience } from '@/hooks/useAmbience';

function Visualizer({ freqData, isPlaying }: { freqData: Uint8Array; isPlaying: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (!isPlaying) return;

    const barCount = 32;
    const barWidth = (w / barCount) - 1;

    for (let i = 0; i < barCount; i++) {
      const value = freqData[i] || 0;
      const barHeight = Math.max(2, (value / 255) * h);
      const ratio = i / barCount;
      const r = Math.floor(180 + ratio * 75);
      const g = Math.floor(120 + ratio * 30);
      const b = Math.floor(30 + ratio * 20);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
      ctx.fillRect(i * (barWidth + 1), h - barHeight, barWidth, barHeight);
    }
  }, [freqData, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={256}
      height={28}
      className="w-full h-7 rounded"
    />
  );
}

export default function AmbienceMixer() {
  const {
    currentSound, volume, isPlaying, freqData, isSequential,
    selectSound, setVolume, togglePlay, nextTrack, prevTrack,
    isMuted, toggleMute, soundOptions,
  } = useAmbience();

  const currentOption = soundOptions.find(o => o.id === currentSound);

  return (
    <div className="bg-stone-900/90 rounded-lg p-4 border border-amber-900/30">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-amber-200 font-mono text-sm font-bold">Sound</h3>
        <button
          onClick={toggleMute}
          className={`text-sm px-2 py-1 rounded transition-colors ${
            isMuted ? 'bg-red-900/50 text-red-300' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
          }`}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Sound selection */}
      <div className="grid grid-cols-6 gap-1.5 mb-3">
        {soundOptions.map(opt => (
          <button
            key={opt.id}
            onClick={() => selectSound(opt.id)}
            className={`text-center py-2 rounded text-xs font-mono transition-colors ${
              currentSound === opt.id
                ? 'bg-amber-800/60 text-amber-200 border border-amber-700/50'
                : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
            }`}
          >
            <div className="text-base">{opt.icon}</div>
            <div className="mt-0.5 text-[10px]">{opt.name}</div>
          </button>
        ))}
      </div>

      {/* Mini player */}
      {currentSound && (
        <div className="bg-stone-800/80 rounded-lg p-3 border border-stone-700/50">
          {/* Visualizer */}
          <div className="mb-3 bg-stone-900/50 rounded overflow-hidden">
            <Visualizer freqData={freqData} isPlaying={isPlaying} />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={prevTrack}
                disabled={isSequential}
                className={`text-sm w-8 h-8 flex items-center justify-center transition-colors ${
                  isSequential
                    ? 'text-stone-700 cursor-not-allowed'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                ◀◀
              </button>
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-amber-700 hover:bg-amber-600 text-white flex items-center justify-center text-base transition-colors"
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button
                onClick={nextTrack}
                disabled={isSequential}
                className={`text-sm w-8 h-8 flex items-center justify-center transition-colors ${
                  isSequential
                    ? 'text-stone-700 cursor-not-allowed'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                ▶▶
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500 text-xs">🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 accent-amber-500 bg-stone-700 rounded-full cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
