'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerState } from '@/engine/types';

const FOCUS_DURATION = 25 * 60; // 25 minutes
const BREAK_DURATION = 5 * 60;  // 5 minutes
const LONG_BREAK_DURATION = 15 * 60; // 15 minutes
const POMODOROS_BEFORE_LONG_BREAK = 4;

export function useTimer(onBreakChange?: (isOnBreak: boolean) => void) {
  const [timer, setTimer] = useState<TimerState>({
    mode: 'idle',
    timeLeft: FOCUS_DURATION,
    totalPomodoros: 0,
    isRunning: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Tick timer
  useEffect(() => {
    if (timer.isRunning && timer.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
        }));
      }, 1000);
    } else if (timer.timeLeft === 0 && timer.isRunning) {
      clearTimerInterval();

      if (timer.mode === 'focus') {
        // Focus done — auto break
        const newPomodoros = timer.totalPomodoros + 1;
        const isLong = newPomodoros % POMODOROS_BEFORE_LONG_BREAK === 0;

        setTimer({
          mode: isLong ? 'longBreak' : 'break',
          timeLeft: isLong ? LONG_BREAK_DURATION : BREAK_DURATION,
          totalPomodoros: newPomodoros,
          isRunning: true,
        });
        onBreakChange?.(true);
      } else {
        // Break done — back to focus
        setTimer(prev => ({
          ...prev,
          mode: 'focus',
          timeLeft: FOCUS_DURATION,
          isRunning: true,
        }));
        onBreakChange?.(false);
      }
    }

    return clearTimerInterval;
  }, [timer.isRunning, timer.timeLeft, timer.mode, timer.totalPomodoros, clearTimerInterval, onBreakChange]);

  const start = useCallback(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    setTimer(prev => ({
      ...prev,
      mode: prev.mode === 'idle' ? 'focus' : prev.mode,
      isRunning: true,
    }));
    onBreakChange?.(false);
  }, [onBreakChange]);

  const pause = useCallback(() => {
    clearTimerInterval();
    setTimer(prev => ({ ...prev, isRunning: false }));
  }, [clearTimerInterval]);

  const reset = useCallback(() => {
    clearTimerInterval();
    setTimer({
      mode: 'idle',
      timeLeft: FOCUS_DURATION,
      totalPomodoros: 0,
      isRunning: false,
    });
    onBreakChange?.(false);
  }, [clearTimerInterval, onBreakChange]);

  // Manual break — user clicks "Break" during focus
  const takeBreak = useCallback(() => {
    clearTimerInterval();
    const newPomodoros = timer.totalPomodoros + 1;
    const isLong = newPomodoros % POMODOROS_BEFORE_LONG_BREAK === 0;

    setTimer({
      mode: isLong ? 'longBreak' : 'break',
      timeLeft: isLong ? LONG_BREAK_DURATION : BREAK_DURATION,
      totalPomodoros: newPomodoros,
      isRunning: true,
    });
    onBreakChange?.(true);
  }, [clearTimerInterval, timer.totalPomodoros, onBreakChange]);

  // End break — user clicks "Back to Study"
  const endBreak = useCallback(() => {
    clearTimerInterval();
    setTimer(prev => ({
      ...prev,
      mode: 'focus',
      timeLeft: FOCUS_DURATION,
      isRunning: true,
    }));
    onBreakChange?.(false);
  }, [clearTimerInterval, onBreakChange]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    timer,
    start,
    pause,
    reset,
    takeBreak,
    endBreak,
    formatTime,
  };
}
