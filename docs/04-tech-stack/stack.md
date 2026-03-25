# Tech Stack & Interview Talking Points

## Full Stack

| Layer | Tech | Why |
|-------|------|-----|
| Frontend | Next.js + TypeScript | SSR, fast initial load |
| Rendering | Canvas 2D | Optimal for pixel-art, no WebGL needed |
| Sound | Howler.js | Cross-browser, loop/fade support |
| Styling | Tailwind CSS | Rapid UI development |
| Real-time | WebSocket | Low-latency bidirectional communication |
| Backend | FastAPI (Python) | Async, AI library compatible |
| AI Orchestration | CrewAI | Multi-agent collaboration |
| AI Discussion | AutoGen | Agent-to-agent conversation |
| AI Chains | LangChain | LLM calls, prompt management |
| AI State | LangGraph | State machine workflows |
| AI Tools | MCP | External API tool server |
| Database | Supabase (PostgreSQL) | Free tier, realtime features |
| Cache | Redis (Upstash) | Real-time user counts |
| E2E Testing | Playwright | Browser automation testing |
| CI/CD | GitHub Actions | Auto test/deploy |
| Doc Automation | MCP → Notion API | Auto documentation updates |
| Frontend Deploy | Vercel | Next.js optimized |
| Backend Deploy | Railway | Python server hosting |

## Interview Answers

### "Tell me about this project"
> "It's a real-time collaborative study room. Users join a pixel-art library and study alongside others. An AI multi-agent system automatically optimizes the environment based on weather and time of day."

### "Why CrewAI/AutoGen?"
> "Sound, visuals, and room management are each handled by different agents. When conditions change, agents discuss via AutoGen and reach consensus before applying changes, ensuring a coherent environment."

### "Why MCP?"
> "Two purposes. First, as a tool server providing weather/time data to AI agents. Second, integrating with Notion API to auto-document test and deployment results."

### "How did you manage costs?"
> "Instead of running agents continuously, they only execute on condition changes — weather shifts, time-of-day transitions, or room capacity events. This keeps API costs under $5/month using Claude Haiku."

### "How did you test this?"
> "Playwright E2E tests cover the full user flow — joining rooms, WebSocket presence, sound mixer interactions, and timer functionality. Tests run automatically via GitHub Actions on every PR."

---

## 한국어 요약

면접 대비 기술 스택 정리. "왜 이 기술을 썼나?" 에 대한 답변 포함.
