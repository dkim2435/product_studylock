'use client';

import { useState, useEffect, useRef } from 'react';

interface PipelineStatus {
  crewai: string;
  autogen: string;
  mcp: string;
}

export default function AiStatus() {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://proactive-appreciation-production-2ff3.up.railway.app';

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`${API_URL}/api/status`);
        const data = await res.json();
        if (data.last_run) {
          setStatus(data.last_run);
        } else {
          setStatus({ crewai: 'idle', autogen: 'idle', mcp: 'live' });
        }
      } catch {
        setStatus(null);
      }
    }

    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [API_URL]);

  const isLive = status && status.crewai === 'live' && status.autogen === 'live' && status.mcp === 'live';
  const isPartial = status && (status.crewai === 'live' || status.mcp === 'live');

  const dotColor = isLive
    ? 'bg-emerald-400 shadow-emerald-400/50'
    : isPartial
      ? 'bg-amber-400 shadow-amber-400/50'
      : 'bg-stone-500';

  const tooltipText = !status
    ? 'AI pipeline: offline'
    : isLive
      ? 'AI is actively optimizing your study environment'
      : isPartial
        ? 'AI is partially active — some features using defaults'
        : 'AI is idle — using default environment settings';

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`w-2 h-2 rounded-full ${dotColor} shadow-sm ${isLive ? 'animate-pulse' : ''}`} />

      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-md text-xs text-stone-300 whitespace-nowrap z-50 font-mono">
          {tooltipText}
        </div>
      )}
    </div>
  );
}
