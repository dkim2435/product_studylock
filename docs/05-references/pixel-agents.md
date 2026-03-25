# Reference: pixel-agents

## Repo: https://github.com/pablodelucca/pixel-agents

## What It Is

VS Code extension that visualizes AI agents as pixel-art characters in an animated office.
We reference the rendering engine architecture for our library view.

## Key Files to Reference

| File | Our Usage |
|------|-----------|
| `webview-ui/src/office/engine/renderer.ts` | Canvas 2D rendering pipeline |
| `webview-ui/src/office/engine/characters.ts` | Character state machine (sit/walk/idle) |
| `webview-ui/src/office/engine/gameLoop.ts` | Frame-based game loop |
| `webview-ui/src/office/engine/officeState.ts` | Room state management |

## Patterns to Reuse

### Rendering
- Canvas 2D tile rendering
- Y-coordinate Z-sorting (depth)
- Integer zoom levels (pixel-perfect)
- Delta-time frame progression

### Characters
- State machine: IDLE / WALK / SITTING
- BFS pathfinding (tile map movement)
- Seat offset (chair position adjustment)
- Sprite animation (2-4 frames)

### Assets
- Based on JIK-A-4 Metro City asset pack
- We need library/cafe theme assets
- Recommended: search itch.io for pixel-art assets

## Differences from Our Project

| pixel-agents | StudyLock |
|-------------|-----------|
| VS Code extension | Web app (Next.js) |
| Office theme | Library/cafe theme |
| AI agent visualization | Real user visualization |
| Single user | Multi-user (WebSocket) |
| React Webview | Next.js + Canvas |
