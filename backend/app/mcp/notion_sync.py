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
    return [{"type": "text", "text": {"content": text}}]


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
        for i in range(0, len(blocks), 100):
            chunk = blocks[i:i+100]
            resp = await client.patch(
                f"{NOTION_API_URL}/blocks/{page_id}/children",
                headers=_headers(),
                json={"children": chunk},
                timeout=10.0,
            )
            resp.raise_for_status()
    return {"status": "ok", "blocks_added": len(blocks)}


async def _clear_page(page_id: str):
    """Remove all blocks from a page (to overwrite)."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{NOTION_API_URL}/blocks/{page_id}/children",
            headers=_headers(),
            timeout=10.0,
        )
        data = resp.json()
        for block in data.get("results", []):
            await client.delete(
                f"{NOTION_API_URL}/blocks/{block['id']}",
                headers=_headers(),
                timeout=10.0,
            )


async def sync_tech_stack(page_id: str) -> dict:
    """
    Write full tech stack documentation to Notion page.
    Bilingual: English + Korean.
    """
    await _clear_page(page_id)

    blocks = [
        _heading2("📚 StudyLock — Tech Stack Documentation"),
        _paragraph(f"Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M')} (auto-generated via MCP)"),
        _divider(),

        # === Frontend ===
        _heading2("Frontend"),

        _heading3("Next.js + TypeScript"),
        _paragraph("What: React-based full-stack framework with server-side rendering and static generation."),
        _paragraph("Where: Main frontend application framework. App Router for page routing."),
        _paragraph("Why: Fast initial page load via SSR, excellent developer experience, built-in optimization, seamless Vercel deployment."),
        _paragraph("무엇: React 기반 풀스택 프레임워크. 서버사이드 렌더링과 정적 생성 지원."),
        _paragraph("어디서: 프론트엔드 앱 전체. App Router로 페이지 라우팅."),
        _paragraph("왜: SSR로 빠른 초기 로딩, 개발자 경험 우수, Vercel 배포 원클릭."),
        _divider(),

        _heading3("Canvas 2D"),
        _paragraph("What: Browser-native 2D rendering API for pixel-art graphics."),
        _paragraph("Where: Study room visualization — tiles, furniture, characters, lighting effects."),
        _paragraph("Why: Pixel-perfect rendering with integer zoom. No WebGL overhead needed for 2D pixel art. Reference: pixel-agents rendering engine."),
        _paragraph("무엇: 브라우저 내장 2D 렌더링 API."),
        _paragraph("어디서: 스터디룸 시각화 — 타일, 가구, 캐릭터, 조명 효과."),
        _paragraph("왜: 정수 줌으로 픽셀 퍼펙트 렌더링. 2D 픽셀아트에 WebGL 불필요."),
        _divider(),

        _heading3("Howler.js"),
        _paragraph("What: Cross-browser audio library for sound playback."),
        _paragraph("Where: Ambient sound system — Lofi, Rain, Ocean, Birds, Fire, Cabin tracks."),
        _paragraph("Why: Loop support, volume control, Web Audio API integration for visualizer. Works across all browsers."),
        _paragraph("무엇: 크로스 브라우저 오디오 라이브러리."),
        _paragraph("어디서: 앰비언스 사운드 시스템 — 6개 카테고리, 25+ 트랙."),
        _paragraph("왜: 루프/볼륨/페이드 지원, Web Audio API 연동으로 비주얼라이저 구현."),
        _divider(),

        _heading3("Tailwind CSS"),
        _paragraph("What: Utility-first CSS framework."),
        _paragraph("Where: All UI components — sidebar, timer, sound mixer, room list."),
        _paragraph("Why: Rapid UI development, consistent design system, small bundle size with purge."),
        _paragraph("무엇: 유틸리티 우선 CSS 프레임워크."),
        _paragraph("어디서: 모든 UI 컴포넌트 — 사이드바, 타이머, 사운드 믹서, 방 목록."),
        _paragraph("왜: 빠른 UI 개발, 일관된 디자인, 퍼지로 작은 번들 사이즈."),
        _divider(),

        # === Real-time ===
        _heading2("Real-time"),

        _heading3("Supabase Realtime (Presence)"),
        _paragraph("What: Real-time presence system built on WebSocket, provided by Supabase."),
        _paragraph("Where: Live user tracking — see who's in each room in real-time."),
        _paragraph("Why: No custom WebSocket server needed. Free tier included. Built-in presence channels with automatic state sync."),
        _paragraph("무엇: Supabase 제공 WebSocket 기반 실시간 프레즌스 시스템."),
        _paragraph("어디서: 실시간 유저 추적 — 각 방에 누가 있는지 실시간 확인."),
        _paragraph("왜: 커스텀 WebSocket 서버 불필요. 무료 티어 포함. 자동 상태 동기화."),
        _divider(),

        # === Backend ===
        _heading2("Backend"),

        _heading3("FastAPI (Python)"),
        _paragraph("What: Modern async Python web framework."),
        _paragraph("Where: Backend API server — agent endpoints, room stats, weather data."),
        _paragraph("Why: Native async support for AI library calls. Auto-generated API docs. Python ecosystem compatible with all AI frameworks."),
        _paragraph("무엇: 현대적 비동기 Python 웹 프레임워크."),
        _paragraph("어디서: 백엔드 API 서버 — 에이전트 엔드포인트, 방 통계, 날씨 데이터."),
        _paragraph("왜: AI 라이브러리 호출에 네이티브 비동기 지원. Python AI 생태계와 호환."),
        _divider(),

        # === AI Stack ===
        _heading2("AI Agent System"),

        _heading3("CrewAI"),
        _paragraph("What: Multi-agent orchestration framework. Agents with specialized roles collaborate on tasks."),
        _paragraph("Where: 3 specialized agents — Atmosphere Agent (sound), Environment Agent (visuals), Room Manager Agent (capacity)."),
        _paragraph("Why: Clean separation of concerns. Each agent focuses on one domain. Natural collaboration pattern for environment optimization."),
        _paragraph("무엇: 멀티 에이전트 오케스트레이션 프레임워크. 역할별 에이전트가 협업."),
        _paragraph("어디서: 3개 전문 에이전트 — 사운드, 비주얼, 방 관리 각각 담당."),
        _paragraph("왜: 관심사 분리. 각 에이전트가 한 도메인에 집중. 환경 최적화에 자연스러운 협업 패턴."),
        _divider(),

        _heading3("AutoGen"),
        _paragraph("What: Microsoft's multi-agent conversation framework. Agents discuss and reach consensus."),
        _paragraph("Where: Agent discussion protocol — when conditions change, agents propose solutions and agree before applying."),
        _paragraph("Why: Prevents conflicting changes (e.g., sound and visuals out of sync). Discussion log serves as audit trail and interview demo."),
        _paragraph("무엇: Microsoft의 멀티 에이전트 대화 프레임워크. 에이전트 간 토론과 합의."),
        _paragraph("어디서: 에이전트 토론 프로토콜 — 조건 변경 시 에이전트들이 제안하고 합의 후 적용."),
        _paragraph("왜: 충돌 방지 (사운드/비주얼 불일치). 토론 로그가 감사 추적 및 면접 데모 역할."),
        _divider(),

        _heading3("LangChain"),
        _paragraph("What: LLM application framework for building chains, prompts, and tool integrations."),
        _paragraph("Where: Base LLM call layer for all 3 agents. Prompt templates, Claude API integration."),
        _paragraph("Why: Standardized LLM interaction. Prompt management. Easy model switching (Haiku for cost, Sonnet if needed)."),
        _paragraph("무엇: LLM 애플리케이션 프레임워크. 체인, 프롬프트, 도구 통합."),
        _paragraph("어디서: 3개 에이전트의 LLM 호출 레이어. 프롬프트 템플릿, Claude API 연동."),
        _paragraph("왜: 표준화된 LLM 호출. 프롬프트 관리. 모델 교체 용이 (비용→Haiku, 성능→Sonnet)."),
        _divider(),

        _heading3("LangGraph"),
        _paragraph("What: State machine framework for building stateful AI workflows as directed graphs."),
        _paragraph("Where: Room state management — check conditions → analyze → decide → apply/wait cycle."),
        _paragraph("Why: Clear state transitions. Conditional routing (apply changes vs wait). Visualizable workflow for architecture docs."),
        _paragraph("무엇: 상태 머신 프레임워크. AI 워크플로우를 방향 그래프로 구축."),
        _paragraph("어디서: 방 상태 관리 — 조건 확인 → 분석 → 결정 → 적용/대기 사이클."),
        _paragraph("왜: 명확한 상태 전이. 조건부 라우팅. 아키텍처 문서에 시각화 가능."),
        _divider(),

        _heading3("MCP (Model Context Protocol)"),
        _paragraph("What: Anthropic's protocol for connecting AI models to external tools and data sources."),
        _paragraph("Where: Two uses — (1) Tool server for AI agents (weather, time, room stats), (2) Notion API integration for auto-documentation."),
        _paragraph("Why: Standardized tool interface. Agents call tools without knowing implementation details. Same protocol for both agent tools and doc automation."),
        _paragraph("무엇: Anthropic의 AI 모델 외부 도구 연결 프로토콜."),
        _paragraph("어디서: 두 가지 용도 — (1) AI 에이전트 도구 서버 (날씨/시간/방 통계), (2) Notion 자동 문서화."),
        _paragraph("왜: 표준화된 도구 인터페이스. 에이전트가 구현 세부사항 모르고 도구 호출. 에이전트 도구와 문서 자동화에 같은 프로토콜."),
        _divider(),

        # === Testing & DevOps ===
        _heading2("Testing & DevOps"),

        _heading3("Playwright"),
        _paragraph("What: End-to-end browser testing framework by Microsoft."),
        _paragraph("Where: 23 E2E test cases — page load, canvas rendering, timer, sound system, room navigation, break system."),
        _paragraph("Why: Real browser testing (not jsdom). Reliable selectors. CI/CD integration. Cross-browser support."),
        _paragraph("무엇: Microsoft의 E2E 브라우저 테스트 프레임워크."),
        _paragraph("어디서: 23개 테스트 케이스 — 페이지 로드, 캔버스, 타이머, 사운드, 방 전환, 브레이크."),
        _paragraph("왜: 실제 브라우저 테스트. CI/CD 연동. 크로스 브라우저 지원."),
        _divider(),

        _heading3("GitHub Actions"),
        _paragraph("What: CI/CD automation platform integrated with GitHub."),
        _paragraph("Where: Runs on every PR and push to main — TypeScript check → Build → Playwright tests."),
        _paragraph("Why: Free for public repos. Native GitHub integration. Auto-runs tests before merge."),
        _paragraph("무엇: GitHub 통합 CI/CD 자동화 플랫폼."),
        _paragraph("어디서: 모든 PR과 main 푸시 시 실행 — 타입 체크 → 빌드 → Playwright 테스트."),
        _paragraph("왜: 공개 레포 무료. GitHub 네이티브 연동. 머지 전 자동 테스트."),
        _divider(),

        # === Deployment ===
        _heading2("Deployment"),

        _heading3("Vercel"),
        _paragraph("What: Frontend deployment platform optimized for Next.js."),
        _paragraph("Where: Frontend hosting + domain (studylock.dev)."),
        _paragraph("Why: Zero-config Next.js deployment. Auto-deploy on git push. Free tier sufficient for MVP."),
        _paragraph("무엇: Next.js에 최적화된 프론트엔드 배포 플랫폼."),
        _paragraph("어디서: 프론트엔드 호스팅 + 도메인 (studylock.dev)."),
        _paragraph("왜: Next.js 제로 설정 배포. git push로 자동 배포. MVP에 무료 티어 충분."),
        _divider(),

        _heading3("Supabase (PostgreSQL)"),
        _paragraph("What: Open-source Firebase alternative with PostgreSQL, Realtime, Auth."),
        _paragraph("Where: Database for room data, session logs. Realtime Presence for live users."),
        _paragraph("Why: Free tier with 500MB DB + Realtime. No separate WebSocket server needed."),
        _paragraph("무엇: PostgreSQL 기반 오픈소스 Firebase 대안. Realtime, Auth 포함."),
        _paragraph("어디서: 방 데이터, 세션 로그 DB. Realtime Presence로 실시간 유저 추적."),
        _paragraph("왜: 무료 티어 500MB DB + Realtime. 별도 WebSocket 서버 불필요."),
        _divider(),

        _paragraph("---"),
        _paragraph("This document is auto-generated and synced via MCP → Notion integration."),
        _paragraph("이 문서는 MCP → Notion 연동으로 자동 생성 및 동기화됩니다."),
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
