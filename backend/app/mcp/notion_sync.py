"""
MCP → Notion Auto Documentation
Creates multiple organized sub-pages under the main doc page.
"""

import os
import httpx
from datetime import datetime
from typing import Any

NOTION_API_URL = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {os.getenv('NOTION_API_KEY')}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }


def _rt(text: str) -> list:
    """Rich text helper with 2000 char chunking."""
    chunks = []
    for i in range(0, len(text), 2000):
        chunks.append({"type": "text", "text": {"content": text[i:i+2000]}})
    return chunks if chunks else [{"type": "text", "text": {"content": ""}}]


def _bold_rt(text: str) -> list:
    return [{"type": "text", "text": {"content": text}, "annotations": {"bold": True}}]


def _h2(text: str) -> dict:
    return {"object": "block", "type": "heading_2", "heading_2": {"rich_text": _rt(text)}}


def _h3(text: str) -> dict:
    return {"object": "block", "type": "heading_3", "heading_3": {"rich_text": _rt(text)}}


def _p(text: str) -> dict:
    return {"object": "block", "type": "paragraph", "paragraph": {"rich_text": _rt(text)}}


def _bold_p(label: str, text: str) -> dict:
    return {"object": "block", "type": "paragraph", "paragraph": {"rich_text": [*_bold_rt(label), *_rt(text)]}}


def _div() -> dict:
    return {"object": "block", "type": "divider", "divider": {}}


