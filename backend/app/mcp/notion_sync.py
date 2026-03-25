"""
MCP → Notion Auto Documentation
Syncs project documentation, tech stack, deploy logs, test results to Notion.
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


def _rich_text(text: str) -> list:
    # Notion limits rich_text content to 2000 chars per element
    chunks = []
    for i in range(0, len(text), 2000):
        chunks.append({"type": "text", "text": {"content": text[i:i+2000]}})
    return chunks if chunks else [{"type": "text", "text": {"content": ""}}]


def _heading2(text: str) -> dict:
    return {
        "object": "block",
        "type": "heading_2",
        "heading_2": {"rich_text": _rich_text(text)},
    }


def _heading3(text: str) -> dict:
    return {
        "object": "block",
        "type": "heading_3",
        "heading_3": {"rich_text": _rich_text(text)},
    }


def _paragraph(text: str) -> dict:
    return {
        "object": "block",
        "type": "paragraph",
        "paragraph": {"rich_text": _rich_text(text)},
    }


def _divider() -> dict:
    return {"object": "block", "type": "divider", "divider": {}}


def _code(text: str, language: str = "plain text") -> dict:
    # Notion supported languages: https://developers.notion.com/reference/block#code
    supported = {"abap","arduino","bash","basic","c","clojure","coffeescript","c++","c#","css",
        "dart","diff","docker","elixir","elm","erlang","flow","fortran","f#","gherkin","glsl",
        "go","graphql","groovy","haskell","html","java","javascript","json","julia","kotlin",
        "latex","less","lisp","livescript","lua","makefile","markdown","markup","matlab",
        "mermaid","nix","objective-c","ocaml","pascal","perl","php","plain text","powershell",
        "prolog","protobuf","python","r","reason","ruby","rust","sass","scala","scheme",
        "scss","shell","sql","swift","typescript","vb.net","verilog","vhdl","visual basic",
        "webassembly","xml","yaml","java/c/c++/c#"}
    lang = language if language in supported else "plain text"
    return {
        "object": "block",
        "type": "code",
        "code": {
            "rich_text": _rich_text(text),
            "language": lang,
        },
    }


def _callout(text: str, icon: str = "💡") -> dict:
    # Use paragraph with bold prefix instead of callout to avoid emoji validation issues
    return {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [
                {"type": "text", "text": {"content": f"{icon} "}, "annotations": {"bold": True}},
                *_rich_text(text),
            ],
        },
    }


def _toggle(text: str) -> dict:
    return {
        "object": "block",
        "type": "toggle",
        "toggle": {"rich_text": _rich_text(text)},
    }


def _bulleted(text: str) -> dict:
    return {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {"rich_text": _rich_text(text)},
    }


async def _append_blocks(page_id: str, blocks: list[dict]) -> dict:
    """Append blocks to a Notion page."""
    async with httpx.AsyncClient() as client:
        # Notion API limits to 100 blocks per request
        for i in range(0, len(blocks), 50):
            chunk = blocks[i:i+50]
            resp = await client.patch(
                f"{NOTION_API_URL}/blocks/{page_id}/children",
                headers=_headers(),
                json={"children": chunk},
                timeout=30.0,
            )
            if resp.status_code != 200:
                error_msg = resp.text[:500].encode('ascii', 'replace').decode()
                raise Exception(f"Notion API error at block {i}: {resp.status_code} {error_msg}")
    return {"status": "ok", "blocks_added": len(blocks)}


async def _clear_page(page_id: str):
    """Remove all blocks from a page (to overwrite)."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Paginate through all blocks
        has_more = True
        start_cursor = None
        block_ids = []

        while has_more:
            params: dict = {"page_size": 100}
            if start_cursor:
                params["start_cursor"] = start_cursor
            resp = await client.get(
                f"{NOTION_API_URL}/blocks/{page_id}/children",
                headers=_headers(),
                params=params,
            )
            data = resp.json()
            block_ids.extend(b["id"] for b in data.get("results", []))
            has_more = data.get("has_more", False)
            start_cursor = data.get("next_cursor")

        # Delete in batches
        for bid in block_ids:
            try:
                await client.delete(
                    f"{NOTION_API_URL}/blocks/{bid}",
                    headers=_headers(),
                )
            except Exception:
                pass  # Skip failed deletes


