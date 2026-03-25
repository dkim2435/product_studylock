# StudyLock - Project Documentation

> A real-time collaborative study room with pixel-art library visuals, ambience sounds, and AI-powered adaptive environment.

## How to Use This Documentation

- **Quick overview**: Read this README only
- **Details**: Read the specific folder's md file
- **Each file is self-contained** — no need to read other files for context

---

## Project at a Glance

### Core Features

1. **Pixel-Art Library** — Canvas 2D rendered study room, real-time users sitting at desks
2. **Ambience Sound Mixer** — Rain, cafe, fireplace, etc. with weather-based auto-sync
3. **Pomodoro Timer** — 25min focus / 5min break cycles

### Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, TypeScript, Canvas 2D, Howler.js, WebSocket, Tailwind CSS |
| Backend | FastAPI (Python) |
| AI Agents | CrewAI, AutoGen, LangChain, LangGraph, MCP |
| Database | Supabase (PostgreSQL), Redis (Upstash) |
| Testing | Playwright (E2E) |
| CI/CD | GitHub Actions |
| Doc Automation | MCP → Notion API |
| Deployment | Vercel (frontend) + Railway (backend) |
| Domain | studylock.dev (Vercel) |

### Resume One-Liner

> "Built a real-time collaborative study room with pixel-art UI, AI-powered adaptive environment using CrewAI, AutoGen, LangChain, LangGraph, MCP, WebSocket, and Playwright E2E testing with CI/CD automation"

---

## Documentation Structure

| Folder | Content | When to Read |
|--------|---------|-------------|
| `01-concept/` | Concept, target users, core value | Checking project direction |
| `02-features/` | Feature specs per module | Building a specific feature |
| `03-architecture/` | Frontend / Backend / AI architecture | Understanding structure |
| `04-tech-stack/` | Tech choices, library reference | Looking up libraries |
| `05-references/` | pixel-agents repo analysis | Checking implementation patterns |
| `06-scaffolding/` | Project structure, setup guide | Initial setup |
| `07-testing/` | Playwright E2E test cases | Writing tests |
| `08-deployment/` | CI/CD pipeline, cost structure | Deploying / checking costs |
| `09-mcp-notion/` | Notion auto-update setup | Setting up doc automation |

---

## Build Phases

### Phase 1: Foundation
- [ ] Project scaffolding (Next.js + FastAPI)
- [ ] GitHub repo setup
- [ ] Supabase / Redis setup
- [ ] Basic CI/CD (GitHub Actions)

### Phase 2: Core Features
- [ ] Pixel-art library Canvas rendering
- [ ] WebSocket real-time presence
- [ ] Room system (join / leave / switch rooms)
- [ ] Ambience sound mixer
- [ ] Pomodoro timer

### Phase 3: AI Agents
- [ ] MCP server (weather API tools)
- [ ] LangChain agent base layer
- [ ] LangGraph room state management
- [ ] CrewAI multi-agent (Atmosphere, Environment, Room Manager)
- [ ] AutoGen agent discussion protocol

### Phase 4: Testing & Deployment
- [ ] Playwright E2E tests
- [ ] Vercel + Railway deployment
- [ ] Domain connection (studylock.dev)

### Phase 5: Documentation Automation
- [ ] MCP → Notion integration
- [ ] Auto-log test / deploy results

---

## Estimated Costs

| Stage | Monthly Cost |
|-------|-------------|
| MVP (no users) | $0-5 |
| 100 users | ~$10 |
| 1,000 users | ~$20-30 |

---

*한국어 버전은 Notion에서 확인 가능합니다.*