def _bullet(text: str) -> dict:
    return {"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {"rich_text": _rt(text)}}


def _code(text: str, lang: str = "mermaid") -> dict:
    supported = {"mermaid", "python", "javascript", "typescript", "json", "bash", "plain text", "sql", "yaml"}
    return {"object": "block", "type": "code", "code": {"rich_text": _rt(text), "language": lang if lang in supported else "plain text"}}


async def _append(page_id: str, blocks: list[dict]) -> None:
    async with httpx.AsyncClient(timeout=60.0) as client:
        for i in range(0, len(blocks), 50):
            resp = await client.patch(
                f"{NOTION_API_URL}/blocks/{page_id}/children",
                headers=_headers(), json={"children": blocks[i:i+50]},
            )
            if resp.status_code != 200:
                err = resp.text[:300].encode('ascii', 'replace').decode()
                raise Exception(f"Notion error at block {i}: {resp.status_code} {err}")


async def _clear(page_id: str) -> None:
    async with httpx.AsyncClient(timeout=60.0) as client:
        has_more, cursor = True, None
        ids = []
        while has_more:
            params: dict = {"page_size": 100}
            if cursor:
                params["start_cursor"] = cursor
            resp = await client.get(f"{NOTION_API_URL}/blocks/{page_id}/children", headers=_headers(), params=params)
            data = resp.json()
            ids.extend(b["id"] for b in data.get("results", []))
            has_more = data.get("has_more", False)
            cursor = data.get("next_cursor")
        for bid in ids:
            try:
                await client.delete(f"{NOTION_API_URL}/blocks/{bid}", headers=_headers())
            except Exception:
                pass


async def _create_subpage(parent_id: str, title: str, icon: str) -> str:
    """Create a child page and return its ID."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{NOTION_API_URL}/pages",
            headers=_headers(),
            json={
                "parent": {"page_id": parent_id},
                "icon": {"type": "emoji", "emoji": icon},
                "properties": {
                    "title": [{"type": "text", "text": {"content": title}}]
                },
            },
        )
        if resp.status_code != 200:
            err = resp.text[:300].encode('ascii', 'replace').decode()
            raise Exception(f"Failed to create page '{title}': {resp.status_code} {err}")
        return resp.json()["id"]


# ============================================================
# PAGE BUILDERS
# ============================================================

async def _build_overview(page_id: str) -> None:
    blocks = [
        _h2("What is StudyLock?"),
        _p("StudyLock is a real-time collaborative study room where users study together in a pixel-art library environment. Think of it as a virtual library — you can see other people studying alongside you, hear ambient sounds, and use a Pomodoro timer to manage your focus sessions."),
        _p("StudyLock은 픽셀아트 도서관에서 함께 공부하는 실시간 협업 스터디룸입니다. 가상 도서관이라고 생각하면 됩니다 — 다른 사람들이 공부하는 모습이 보이고, 앰비언스 사운드를 들으며, 포모도로 타이머로 집중 세션을 관리할 수 있습니다."),
        _div(),

        _h2("Core Features"),
        _bullet("14 Unique Themed Study Floors — Classic Library, Modern Study, Cozy Corner, Dark Room with spotlight effect, and more (14개 유니크 테마 층)"),
        _bullet("Real-time Presence — See other students studying in the same room via Supabase Realtime WebSocket (실시간 접속자 확인)"),
        _bullet("Ambient Sound System — 6 categories (Lofi, Cabin, Rain, Ocean, Birds, Fire) with mini player and audio visualizer (앰비언스 사운드 6종 + 비주얼라이저)"),
        _bullet("Pomodoro Timer — 25min focus / 5min break cycles. Break sends you to Cafe or Garden room (포모도로 타이머 + Break 시 카페/정원 이동)"),
        _bullet("AI-Powered Environment — Multi-agent AI system adapts room atmosphere based on weather and time (AI 멀티 에이전트가 환경 자동 최적화)"),
        _bullet("Auto-expanding Floors — New floors open automatically as capacity fills (유저 많아지면 자동 층 추가)"),
        _div(),

        _h2("Target Users"),
        _bullet("Students preparing for exams (finals, midterms)"),
        _bullet("Job seekers (coding tests, certifications)"),
        _bullet("Remote workers who need a focus environment"),
        _bullet("Anyone who doesn't want to study alone"),
        _div(),

        _h2("Why StudyLock?"),
        _p("'Study with me' videos on YouTube have hundreds of millions of views, proving that people want to feel like they're studying with others. But YouTube is passive — no interaction, no real-time presence. StudyLock brings that feeling to an interactive web experience with zero friction (no login required)."),
        _p("유튜브 'Study with me' 영상이 수억 뷰를 기록하며 사람들이 함께 공부하는 느낌을 원한다는 걸 증명했습니다. 하지만 유튜브는 수동적 — 상호작용 없고, 실시간이 아닙니다. StudyLock은 이 느낌을 인터랙티브 웹 경험으로, 로그인 없이 바로 제공합니다."),
        _div(),

        _h2("Live"),
        _p("https://studylock.dev"),
        _p("GitHub: https://github.com/dkim2435/product_studylock"),
    ]
    await _append(page_id, blocks)


async def _build_architecture(page_id: str) -> None:
    blocks = [
        _h2("System Architecture"),
        _p("The system is split into three layers: Frontend (Next.js on Vercel), Backend (FastAPI on Railway), and External Services (Supabase, Weather API, Notion)."),
        _p("시스템은 세 레이어로 나뉩니다: 프론트엔드 (Next.js, Vercel), 백엔드 (FastAPI, Railway), 외부 서비스 (Supabase, Weather API, Notion)."),

        _code("""graph TB
    subgraph Frontend["Frontend - Next.js + Vercel"]
        UI[Pixel-Art Study Room]
        Canvas[Canvas 2D Engine]
        Sound[Howler.js Sound System]
        Timer[Pomodoro Timer]
        Presence[Supabase Presence]
    end

    subgraph Backend["Backend - FastAPI + Railway"]
        API[REST API]
        subgraph Agents["AI Agent Crew"]
            Atmo[Atmosphere Agent]
            Env[Environment Agent]
            Room[Room Manager Agent]
        end
        Graph[LangGraph State Machine]
        MCP_Tools[MCP Tool Server]
    end

    subgraph External["External Services"]
        Supabase[(Supabase DB + Realtime)]
        Weather[Weather API]
        Notion[Notion API]
    end

    UI --> Canvas
    UI --> Sound
    UI --> Timer
    Presence --> Supabase
    API --> Agents
    Agents --> Graph
    Agents --> MCP_Tools
    MCP_Tools --> Weather
    MCP_Tools --> Supabase
    MCP_Tools --> Notion""", "mermaid"),
        _div(),

        _h2("Data Flow"),
        _code("""sequenceDiagram
    participant User
    participant Frontend
    participant Supabase
    participant Backend
    participant AI Agents
    participant MCP Tools

    User->>Frontend: Join study room
    Frontend->>Supabase: Subscribe Presence channel
    Supabase-->>Frontend: Broadcast user joined
    Frontend->>Frontend: Render character in Canvas

    Note over Backend,AI Agents: Triggered by condition change
    Backend->>MCP Tools: get_weather(), get_time_info()
    MCP Tools-->>Backend: Weather and time data
    Backend->>AI Agents: Run crew
    AI Agents-->>Backend: Environment settings
    Backend->>MCP Tools: Log to Notion""", "mermaid"),
        _div(),

        _h2("CI/CD Pipeline"),
        _code("""graph LR
    A[Git Push / PR] --> B[GitHub Actions]
    B --> C[TypeScript Check]
    C --> D[Next.js Build]
    D --> E[Playwright Tests]
    E -->|Pass| F[Vercel Deploy]
    E -->|Fail| G[Block Merge]
    F --> H[studylock.dev]""", "mermaid"),
        _div(),

        _h2("Project Structure"),
        _code("""product_studylock/
├── frontend/                # Next.js App
│   ├── src/
│   │   ├── app/             # Pages (App Router)
│   │   ├── components/      # StudyRoom, Timer, AmbienceMixer
│   │   ├── engine/          # Canvas 2D: renderer, characters, tileMap
│   │   ├── hooks/           # usePresence, useAmbience, useTimer
│   │   └── lib/             # Supabase client
│   ├── tests/               # Playwright E2E (23 cases)
│   └── public/assets/       # Sprites, sounds (25+ tracks)
├── backend/                 # FastAPI Server
│   └── app/
│       ├── agents/          # CrewAI crew + 3 agents
│       ├── graphs/          # LangGraph state machine
│       └── mcp/             # MCP tools + Notion sync
├── docs/                    # Markdown docs
└── .github/workflows/       # CI/CD""", "plain text"),
    ]
    await _append(page_id, blocks)