async def sync_tech_stack(page_id: str) -> dict:
    """
    Write full project documentation to Notion page.
    Includes: Overview, Architecture, Mermaid flows, Tech stack (bilingual EN/KR).
    """
    await _clear_page(page_id)

    blocks = [
        # ===== HEADER =====
        _heading2("📚 StudyLock — Project Documentation"),
        _callout(f"Auto-generated via MCP → Notion | Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", "🤖"),
        _paragraph("A real-time collaborative study room with pixel-art visuals, ambient sounds, and AI-powered adaptive environment."),
        _paragraph("실시간 협업 스터디룸 — 픽셀아트 도서관에서 함께 공부하는 웹앱. AI가 환경을 자동 최적화."),
        _divider(),

        # ===== SYSTEM ARCHITECTURE =====
        _heading2("🏗 System Architecture / 시스템 아키텍처"),
        _code("""graph TB
    subgraph Frontend["Frontend (Next.js + Vercel)"]
        UI[Pixel-Art Study Room]
        Canvas[Canvas 2D Engine]
        Sound[Howler.js Sound System]
        Timer[Pomodoro Timer]
        Presence[Supabase Presence]
    end

    subgraph Backend["Backend (FastAPI + Railway)"]
        API[REST API]
        subgraph Agents["AI Agent Crew (CrewAI)"]
            Atmo[Atmosphere Agent]
            Env[Environment Agent]
            Room[Room Manager Agent]
        end
        Discussion[AutoGen Discussion]
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
    UI --> Presence
    Presence --> Supabase

    API --> Agents
    Atmo --> Discussion
    Env --> Discussion
    Room --> Discussion
    Discussion --> Graph
    Agents --> MCP_Tools

    MCP_Tools --> Weather
    MCP_Tools --> Supabase
    MCP_Tools --> Notion""", "mermaid"),
        _divider(),

        # ===== DATA FLOW =====
        _heading2("🔄 Data Flow / 데이터 흐름"),
        _code("""sequenceDiagram
    participant User
    participant Frontend
    participant Supabase
    participant Backend
    participant AI Agents
    participant MCP Tools

    User->>Frontend: Join study room
    Frontend->>Supabase: Subscribe to Presence channel
    Supabase-->>Frontend: Broadcast user joined
    Frontend->>Frontend: Render character in Canvas

    Note over Backend,AI Agents: Periodic check (condition-based)
    Backend->>MCP Tools: get_weather(), get_time_info()
    MCP Tools-->>Backend: Weather & time data
    Backend->>AI Agents: Run crew check
    AI Agents->>AI Agents: Atmosphere → Environment → Room Manager
    AI Agents->>AI Agents: AutoGen discussion & consensus
    AI Agents-->>Backend: Environment settings
    Backend->>MCP Tools: Log to Notion
    MCP Tools->>Notion: Update documentation""", "mermaid"),
        _divider(),

        # ===== AI AGENT FLOW =====
        _heading2("🤖 AI Agent Pipeline / AI 에이전트 파이프라인"),
        _callout("Agents only run when conditions change — weather shift, time-of-day transition, or room capacity event. This keeps API costs under $5/month.", "💡"),
        _callout("에이전트는 조건이 변할 때만 실행 — 날씨 변화, 시간대 전환, 방 용량 이벤트. 월 $5 미만 유지.", "💡"),
        _code("""graph LR
    A[Check Conditions] --> B{Changed?}
    B -->|No| C[Wait / Idle]
    B -->|Yes| D[MCP: Get Weather + Time]
    D --> E[Atmosphere Agent: Sound Mix]
    E --> F[Environment Agent: Visuals]
    F --> G[Room Manager: Capacity]
    G --> H[AutoGen: Discussion & Consensus]
    H --> I[Apply Changes]
    I --> J[Log to Notion via MCP]""", "mermaid"),
        _divider(),

        # ===== LANGGRAPH STATE MACHINE =====
        _heading2("📈 LangGraph Room State Machine"),
        _code("""stateDiagram-v2
    [*] --> CheckConditions
    CheckConditions --> Analyze
    Analyze --> Decide

    state Decide {
        [*] --> EvaluateChanges
        EvaluateChanges --> NeedChanges: conditions changed
        EvaluateChanges --> NoChanges: stable
    }

    Decide --> Apply: changes needed
    Decide --> Wait: no changes
    Apply --> [*]
    Wait --> [*]""", "mermaid"),
        _paragraph("States: morning → afternoon → evening → night"),
        _paragraph("Transitions: time change, weather change, room capacity change"),
        _paragraph("상태: 아침 → 오후 → 저녁 → 밤 | 전이 조건: 시간, 날씨, 방 용량"),
        _divider(),

        # ===== CI/CD PIPELINE =====
        _heading2("🚀 CI/CD Pipeline"),
        _code("""graph LR
    A[Git Push / PR] --> B[GitHub Actions]
    B --> C[TypeScript Check]
    C --> D[Next.js Build]
    D --> E[Playwright Tests - 23 cases]
    E -->|Pass| F[Vercel Auto Deploy]
    E -->|Fail| G[Block Merge]
    F --> H[studylock.dev Live]""", "mermaid"),
        _divider(),

        # ===== TECH STACK =====
        _heading2("⚙️ Tech Stack Details / 기술 스택 상세"),

        # -- Frontend --
        _heading3("🖥 Frontend"),
        _callout("Next.js + TypeScript — React framework with SSR\n• Where: Main app framework, App Router\n• Why: Fast initial load, Vercel deployment, great DX\n• 어디서: 프론트엔드 전체 | 왜: SSR 빠른 로딩, Vercel 원클릭 배포", "⚛️"),
        _callout("Canvas 2D — Browser-native 2D rendering\n• Where: Pixel-art study room (tiles, furniture, characters, lighting)\n• Why: Pixel-perfect with integer zoom, no WebGL needed\n• 어디서: 스터디룸 시각화 | 왜: 픽셀 퍼펙트 렌더링, WebGL 불필요", "🎨"),
        _callout("Howler.js — Cross-browser audio\n• Where: 6 sound categories, 25+ tracks, mini player with visualizer\n• Why: Loop/fade support, Web Audio API for frequency visualizer\n• 어디서: 앰비언스 사운드 시스템 | 왜: 루프/볼륨/비주얼라이저", "🔊"),
        _callout("Tailwind CSS — Utility-first CSS\n• Where: All UI components\n• Why: Rapid development, consistent design\n• 어디서: 모든 UI | 왜: 빠른 개발, 일관된 디자인", "🎨"),
        _divider(),

        # -- Real-time --
        _heading3("⚡ Real-time"),
        _callout("Supabase Realtime (Presence) — WebSocket presence\n• Where: Live user tracking per room\n• Why: No custom WebSocket server, free tier, auto state sync\n• 어디서: 방별 실시간 유저 | 왜: 서버 불필요, 무료, 자동 동기화", "⚡"),
        _divider(),

        # -- Backend --
        _heading3("🔧 Backend"),
        _callout("FastAPI (Python) — Async web framework\n• Where: API server for agents, room stats, weather\n• Why: Native async for AI calls, auto API docs, Python AI ecosystem\n• 어디서: 백엔드 API 서버 | 왜: AI 비동기 호출, Python 생태계", "🐍"),
        _divider(),

        # -- AI --
        _heading3("🤖 AI Agent System"),
        _callout("CrewAI — Multi-agent orchestration\n• Where: 3 agents — Atmosphere (sound), Environment (visuals), Room Manager (capacity)\n• Why: Separation of concerns, natural collaboration pattern\n• 어디서: 3개 전문 에이전트 | 왜: 관심사 분리, 협업 패턴", "🤖"),
        _callout("AutoGen — Agent discussion protocol\n• Where: Agents propose, review, reach consensus before applying\n• Why: Prevents conflicting changes, audit trail for demo\n• 어디서: 에이전트 토론/합의 | 왜: 충돌 방지, 면접 데모용 로그", "💬"),
        _callout("LangChain — LLM orchestration\n• Where: LLM call layer for all agents, prompt templates, Claude API\n• Why: Standardized LLM calls, easy model switching (Haiku/Sonnet)\n• 어디서: 에이전트 LLM 호출 | 왜: 표준화, 모델 교체 용이", "🔗"),
        _callout("LangGraph — State machine workflows\n• Where: Room state: check → analyze → decide → apply/wait\n• Why: Clear transitions, conditional routing, visualizable\n• 어디서: 방 상태 관리 사이클 | 왜: 명확한 상태 전이, 시각화 가능", "📊"),
        _callout("MCP (Model Context Protocol) — External tool integration\n• Where: (1) Agent tools: weather, time, room stats (2) Notion auto-docs\n• Why: Standardized tool interface for both agents and automation\n• 어디서: (1) 에이전트 도구 서버 (2) Notion 문서화 | 왜: 표준 도구 인터페이스", "🔌"),
        _divider(),

        # -- Testing --
        _heading3("🧪 Testing & DevOps"),
        _callout("Playwright — E2E browser testing\n• Where: 23 test cases covering all user flows\n• Why: Real browser tests, CI/CD integration\n• 어디서: 23개 테스트 (전체 유저 플로우) | 왜: 실제 브라우저, CI/CD 연동", "🧪"),
        _callout("GitHub Actions — CI/CD automation\n• Where: Every PR: TypeScript → Build → Playwright → Deploy\n• Why: Free, native GitHub, auto-test before merge\n• 어디서: PR마다 자동 실행 | 왜: 무료, 머지 전 자동 테스트", "🔄"),
        _divider(),

        # -- Deployment --
        _heading3("🚀 Deployment"),
        _callout("Vercel — Frontend hosting\n• Where: studylock.dev\n• Why: Zero-config Next.js deploy, auto-deploy on push\n• 어디서: 프론트엔드 호스팅 | 왜: 제로 설정 배포", "▲"),
        _callout("Supabase (PostgreSQL) — Database + Realtime\n• Where: Room data, session logs, Presence\n• Why: Free 500MB + Realtime, no separate WebSocket\n• 어디서: DB + 실시간 | 왜: 무료 티어, WebSocket 내장", "🗄️"),
        _divider(),

        # ===== PROJECT STRUCTURE =====
        _heading2("📁 Project Structure / 프로젝트 구조"),
        _code("""product_studylock/
├── frontend/                # Next.js App
│   ├── src/
│   │   ├── app/             # Pages (App Router)
│   │   ├── components/      # StudyRoom, Timer, AmbienceMixer
│   │   ├── engine/          # Canvas 2D: renderer, characters, tileMap, gameLoop
│   │   ├── hooks/           # usePresence, useAmbience, useTimer
│   │   └── lib/             # Supabase client
│   ├── tests/               # Playwright E2E (23 cases)
│   └── public/assets/       # Sprites, sounds (25+ tracks)
├── backend/                 # FastAPI Server
│   └── app/
│       ├── agents/          # CrewAI: atmosphere, environment, room_manager, crew
│       ├── graphs/          # LangGraph: room_state
│       └── mcp/             # MCP: tools, notion_sync
├── docs/                    # Markdown documentation
└── .github/workflows/       # CI/CD pipeline""", "plain text"),
        _divider(),

        # ===== FOOTER =====
        _callout("This document is auto-generated and synced via MCP → Notion integration.\n이 문서는 MCP → Notion 연동으로 자동 생성 및 동기화됩니다.", "📝"),
    ]

    result = await _append_blocks(page_id, blocks)
    return {**result, "page_id": page_id, "synced_at": datetime.now().isoformat()}


