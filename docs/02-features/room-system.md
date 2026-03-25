# Room System

## Overview

Users are auto-placed in a room with available seats. When a room is full, they're directed to the next one.

## Room Structure

- Each room has a fixed number of desks (6-12)
- Each room has a different theme, pixel-art style, and default ambience

## Room Themes

| Room Name | Visual | Default Ambience |
|-----------|--------|-----------------|
| 1F Classic Library | Bookshelves, 2 windows | Quiet page-turning sounds |
| 2F Modern Study | Minimal bookshelves, 2 windows | Clock ticking + pencil writing |
| 7F Minimal | Clean design, 4 windows | Quiet |
| 9F Rooftop | Panoramic 5 windows, open feel | Birds + gentle wind |
| 14F Dark Room | 1 small window, spotlight effect | Ambient |
| Cafe Lounge | Cafe interior, 2 windows | Coffee machine + soft chatter |
| Outdoor Garden | Open sky (outdoor), no walls | Birds + gentle wind |

### Window & Weather Visuals

All indoor study floors have windows on the top wall that reflect real-time weather:
- **Day**: Blue sky, drifting clouds, sunlight on floor
- **Night**: Stars, moon, dimmed room lighting
- **Rain**: Gray sky, rain streaks in windows (indoor only)
- **Outdoor (Garden)**: Sky replaces top wall entirely, rain falls on whole room

## User Flow

1. Visit site
2. See room list (current / max capacity)
3. Pick a room with available seats (or auto-assign)
4. Enter → character sits at empty desk
5. Leave → character disappears

## Real-Time

- WebSocket broadcasts join/leave events in real-time
- Redis tracks per-room user counts
- Supabase Realtime or custom WebSocket server

## AI Agent Integration

- Room Manager Agent (CrewAI): handles room creation/deletion, user load balancing
- Auto-creates new rooms when capacity is reached
- Auto-cleans empty rooms

---

## 한국어 요약

유저 접속 시 빈 자리 있는 방에 자동 배치. 방마다 다른 테마/비주얼/앰비언스. 꽉 차면 새 방 자동 생성.