async def _build_tech_stack(page_id: str) -> None:
    blocks = [
        _h2("Frontend Technologies"),
        _div(),

        _h3("Next.js + TypeScript"),
        _bold_p("What: ", "React-based full-stack framework with server-side rendering (SSR), static site generation (SSG), and file-based routing."),
        _bold_p("Where: ", "The entire frontend application. Uses App Router for page routing, server components for initial HTML generation, and client components for interactive UI (Canvas, sound, timer)."),
        _bold_p("Why: ", "We needed SSR for SEO (search engines can index our study room pages for organic traffic). Next.js was chosen over plain React (Create React App) because CRA has no SSR, and over Remix because Next.js has native Vercel deployment with zero configuration — critical for a solo developer who needs to deploy fast. TypeScript was non-negotiable for a project of this scale — the Canvas rendering engine alone has 6 interconnected files, and without type safety, refactoring the character state machine or tile map system would be error-prone. The App Router (over Pages Router) was chosen because it supports React Server Components, reducing client-side JavaScript bundle size."),
        _p("무엇: SSR/SSG 지원 React 풀스택 프레임워크."),
        _p("어디서: 프론트엔드 전체. App Router로 라우팅, 서버 컴포넌트로 초기 HTML, 클라이언트 컴포넌트로 인터랙티브 UI."),
        _p("왜: SEO를 위해 SSR 필요 (검색엔진 인덱싱으로 오가닉 트래픽). CRA는 SSR 없어서 제외. Remix보다 Vercel 네이티브 배포가 제로 설정이라 솔로 개발자에게 최적. TypeScript는 Canvas 렌더링 엔진만 6개 파일이 연동되어 타입 안전성 필수. App Router는 React Server Components로 클라이언트 번들 최소화."),
        _div(),

        _h3("Canvas 2D API"),
        _bold_p("What: ", "Browser-native 2D rendering API that draws graphics on an HTML <canvas> element using JavaScript."),
        _bold_p("Where: ", "The pixel-art study room rendering engine. Draws floor tiles, wall textures, furniture sprites, character animations (walking, typing, idle), day/night overlays, Dark Room spotlight effects, and rain particles — all at 60fps."),
        _bold_p("Why: ", "The rendering engine needs to draw hundreds of sprites per frame with pixel-perfect precision. Canvas 2D was chosen over: (1) WebGL — overkill for 2D pixel art, adds GPU shader complexity with no visual benefit; (2) CSS/DOM-based rendering — can't handle 60fps sprite animation with z-sorting across 50+ entities; (3) SVG — not designed for rasterized pixel art, and performance degrades with many elements. Canvas 2D gives us direct pixel control, integer zoom levels for crisp rendering (imageSmoothingEnabled = false), and Y-coordinate Z-sorting for depth — all with zero external dependencies. The architecture follows pixel-agents' proven pattern: game loop with delta-time, sprite sheet slicing via drawImage(), and offscreen compositing for the Dark Room spotlight effect."),
        _p("무엇: 브라우저 내장 2D 렌더링 API. <canvas>에 JavaScript로 그래픽 렌더링."),
        _p("어디서: 스터디룸 렌더링 엔진. 바닥, 벽, 가구, 캐릭터 애니메이션, 낮/밤 오버레이, 다크룸 스포트라이트, 비 효과 — 전부 60fps."),
        _p("왜: WebGL은 2D 픽셀아트에 과잉. CSS/DOM은 50+ 엔티티의 60fps Z-소팅 불가. SVG는 래스터 픽셀아트에 부적합. Canvas 2D는 직접 픽셀 제어, 정수 줌으로 선명한 렌더링, 의존성 없음. pixel-agents 엔진 패턴 참고: 게임 루프, 스프라이트 시트, 오프스크린 합성."),
        _div(),

        _h3("Howler.js"),
        _bold_p("What: ", "Cross-browser JavaScript audio library that abstracts Web Audio API and HTML5 Audio."),
        _bold_p("Where: ", "The ambient sound system with 6 categories (Lofi, Cabin, Rain, Ocean, Birds, Fire) totaling 25+ audio tracks. Powers the mini player with play/pause, track skip, volume control, and real-time audio frequency visualizer."),
        _bold_p("Why: ", "We needed: (1) seamless looping without gaps — Howler handles this natively, while raw HTML5 Audio has a noticeable gap on loop restart; (2) Web Audio API access for the frequency visualizer — Howler exposes AudioContext and AnalyserNode through Howler.ctx and Howler.masterGain; (3) cross-browser compatibility — Safari handles audio differently, Howler normalizes it; (4) html5: false mode for Web Audio API routing (visualizer won't work in html5 mode). Alternatives: Tone.js was too heavy for simple playback, and raw Web Audio API would require 200+ lines of boilerplate that Howler handles in 5."),
        _p("무엇: 크로스 브라우저 오디오 라이브러리. Web Audio API와 HTML5 Audio 추상화."),
        _p("어디서: 앰비언스 사운드 6종 25+트랙. 미니 플레이어 (재생/스킵/볼륨/비주얼라이저)."),
        _p("왜: (1) 갭 없는 루프 — HTML5 Audio는 루프 시 끊김; (2) Web Audio API 접근으로 주파수 비주얼라이저; (3) Safari 호환성; (4) Tone.js는 단순 재생에 과중, raw Web Audio API는 200줄 보일러플레이트 필요."),
        _div(),

        _h3("Tailwind CSS"),
        _bold_p("What: ", "Utility-first CSS framework that provides pre-built CSS classes."),
        _bold_p("Where: ", "All UI components — header, sidebar, timer display, sound mixer, room list, buttons, badges."),
        _bold_p("Why: ", "Speed of development. As a solo developer, writing custom CSS for every component would take 3x longer. Tailwind's utility classes let us go from design to implementation in minutes. The dark theme (stone/amber color palette) was built entirely with Tailwind's color system. PurgeCSS (built into Tailwind) strips unused classes, keeping the final CSS bundle under 10KB. Bootstrap was rejected because its opinionated design doesn't fit a pixel-art aesthetic. CSS Modules would work but require constant file switching."),
        _p("무엇: 유틸리티 우선 CSS 프레임워크."),
        _p("어디서: 모든 UI — 헤더, 사이드바, 타이머, 사운드 믹서, 방 목록."),
        _p("왜: 솔로 개발자로서 커스텀 CSS는 3배 느림. 다크 테마를 Tailwind 색상 시스템으로 구축. PurgeCSS로 최종 CSS 10KB 미만. Bootstrap은 픽셀아트 미학에 부적합."),
        _div(),

        _h2("Real-time Technology"),
        _div(),

        _h3("Supabase Realtime (Presence)"),
        _bold_p("What: ", "WebSocket-based real-time presence system provided by Supabase. Tracks who is online in each channel."),
        _bold_p("Where: ", "Live user tracking per study room. When a user joins '1F', all other users in '1F' see their character appear. When they leave, the character disappears."),
        _bold_p("Why: ", "Building a custom WebSocket server would require: a Node.js/Python server, connection management, heartbeat/reconnection logic, horizontal scaling (sticky sessions or Redis pub/sub), and deployment infrastructure — easily 500+ lines of code and a separate server cost. Supabase Presence does all of this out of the box, within the free tier (up to 200 concurrent connections). It uses PostgreSQL's LISTEN/NOTIFY under the hood, which means presence state is automatically persisted. The channel-per-room pattern (room:1F, room:cafe) gives us isolated presence per floor with zero additional logic. Socket.io was considered but requires a dedicated server; Pusher/Ably have generous free tiers but add vendor lock-in. Supabase was already in our stack for the database, so using its Realtime feature was a natural zero-cost addition."),
        _p("무엇: Supabase 제공 WebSocket 기반 실시간 프레즌스. 채널별 온라인 유저 추적."),
        _p("어디서: 방별 실시간 유저 추적. 유저 입장/퇴장 시 캐릭터 나타남/사라짐."),
        _p("왜: 커스텀 WebSocket 서버 = 500줄+ 코드 + 별도 서버 비용. Supabase Presence는 무료 티어에서 전부 제공 (동시 200 연결). 이미 DB로 Supabase 사용 중이라 추가 비용 0. Socket.io는 별도 서버 필요, Pusher/Ably는 벤더 종속."),
        _div(),

        _h2("Backend Technology"),
        _div(),

        _h3("FastAPI (Python)"),
        _bold_p("What: ", "Modern, high-performance async Python web framework with automatic OpenAPI documentation."),
        _bold_p("Where: ", "Backend API server with endpoints for AI agent triggers, room statistics, weather data, and Notion documentation sync."),
        _bold_p("Why: ", "The AI agent stack (LangChain, CrewAI, AutoGen, LangGraph) is entirely Python-based. Using a Python backend means all AI libraries run natively without language bridges or subprocess calls. FastAPI was chosen over Flask because Flask lacks native async support — critical when agents make concurrent LLM API calls. Django was too heavy for an API-only service. Express.js (Node) would require Python subprocesses for AI calls, adding latency and complexity. FastAPI's automatic OpenAPI docs (/docs endpoint) are a bonus for interview demos — interviewers can see and test all endpoints instantly."),
        _p("무엇: 현대적 비동기 Python 웹 프레임워크. 자동 OpenAPI 문서 생성."),
        _p("어디서: 백엔드 API — AI 에이전트 트리거, 방 통계, 날씨, Notion 동기화."),
        _p("왜: AI 스택 (LangChain, CrewAI 등) 전부 Python. Flask는 네이티브 async 없음. Django는 API만 하기엔 과중. Node.js는 Python AI 라이브러리 호출에 서브프로세스 필요. FastAPI의 자동 API 문서는 면접 데모에 보너스."),
        _div(),

        _h2("Deployment"),
        _div(),

        _h3("Vercel"),
        _bold_p("What: ", "Frontend deployment platform built by the creators of Next.js."),
        _bold_p("Where: ", "Hosts the frontend at studylock.dev. Handles SSL, CDN, preview deployments per PR."),
        _bold_p("Why: ", "Zero-configuration Next.js deployment. Push to GitHub = auto deploy in 30 seconds. Free tier includes 100GB bandwidth, custom domains, and preview deployments. Netlify was considered but Vercel's Next.js integration is tighter (server components, ISR, edge functions work out of the box). AWS Amplify has a steeper learning curve for a solo developer."),
        _p("무엇: Next.js 제작자가 만든 프론트엔드 배포 플랫폼."),
        _p("어디서: studylock.dev 호스팅. SSL, CDN, PR별 프리뷰 배포."),
        _p("왜: Next.js 제로 설정 배포. GitHub push = 30초 자동 배포. 무료 티어 100GB 대역폭. Netlify보다 Next.js 통합 우수. AWS Amplify는 솔로 개발자에게 진입장벽 높음."),
        _div(),

        _h3("Supabase (PostgreSQL)"),
        _bold_p("What: ", "Open-source Firebase alternative with managed PostgreSQL, Realtime subscriptions, Auth, and Storage."),
        _bold_p("Where: ", "Database for room data and session logs. Realtime Presence for live user tracking (shared project with ducktype, tables prefixed with sl_)."),
        _bold_p("Why: ", "All-in-one: DB + Realtime + Auth in one service, one dashboard, one billing. Free tier: 500MB database, 50K monthly API requests, Realtime included. Firebase was considered but its NoSQL model is less flexible for relational room/session data. PlanetScale (MySQL) lacks built-in Realtime. Neon (PostgreSQL) has no Realtime feature — would require a separate WebSocket solution."),
        _p("무엇: PostgreSQL 기반 오픈소스 Firebase 대안. DB + Realtime + Auth + Storage."),
        _p("어디서: 방 데이터, 세션 로그 DB. Realtime Presence로 실시간 유저 (ducktype 프로젝트와 공유, sl_ 프리픽스)."),
        _p("왜: DB + Realtime + Auth 원스톱. 무료 500MB + Realtime 포함. Firebase NoSQL은 관계형 데이터에 불리. Neon은 Realtime 없어 별도 WebSocket 필요."),
    ]
    await _append(page_id, blocks)


