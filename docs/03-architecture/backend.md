# Backend Architecture

## Tech Stack

| Tech | Purpose |
|------|---------|
| FastAPI | Python web server |
| Supabase | DB (users, rooms, study records) |
| Redis (Upstash) | Real-time user counts, room state cache |
| WebSocket | Real-time communication |

## API Endpoints

```
GET  /rooms              # List rooms + current occupancy
POST /rooms/{id}/join    # Join a room
POST /rooms/{id}/leave   # Leave a room
GET  /rooms/{id}/status  # Room status (users, ambience settings)
WS   /ws/{room_id}       # WebSocket real-time connection
```

## DB Schema (Supabase)

```sql
-- Room info (prefixed to avoid conflicts with ducktype)
sl_rooms:
  id, name, theme, max_seats, current_count, ambience_preset, created_at

-- Session logs (optional)
sl_sessions:
  id, room_id, joined_at, left_at, duration
```

## Database Note

- Sharing Supabase project with ducktype (free tier limit: 2 projects)
- StudyLock tables are prefixed with `sl_` to avoid conflicts
- e.g. `sl_rooms`, `sl_sessions`

## Cost Optimization

- Supabase free tier: 500MB DB, 50K monthly requests (shared with ducktype)
- Redis (Upstash) free tier: 10K requests/day
- Railway: $5 free credit
- AI agents only run on condition changes

---

## 한국어 요약

FastAPI 백엔드. Supabase DB + Upstash Redis 캐시. WebSocket 실시간 통신. 전부 무료 티어로 시작.
