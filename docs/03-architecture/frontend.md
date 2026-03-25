# Frontend Architecture

## Tech Stack

| Tech | Purpose |
|------|---------|
| Next.js | Framework (App Router) |
| TypeScript | Type safety |
| Canvas 2D | Pixel-art library rendering |
| Howler.js | Ambience sound playback |
| WebSocket | Real-time presence |
| Tailwind CSS | UI styling |

## Project Structure

```
frontend/src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Landing / room list
│   └── room/[id]/page.tsx  # Study room view
├── components/
│   ├── StudyRoom.tsx       # Main canvas component
│   ├── AmbienceMixer.tsx   # Sound mixer UI
│   ├── Timer.tsx           # Pomodoro timer
│   └── RoomList.tsx        # Room selection
├── engine/
│   ├── renderer.ts         # Canvas 2D rendering pipeline
│   ├── characters.ts       # Character state machine (sit/idle/walk)
│   ├── gameLoop.ts         # Frame-based game loop
│   ├── roomState.ts        # Room state management
│   └── tileMap.ts          # Tile map loader
├── hooks/
│   ├── useWebSocket.ts     # Real-time presence hook
│   ├── useAmbience.ts      # Sound management hook
│   └── useTimer.ts         # Pomodoro timer hook
└── assets/
    ├── tiles/              # Library tiles (floor, walls, furniture)
    ├── characters/         # Pixel character sprites
    └── sounds/             # Ambience sound files (royalty-free)
```

## Canvas 2D Rendering Pipeline (ref: pixel-agents)

1. Load tile map (library layout)
2. Render floor / walls / furniture
3. Render windows with dynamic sky (day/night/rain)
4. Y-coordinate Z-sorting for depth
5. Render characters (seated users)
6. Day/night overlay (time-based)
7. Outdoor rain (garden only — full-room rain with splash effects)

### Window System

Each study floor has windows on the top wall showing the outside:
- **Day**: Blue sky gradient + drifting clouds + sunlight spill on floor
- **Night**: Dark sky + twinkling stars + moon (first window)
- **Rain**: Overcast gray sky + rain streaks inside window + water drops on sill
- **Dark Room**: Moonlight/daylight bleeds through windows into spotlight system

Outdoor rooms (Garden) replace the top wall entirely with sky tiles, and rain falls over the whole room.

## Character States

- **IDLE**: Sitting at desk, studying (default)
- **WALK**: Walking in/out on join/leave
- **SITTING**: Sit-down animation at desk

---

## 한국어 요약

Next.js + Canvas 2D 기반. pixel-agents 렌더링 엔진 참고. 캐릭터 상태 머신으로 앉기/걷기/대기 관리.
