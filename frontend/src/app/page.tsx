'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import StudyRoom from '@/components/StudyRoom';
import AmbienceMixer from '@/components/AmbienceMixer';
import Timer from '@/components/Timer';
import AiStatus from '@/components/AiStatus';
import { getFloorTheme, BREAK_THEMES, MAX_PER_FLOOR, MAX_BREAK_ROOM } from '@/engine/tileMap';

export default function Home() {
  const [roomUserCount, setRoomUserCount] = useState(0);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState('1F');
  const localPaletteRef = useRef(Math.floor(Math.random() * 6));

  // Track user counts per room (persists across switches)
  const roomCountsRef = useRef<Map<string, number>>(new Map());

  // Always show 14 floors, auto-expand from 15+
  const [maxFloor, setMaxFloor] = useState(14);

  // Generate stable fake counts per room (seeded)
  const getFakeCount = useCallback((roomId: string) => {
    const saved = roomCountsRef.current.get(roomId);
    if (saved !== undefined) return saved;
    const hash = roomId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return 3 + (hash % 10);
  }, []);

  // Check if we need more floors
  const checkAutoExpand = useCallback(() => {
    let allNearFull = true;
    for (let f = 1; f <= maxFloor; f++) {
      const id = `${f}F`;
      const count = id === currentRoomId ? roomUserCount : getFakeCount(id);
      if (count < MAX_PER_FLOOR * 0.8) {
        allNearFull = false;
        break;
      }
    }
    if (allNearFull) {
      setMaxFloor(prev => prev + 1);
    }
  }, [maxFloor, currentRoomId, roomUserCount, getFakeCount]);

  // Build room list
  const rooms = useMemo(() => {
    const list: { id: string; name: string; icon: string; max: number; isBreak: boolean }[] = [];

    // Floors (top to bottom in display)
    for (let f = maxFloor; f >= 1; f--) {
      const theme = getFloorTheme(f);
      list.push({ id: `${f}F`, name: `${f}F ${theme.name}`, icon: theme.icon, max: MAX_PER_FLOOR, isBreak: false });
    }

    // Break rooms at bottom
    list.push({ id: 'cafe', name: BREAK_THEMES.cafe.name, icon: BREAK_THEMES.cafe.icon, max: MAX_BREAK_ROOM, isBreak: true });
    list.push({ id: 'garden', name: BREAK_THEMES.garden.name, icon: BREAK_THEMES.garden.icon, max: MAX_BREAK_ROOM, isBreak: true });

    return list;
  }, [maxFloor]);

  const handleUserCountChange = useCallback((count: number) => {
    setRoomUserCount(count);
    roomCountsRef.current.set(currentRoomId, count);
    checkAutoExpand();
  }, [currentRoomId, checkAutoExpand]);

  const handleBreakChange = useCallback((onBreak: boolean) => {
    setIsOnBreak(onBreak);
    if (onBreak) {
      // Random: cafe or garden, pick one with more space
      const cafeCount = getFakeCount('cafe');
      const gardenCount = getFakeCount('garden');
      const target = cafeCount <= gardenCount ? 'cafe' : 'garden';
      roomCountsRef.current.set(currentRoomId, roomUserCount);
      setCurrentRoomId(target);
    } else {
      roomCountsRef.current.set(currentRoomId, roomUserCount);
      setCurrentRoomId('1F');
    }
  }, [currentRoomId, roomUserCount, getFakeCount]);

  const handleSwitchRoom = useCallback((roomId: string) => {
    // During break, can only switch between cafe and garden
    if (isOnBreak && roomId !== 'cafe' && roomId !== 'garden') return;
    // Can't go to break rooms when not on break
    if (!isOnBreak && (roomId === 'cafe' || roomId === 'garden')) return;

    roomCountsRef.current.set(currentRoomId, roomUserCount);
    setCurrentRoomId(roomId);
  }, [isOnBreak, currentRoomId, roomUserCount]);

  const currentRoom = rooms.find(r => r.id === currentRoomId);
  const currentName = currentRoom?.name || currentRoomId;
  const currentIcon = currentRoom?.icon || '📖';

  const totalUsers = rooms.reduce((sum, r) => {
    const count = r.id === currentRoomId ? roomUserCount : getFakeCount(r.id);
    return sum + count;
  }, 0);

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      <header className="border-b border-amber-900/30 bg-stone-900/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <h1 className="font-mono text-lg font-bold text-amber-200">StudyLock</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-stone-400 text-sm font-mono">{totalUsers} online</span>
            </div>
            <AiStatus />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-mono text-sm text-amber-200">
                {currentIcon} {currentName}
              </h2>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-900/30 rounded border border-green-800/30">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-mono font-bold">{roomUserCount} on this floor</span>
              </div>
            </div>
            <StudyRoom
              key={currentRoomId}
              onUserCountChange={handleUserCountChange}
              roomId={currentRoomId}
              localPalette={localPaletteRef.current}
            />
          </div>

          <div className="space-y-4">
            <Timer onBreakChange={handleBreakChange} />
            <AmbienceMixer />

            <div className="bg-stone-900/90 rounded-lg p-4 border border-amber-900/30">
              <h3 className="text-amber-200 font-mono text-sm font-bold mb-3">Floors</h3>
              <div className="space-y-1 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                {rooms.map(room => {
                  const count = room.id === currentRoomId ? roomUserCount : getFakeCount(room.id);
                  const isActive = room.id === currentRoomId;
                  const isDisabled = (isOnBreak && !room.isBreak) || (!isOnBreak && room.isBreak);

                  return (
                    <button
                      key={room.id}
                      onClick={() => handleSwitchRoom(room.id)}
                      disabled={isDisabled}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                        isActive
                          ? 'bg-amber-900/30 text-amber-200 border border-amber-700/50'
                          : isDisabled
                            ? 'bg-stone-800/20 text-stone-700 cursor-not-allowed'
                            : 'bg-stone-800/50 text-stone-400 hover:bg-stone-800 hover:text-stone-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>
                          {room.icon} {room.name}
                          {isActive && <span className="ml-1 text-green-400">●</span>}
                        </span>
                        <span className={count >= room.max ? 'text-red-400' : 'text-stone-500'}>
                          {count}/{room.max}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-center text-stone-600 text-xs font-mono">
              <p>No login required</p>
              <p className="mt-1">studylock.dev</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