async def _build_ai_agents(page_id: str) -> None:
    blocks = [
        _h2("AI Agent System Overview"),
        _p("StudyLock uses a multi-agent AI system to automatically optimize the study room environment. Three specialized agents collaborate to manage sound, visuals, and room capacity — triggered only when conditions change to keep API costs under $5/month."),
        _p("StudyLock은 멀티 에이전트 AI 시스템으로 스터디룸 환경을 자동 최적화합니다. 3개 전문 에이전트가 사운드, 비주얼, 방 용량을 관리 — 조건 변할 때만 실행하여 월 $5 미만 유지."),
        _div(),

        _h2("Agent Pipeline"),
        _code("""graph LR
    A[Condition Change] --> B[MCP: Get Data]
    B --> C[Atmosphere Agent]
    C --> D[Environment Agent]
    D --> E[Room Manager Agent]
    E --> F[AutoGen Discussion]
    F --> G[Apply Settings]
    G --> H[Log to Notion]""", "mermaid"),
        _div(),

        _h3("CrewAI — Multi-Agent Orchestration"),
        _bold_p("What: ", "Framework for building teams of AI agents with specialized roles that collaborate on complex tasks."),
        _bold_p("Where: ", "Orchestrates 3 agents: (1) Atmosphere Agent — decides sound mix based on weather/time, (2) Environment Agent — controls visual settings (lighting, weather effects) informed by Atmosphere's decision, (3) Room Manager Agent — monitors capacity and triggers floor expansion."),
        _bold_p("Why: ", "The study room environment has three independent concerns that must coordinate: sound shouldn't change without matching visual changes, and room expansion shouldn't happen without checking current conditions. A single monolithic function would quickly become unmaintainable as we add more environmental factors. CrewAI provides a clean agent abstraction where each agent has a focused prompt, a clear input/output contract, and can be tested independently. The framework handles agent sequencing (Atmosphere runs first because Environment needs its output). LangChain's built-in agent tools were considered but they're designed for single-agent tool use, not multi-agent collaboration. AutoGPT-style autonomous agents were rejected because we need deterministic, cost-controlled behavior, not open-ended exploration."),
        _p("무엇: 역할별 AI 에이전트 팀 구축 프레임워크."),
        _p("어디서: 3개 에이전트 오케스트레이션 — 사운드(Atmosphere), 비주얼(Environment), 용량(Room Manager)."),
        _p("왜: 사운드/비주얼/용량 세 관심사가 독립적이면서 조율 필요. 단일 함수는 유지보수 불가. CrewAI는 에이전트별 프롬프트/입출력 계약이 명확하고 독립 테스트 가능. LangChain 에이전트 도구는 단일 에이전트용. AutoGPT는 비용 제어 불가."),
        _div(),

        _h3("AutoGen — Agent Discussion Protocol"),
        _bold_p("What: ", "Microsoft's framework for multi-agent conversations where AI agents discuss and reach consensus."),
        _bold_p("Where: ", "After all three agents produce their recommendations, AutoGen facilitates a discussion round: Atmosphere proposes sound changes, Environment aligns visuals accordingly, Room Manager validates capacity. The discussion log is stored and exposed via API for admin dashboard and interview demo."),
        _bold_p("Why: ", "Without a discussion step, agents might apply conflicting settings — e.g., Atmosphere sets 'calm night' sounds while Environment keeps 'bright daytime' visuals. AutoGen ensures coherence by letting agents react to each other's proposals before anything is applied. The discussion log serves dual purpose: (1) audit trail for debugging why a certain setting was applied, (2) a live demo for interviews — interviewers can see AI agents reasoning and reaching consensus in real-time. The alternative (hardcoded conflict resolution rules) would be brittle and miss edge cases that LLM reasoning handles naturally."),
        _p("무엇: Microsoft의 멀티 에이전트 대화/합의 프레임워크."),
        _p("어디서: 3개 에이전트 추천 후 토론. Atmosphere가 제안 → Environment가 맞춤 → Room Manager 검증. 토론 로그 API로 노출."),
        _p("왜: 토론 없으면 충돌 발생 (밤 사운드 + 낮 비주얼). AutoGen으로 일관성 보장. 토론 로그 = (1) 디버깅 감사 추적 (2) 면접 데모. 하드코딩 규칙은 엣지 케이스 놓침."),
        _div(),

        _h3("LangChain — LLM Orchestration"),
        _bold_p("What: ", "Framework for building applications powered by LLMs — provides prompt templates, chains, memory, and tool integrations."),
        _bold_p("Where: ", "The LLM call layer for all 3 agents. Each agent uses a LangChain ChatPromptTemplate with system/human message pairs, connected to Claude via langchain-anthropic. The prompt → LLM → parse output chain is standardized across agents."),
        _bold_p("Why: ", "Direct Anthropic SDK calls would work but require duplicating prompt formatting, error handling, and response parsing in each agent. LangChain standardizes this: one ChatPromptTemplate per agent, one pipe operator to connect to the LLM, one output format. Switching from Claude Haiku to Sonnet is a one-line model name change. Adding memory (if we wanted agents to remember past decisions) is a plug-in module. The langchain-anthropic integration handles API key management, rate limiting, and retry logic. Raw API calls would need 30+ lines of boilerplate per agent; LangChain reduces it to 5."),
        _p("무엇: LLM 기반 애플리케이션 프레임워크 — 프롬프트 템플릿, 체인, 메모리, 도구 통합."),
        _p("어디서: 3개 에이전트의 LLM 호출 레이어. ChatPromptTemplate + Claude API (langchain-anthropic)."),
        _p("왜: 직접 API 호출은 프롬프트/에러/파싱을 에이전트마다 중복. LangChain으로 표준화 — 에이전트당 5줄. 모델 교체 한 줄. 메모리 플러그인 모듈. 재시도 로직 내장."),
        _div(),

        _h3("LangGraph — State Machine Workflows"),
        _bold_p("What: ", "Framework for building stateful, multi-step AI workflows as directed graphs with conditional routing."),
        _bold_p("Where: ", "Room state management cycle: Check Conditions → Analyze Environment → Decide Changes → (Apply or Wait). The graph has conditional edges — if no changes are needed, it routes to Wait instead of Apply, saving an LLM call."),
        _bold_p("Why: ", "The environment optimization is inherently a state machine: the room is always in one of four states (morning/afternoon/evening/night), and transitions are triggered by specific conditions. A simple if/else chain would work for 4 states, but as we add more factors (weather, capacity, user preferences, special events), the state space grows exponentially. LangGraph makes state transitions explicit and visual — you can diagram the exact flow, which is invaluable for architecture documentation and interview explanations. The conditional routing (apply vs wait) is LangGraph's killer feature: it prevents unnecessary LLM calls, directly reducing API costs."),
        _p("무엇: 상태 기반 AI 워크플로우를 방향 그래프로 구축하는 프레임워크."),
        _p("어디서: 방 상태 관리 — 조건 확인 → 분석 → 결정 → 적용/대기. 조건부 라우팅으로 불필요한 LLM 호출 방지."),
        _p("왜: 환경 최적화는 본질적으로 상태 머신 (아침/오후/저녁/밤). if/else는 상태 늘어나면 관리 불가. LangGraph는 전이를 명시적/시각적으로. 조건부 라우팅으로 API 비용 절감."),
        _div(),

        _h3("LangGraph State Machine"),
        _code("""stateDiagram-v2
    [*] --> CheckConditions
    CheckConditions --> Analyze
    Analyze --> Decide
    Decide --> Apply: changes needed
    Decide --> Wait: no changes
    Apply --> [*]
    Wait --> [*]""", "mermaid"),
        _div(),

        _h3("MCP (Model Context Protocol)"),
        _bold_p("What: ", "Anthropic's open protocol for connecting AI models to external tools and data sources in a standardized way."),
        _bold_p("Where: ", "Two distinct uses: (1) Agent Tool Server — provides get_weather(), get_time_info(), get_room_stats() tools that AI agents call to gather real-world data before making decisions. (2) Documentation Automation — syncs project docs, deploy logs, test results, and agent discussion logs to Notion via the Notion API."),
        _bold_p("Why: ", "MCP provides a standardized interface between AI agents and external systems. Without it, each agent would need custom API integration code for weather, time, room stats, AND Notion — four different integrations with four different error handling patterns. MCP abstracts this: agents declare what tools they need, and the MCP server handles the actual API calls, authentication, rate limiting, and error recovery. The same protocol serves both purposes (agent tools AND doc automation), demonstrating its versatility. This is also forward-looking: as we add more external integrations (Spotify, Google Calendar), they plug into the same MCP server without changing agent code."),
        _p("무엇: Anthropic의 AI 모델 ↔ 외부 도구 연결 프로토콜."),
        _p("어디서: (1) 에이전트 도구 서버 — 날씨/시간/방 통계 도구 (2) Notion 자동 문서화."),
        _p("왜: MCP 없으면 에이전트마다 별도 API 통합 코드 필요 (4개 다른 에러 처리). MCP로 추상화 — 도구 선언하면 서버가 API/인증/재시도 처리. 같은 프로토콜로 에이전트 도구 + 문서 자동화. Spotify/Calendar 추가 시 에이전트 코드 변경 없이 MCP 서버만 확장."),
    ]
    await _append(page_id, blocks)


