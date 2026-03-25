# Project Setup Guide

## Project Structure

```
product_studylock/
├── docs/                    # Documentation (you're here)
├── frontend/                # Next.js app
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   ├── components/      # React components
│   │   ├── engine/          # Canvas 2D rendering engine
│   │   ├── hooks/           # Custom hooks
│   │   └── assets/          # Tiles, sprites, sounds
│   ├── public/
│   ├── tests/               # Playwright tests
│   ├── package.json
│   └── next.config.js
├── backend/                 # FastAPI server
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── routers/         # API routes
│   │   ├── agents/          # CrewAI agent definitions
│   │   │   ├── atmosphere.py
│   │   │   ├── environment.py
│   │   │   └── room_manager.py
│   │   ├── mcp/             # MCP tool server
│   │   ├── graphs/          # LangGraph state graphs
│   │   └── ws/              # WebSocket handlers
│   ├── requirements.txt
│   └── Dockerfile
├── .github/
│   └── workflows/           # GitHub Actions CI/CD
└── README.md                # Root README (for GitHub)
```

## Setup Steps

### 1. GitHub Repo
```bash
git clone <repo-url>
cd product_studylock
```

### 2. Frontend
```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npm install howler @supabase/supabase-js
npm install -D @playwright/test @types/howler
npx playwright install
```

### 3. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install fastapi uvicorn supabase redis
pip install langchain langchain-anthropic langgraph
pip install crewai autogen-agentchat mcp
```

### 4. External Services
- Supabase: https://supabase.com → create new project
- Upstash Redis: https://upstash.com → create new DB
- Vercel: https://vercel.com → connect GitHub
- Railway: https://railway.app → connect GitHub

### 5. Environment Variables
```env
# frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_WS_URL=

# backend/.env
SUPABASE_URL=
SUPABASE_KEY=
UPSTASH_REDIS_URL=
ANTHROPIC_API_KEY=
OPENWEATHER_API_KEY=
NOTION_API_KEY=
NOTION_DEPLOY_PAGE_ID=
NOTION_TEST_PAGE_ID=
```
