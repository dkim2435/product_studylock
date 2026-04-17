'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceUser {
  id: string;
  palette: number;
  isReal: boolean;
  joinedAt: number;
}

// Generate stable dummy users per room (seeded random)
function generateDummyUsers(roomId: string, count: number): PresenceUser[] {
  const hash = roomId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const users: PresenceUser[] = [];
  for (let i = 0; i < count; i++) {
    users.push({
      id: `dummy-${roomId}-${i}`,
      palette: (hash + i) % 6,
      isReal: false,
      joinedAt: Date.now() - (i * 60000), // Staggered join times
    });
  }
  return users;
}

export function usePresence(roomId: string, localPalette: number) {
  const [realUsers, setRealUsers] = useState<PresenceUser[]>([]);
  const [dummyUsers, setDummyUsers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localIdRef = useRef<string>(`user-${Math.random().toString(36).slice(2, 10)}`);
  const dummyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const paletteRef = useRef(localPalette);

  // All users combined
  const allUsers = [...realUsers, ...dummyUsers];

  // Track palette changes without tearing down the channel — republish presence instead.
  useEffect(() => {
    paletteRef.current = localPalette;
    const channel = channelRef.current;
    if (channel) {
      channel.track({ palette: localPalette, joinedAt: Date.now() });
    }
  }, [localPalette]);

  useEffect(() => {
    const localId = localIdRef.current;

    // Generate initial dummy users
    const seed = roomId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const initialDummyCount = 3 + (seed % 6);
    setDummyUsers(generateDummyUsers(roomId, initialDummyCount));

    // Join Supabase Presence channel
    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: localId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = [];

        Object.entries(state).forEach(([key, presences]) => {
          if (key === localId) return; // Skip self
          const p = presences[0] as Record<string, unknown>;
          users.push({
            id: key,
            palette: (p.palette as number) ?? 0,
            isReal: true,
            joinedAt: (p.joinedAt as number) ?? Date.now(),
          });
        });

        setRealUsers(users);
      })
      .on('presence', { event: 'join' }, () => {
        // Handled by sync
      })
      .on('presence', { event: 'leave' }, () => {
        // Handled by sync
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            palette: paletteRef.current,
            joinedAt: Date.now(),
          });
        }
      });

    channelRef.current = channel;

    // Dummy user simulation — slow join/leave
    dummyIntervalRef.current = setInterval(() => {
      setDummyUsers(prev => {
        const arr = [...prev];

        if (Math.random() > 0.4 && arr.length < 15) {
          // Someone joins
          const newId = `dummy-${roomId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          arr.push({
            id: newId,
            palette: Math.floor(Math.random() * 6),
            isReal: false,
            joinedAt: Date.now(),
          });
        } else if (arr.length > 2) {
          // Someone leaves
          const idx = Math.floor(Math.random() * arr.length);
          arr.splice(idx, 1);
        }

        return arr;
      });
    }, 12000 + Math.random() * 18000);

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      if (dummyIntervalRef.current) clearInterval(dummyIntervalRef.current);
    };
  }, [roomId]);

  // Get count for a room we're NOT in (for sidebar display)
  const getOtherRoomCount = useCallback((otherRoomId: string): number => {
    const hash = otherRoomId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return 3 + (hash % 8);
  }, []);

  return {
    users: allUsers,
    realUserCount: realUsers.length,
    totalCount: allUsers.length + 1, // +1 for local player
    getOtherRoomCount,
    localId: localIdRef.current,
  };
}