async def _build_testing(page_id: str) -> None:
    blocks = [
        _h2("Playwright E2E Testing"),
        _div(),

        _h3("Playwright"),
        _bold_p("What: ", "End-to-end browser testing framework by Microsoft. Launches a real browser (Chromium) and simulates user interactions."),
        _bold_p("Where: ", "23 E2E test cases covering every user-facing feature: page load, Canvas rendering, zoom controls, Pomodoro timer (start/pause/reset/break/resume), Break room switching (cafe/garden), sound system (select/toggle/mute), room navigation (floor switching), and access control (break rooms disabled when not on break, study floors disabled during break)."),
        _bold_p("Why: ", "Unit tests can't verify that a Canvas renders correctly or that a WebSocket connection actually syncs users across tabs. Playwright runs a real Chromium browser and interacts with the actual DOM — if a user can click it, Playwright can test it. Jest/JSDOM was rejected because JSDOM doesn't support Canvas 2D or Web Audio API (both critical for our app). Cypress was considered but Playwright's auto-wait mechanism and native multi-tab support (needed for presence testing) are superior. The 23 test cases provide confidence that any code change won't break existing features — essential for a solo developer who can't manually QA every feature on every PR."),
        _p("무엇: Microsoft의 E2E 브라우저 테스트. 실제 Chromium에서 유저 인터랙션 시뮬레이션."),
        _p("어디서: 23개 테스트 — 페이지 로드, 캔버스, 줌, 타이머, 브레이크, 사운드, 방 전환, 접근 제어."),
        _p("왜: 단위 테스트로 Canvas 렌더링이나 WebSocket 동기화 검증 불가. JSDOM은 Canvas/Web Audio 미지원. Cypress보다 auto-wait와 멀티탭 지원 우수. 23개 테스트로 솔로 개발자가 매 PR마다 수동 QA 불필요."),
        _div(),

        _h2("CI/CD with GitHub Actions"),
        _div(),

        _h3("GitHub Actions"),
        _bold_p("What: ", "CI/CD automation platform integrated directly into GitHub repositories."),
        _bold_p("Where: ", "Runs automatically on every PR and push to main. Pipeline: TypeScript type check → Next.js build verification → Playwright E2E tests (23 cases) → Vercel auto-deploy (on main). Test reports uploaded as artifacts for debugging failed runs."),
        _bold_p("Why: ", "GitHub Actions is free for public repositories (2,000 minutes/month). Since our code is on GitHub, there's zero setup friction — no external CI service to configure, no webhooks to manage, no separate authentication. CircleCI and TravisCI are alternatives but require external accounts and configuration. Jenkins is self-hosted (extra infrastructure). The tight GitHub integration means PR checks show green/red status inline, reviewers see test results before merging, and branch protection can enforce all tests passing."),
        _p("무엇: GitHub 저장소 통합 CI/CD 자동화."),
        _p("어디서: 모든 PR/push 시 실행. 타입 체크 → 빌드 → Playwright 23개 → Vercel 배포."),
        _p("왜: 공개 레포 무료 (월 2,000분). GitHub에 코드 있으니 설정 마찰 0. CircleCI/TravisCI는 외부 계정 필요. PR에 테스트 결과 인라인 표시."),
    ]
    await _append(page_id, blocks)