async def log_deploy(page_id: str, status: str, version: str, environment: str, error: str = "") -> dict:
    """Log a deployment result to Notion."""
    blocks = [
        _divider(),
        _heading3(f"{'✅' if status == 'success' else '❌'} Deploy — {environment} — {datetime.now().strftime('%Y-%m-%d %H:%M')}"),
        _bulleted(f"Status: {status}"),
        _bulleted(f"Version: {version}"),
        _bulleted(f"Environment: {environment}"),
    ]
    if error:
        _bulleted(f"Error: {error}")

    return await _append_blocks(page_id, blocks)


async def log_test_results(page_id: str, total: int, passed: int, failed: int, failed_cases: list[str] = []) -> dict:
    """Log test results to Notion."""
    blocks = [
        _divider(),
        _heading3(f"🧪 Test Run — {datetime.now().strftime('%Y-%m-%d %H:%M')}"),
        _bulleted(f"Total: {total} | Passed: {passed} | Failed: {failed}"),
    ]
    for case in failed_cases:
        blocks.append(_bulleted(f"❌ {case}"))

    return await _append_blocks(page_id, blocks)


async def log_agent_discussion(page_id: str, trigger: str, discussion: dict) -> dict:
    """Log an agent discussion to Notion."""
    blocks = [
        _divider(),
        _heading3(f"🤖 Agent Discussion — {trigger} — {datetime.now().strftime('%Y-%m-%d %H:%M')}"),
    ]
    for turn in discussion.get("turns", []):
        blocks.append(_bulleted(f"{turn['agent']}: {turn['message'][:200]}"))

    blocks.append(_paragraph(f"Decision: {discussion.get('final_decision', 'N/A')}"))

    return await _append_blocks(page_id, blocks)
