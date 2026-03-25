'use client';

import { useTimer } from '@/hooks/useTimer';

interface TimerProps {
  onBreakChange?: (isOnBreak: boolean) => void;
}

export default function Timer({ onBreakChange }: TimerProps) {
  const { timer, start, pause, reset, takeBreak, endBreak, formatTime } = useTimer(onBreakChange);

  const modeLabels: Record<string, string> = {
    idle: 'Ready',
    focus: 'Focusing',
    break: 'On Break',
    longBreak: 'Long Break',
  };

  const modeColors: Record<string, string> = {
    idle: 'text-stone-400',
    focus: 'text-red-400',
    break: 'text-amber-400',
    longBreak: 'text-blue-400',
  };

  const isOnBreak = timer.mode === 'break' || timer.mode === 'longBreak';

  return (
    <div className="bg-stone-900/90 rounded-lg p-4 border border-amber-900/30">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-amber-200 font-mono text-sm font-bold">Timer</h3>
        <span className={`text-xs font-mono ${modeColors[timer.mode]}`}>
          {modeLabels[timer.mode]}
        </span>
      </div>

      {/* Timer display */}
      <div className="text-center mb-4">
        <span className="text-4xl font-mono text-stone-100 tabular-nums">
          {formatTime(timer.timeLeft)}
        </span>
        {timer.mode === 'focus' && (
          <p className="text-stone-500 text-xs font-mono mt-1">25 min focus session</p>
        )}
        {isOnBreak && (
          <p className="text-amber-500/70 text-xs font-mono mt-1">☕ Enjoy your break</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-3">
        {timer.mode === 'idle' && (
          <button
            onClick={start}
            className="flex-1 py-2 rounded bg-amber-700 hover:bg-amber-600 text-stone-100 font-mono text-sm transition-colors"
          >
            ▶ Start
          </button>
        )}

        {timer.mode === 'focus' && !timer.isRunning && (
          <button
            onClick={start}
            className="flex-1 py-2 rounded bg-amber-700 hover:bg-amber-600 text-stone-100 font-mono text-sm transition-colors"
          >
            ▶ Resume
          </button>
        )}

        {timer.mode === 'focus' && timer.isRunning && (
          <>
            <button
              onClick={pause}
              className="flex-1 py-2 rounded bg-stone-700 hover:bg-stone-600 text-stone-100 font-mono text-sm transition-colors"
            >
              ⏸ Pause
            </button>
            <button
              onClick={takeBreak}
              className="flex-1 py-2 rounded bg-amber-800 hover:bg-amber-700 text-amber-200 font-mono text-sm transition-colors"
            >
              ☕ Break
            </button>
          </>
        )}

        {isOnBreak && (
          <button
            onClick={endBreak}
            className="flex-1 py-2 rounded bg-green-800 hover:bg-green-700 text-green-200 font-mono text-sm transition-colors"
          >
            📚 Back to Study
          </button>
        )}

        <button
          onClick={reset}
          className="px-4 py-2 rounded bg-stone-800 hover:bg-stone-700 text-stone-400 font-mono text-sm transition-colors"
        >
          ↺
        </button>
      </div>

      {/* Pomodoro count */}
      <div className="text-center">
        <span className="text-stone-500 text-xs font-mono">Today: </span>
        {timer.totalPomodoros > 0 ? (
          <span className="text-xs">
            {Array.from({ length: timer.totalPomodoros }, (_, i) => (
              <span key={i}>🍅</span>
            ))}
            <span className="text-stone-500 font-mono ml-1">
              {timer.totalPomodoros} done
            </span>
          </span>
        ) : (
          <span className="text-stone-600 text-xs font-mono">No sessions yet</span>
        )}
      </div>
    </div>
  );
}