# ============================================================
# MAIN SYNC FUNCTION
# ============================================================

async def sync_all(parent_page_id: str) -> dict:
    """Create/update all documentation sub-pages under the parent."""
    await _clear(parent_page_id)

    # Add intro to parent page
    await _append(parent_page_id, [
        _h2("StudyLock Documentation"),
        _p(f"Auto-generated via MCP | Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M')}"),
        _p("Navigate to sub-pages below for detailed documentation."),
        _p("아래 하위 페이지에서 상세 문서를 확인하세요."),
        _div(),
    ])

    # Create sub-pages
    pages = [
        ("Overview", "🏠", _build_overview),
        ("Architecture", "🏗", _build_architecture),
        ("Tech Stack", "⚙", _build_tech_stack),
        ("AI Agent System", "🤖", _build_ai_agents),
        ("Testing & CI/CD", "🧪", _build_testing),
    ]

    created_pages = []
    for title, icon, builder in pages:
        page_id = await _create_subpage(parent_page_id, title, icon)
        await builder(page_id)
        created_pages.append({"title": title, "id": page_id})

    return {
        "status": "ok",
        "pages_created": len(created_pages),
        "pages": created_pages,
        "synced_at": datetime.now().isoformat(),
    }


# Keep backward compat
async def sync_tech_stack(page_id: str) -> dict:
    return await sync_all(page_id)


