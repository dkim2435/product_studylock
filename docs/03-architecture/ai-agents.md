# AI Agent System

## Overview

3 AI agents collaboratively optimize the study room environment in real-time.
Agents only execute **when conditions change** to minimize API costs.

## Agent Crew (CrewAI)

| Agent | Role | Trigger |
|-------|------|---------|
| Atmosphere Agent | Optimizes sound mix | Weather change, time-of-day shift |
| Environment Agent | Manages visuals (day/night, weather effects) | Time-of-day shift, weather change |
| Room Manager Agent | Creates/deletes rooms, load balances users | Room full, room empty |

## Technology Mapping

```
┌─ CrewAI ─────────────────────────────────────┐
│                                               │
│  Atmosphere Agent ←── AutoGen ──→             │
│  Environment Agent ←─ (discussion) ─→         │
│  Room Manager Agent                           │
│       │                                       │
│       ├── LangChain (LLM calls, prompts)      │
│       ├── LangGraph (state transitions)       │
│       └── MCP (external tool calls)           │
└───────────────────────────────────────────────┘
```

### LangChain
- LLM call layer for each agent
- Prompt template management
- Claude API integration

### LangGraph
- Room state machine:
  ```
  [User Join] → [Analyze Environment] → [Apply Settings] → [Monitor]
                       ↑                                      ↓
                 [Condition Change] ←──────────────── [Periodic Check]
  ```
- States: morning / afternoon / evening / night
- Transitions: time, weather, user count

### MCP (Model Context Protocol)
- Tool server for agents:
  - `get_weather(location)` → current weather
  - `get_time_info()` → timezone, sunrise/sunset
  - `get_room_stats()` → per-room user counts
- Secondary use: Notion API integration (doc automation) → see 09-mcp-notion/

### AutoGen
- Agent discussion/consensus protocol
- Example flow on weather change:
  1. Atmosphere Agent: "It's raining, let's increase rain sounds"
  2. Environment Agent: "Then I'll add raindrop effects on windows"
  3. Consensus → apply simultaneously
- Discussion logs visible on admin dashboard (interview demo)

## Cost Optimization Strategy

- Agents DO NOT run constantly ✗
- Agents run ONLY on condition changes ✓
  - Weather: check once per hour
  - Time-of-day: 4 times per day (morning/afternoon/evening/night)
  - Room management: only when room is full or empty
- Use Claude Haiku (cheapest model, sufficient for agent tasks)
- Expected: ~50 API calls/day → **under $5/month**

---

## 한국어 요약

CrewAI 3개 에이전트가 환경 최적화. AutoGen으로 에이전트 간 토론. LangGraph로 상태 관리. MCP로 외부 API 도구 제공. 조건 변할 때만 실행 → 월 $5 미만.