async def log_deploy(page_id: str, status: str, version: str, environment: str, error: str = "") -> dict:
    blocks = [_div(), _h3(f"{'OK' if status == 'success' else 'FAIL'} Deploy - {environment} - {datetime.now().strftime('%Y-%m-%d %H:%M')}"),
              _bullet(f"Status: {status}"), _bullet(f"Version: {version}"), _bullet(f"Environment: {environment}")]
    if error:
        blocks.append(_bullet(f"Error: {error}"))
    await _append(page_id, blocks)
    return {"status": "ok"}


async def log_test_results(page_id: str, total: int, passed: int, failed: int, failed_cases: list[str] = []) -> dict:
    blocks = [_div(), _h3(f"Test Run - {datetime.now().strftime('%Y-%m-%d %H:%M')}"),
              _bullet(f"Total: {total} | Passed: {passed} | Failed: {failed}")]
    for c in failed_cases:
        blocks.append(_bullet(f"FAIL: {c}"))
    await _append(page_id, blocks)
    return {"status": "ok"}


async def log_agent_discussion(page_id: str, trigger: str, discussion: dict) -> dict:
    blocks = [_div(), _h3(f"Agent Discussion - {trigger} - {datetime.now().strftime('%Y-%m-%d %H:%M')}")]
    for turn in discussion.get("turns", []):
        blocks.append(_bullet(f"{turn['agent']}: {turn['message'][:200]}"))
    blocks.append(_p(f"Decision: {discussion.get('final_decision', 'N/A')}"))
    await _append(page_id, blocks)
    return {"status": "ok"}
