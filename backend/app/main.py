"""
StudyLock Backend — FastAPI server with AI agent endpoints.

Architecture:
- /api/agents/check    — Trigger agent crew check (condition-based)
- /api/agents/force    — Force run agent crew (for demo)
- /api/agents/log      — Get agent discussion log
- /api/rooms/stats     — Get room statistics
- /api/notion/sync     — Sync tech stack docs to Notion (MCP)
- /api/notion/deploy   — Log deploy result to Notion
- /api/notion/test     — Log test results to Notion
- /api/health          — Health check
"""

import asyncio
import logging
import os

from fastapi import Depends, FastAPI, Header, HTTPException, status as http_status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.agents.crew import study_lock_crew
from app.mcp.tools import get_weather, get_time_info, get_room_stats
from app.graphs.room_state import room_graph, RoomState

load_dotenv()

logger = logging.getLogger("studylock")


def _parse_origins(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [o.strip() for o in raw.split(",") if o.strip()]


DEFAULT_ORIGINS = [
    "https://studylock.dev",
    "https://www.studylock.dev",
    "https://studylock.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
ALLOWED_ORIGINS = _parse_origins(os.getenv("ALLOWED_ORIGINS")) or DEFAULT_ORIGINS

API_SECRET_KEY = os.getenv("API_SECRET_KEY")
# The Notion page ID below is already public in git history (commit b6ec638),
# so keeping it as a safe default provides no additional exposure while letting
# the app run without manual config. Override via env var to point elsewhere.
NOTION_PAGE_ID = os.getenv("NOTION_PAGE_ID", "32eb0da0c373801487f0dbebfc58b58b")

if not API_SECRET_KEY:
    logger.warning(
        "API_SECRET_KEY not set — mutating endpoints (/api/agents/force, "
        "/api/notion/*, /api/monitor/*, /api/graph/run) are UNAUTHENTICATED. "
        "Set API_SECRET_KEY on the server to require X-API-Key."
    )


app = FastAPI(
    title="StudyLock API",
    description="AI-powered adaptive study room backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def require_api_key(x_api_key: str | None = Header(default=None)):
    """Gate expensive / mutating endpoints behind a shared secret.

    Fail-open when API_SECRET_KEY is not configured so the app runs without
    manual setup. When the key IS configured, it is enforced strictly.
    """
    if not API_SECRET_KEY:
        return
    if x_api_key != API_SECRET_KEY:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-API-Key",
        )




async def _safe_initial_crew_run():
    """Run the crew once at startup, guarded against tight crash-loops."""
    try:
        should_run, trigger = await study_lock_crew.should_run()
        if not should_run:
            logger.info("startup: skipping crew run (%s)", trigger)
            return
        await study_lock_crew.run("1F")
    except Exception:
        logger.exception("startup: initial crew run failed")


@app.on_event("startup")
async def startup():
    """Run agents once on startup so status indicator is live immediately."""
    asyncio.create_task(_safe_initial_crew_run())


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "studylock-backend"}


@app.get("/api/status")
async def status():
    """Check AI pipeline status — last run results and component health."""
    log = study_lock_crew.get_discussion_log()
    last_run = log[-1] if log else None

    last_run_payload = None
    if last_run:
        try:
            run_status = last_run.get("status") or {}
            last_run_payload = {
                "timestamp": last_run.get("timestamp"),
                "crewai": run_status.get("crewai", "unknown"),
                "autogen": run_status.get("autogen", "unknown"),
                "mcp": run_status.get("mcp", "unknown"),
                "consensus": last_run.get("consensus"),
            }
        except Exception:
            logger.exception("/api/status: failed to serialize last_run")
            last_run_payload = None

    return {
        "healthy": True,
        "last_run": last_run_payload,
        "total_runs": len(log),
        "api_key_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
    }


@app.get("/api/rooms/stats")
async def rooms_stats():
    """Get current room statistics via MCP tools."""
    return get_room_stats()


@app.get("/api/weather")
async def weather():
    """Get current weather via MCP tools."""
    return await get_weather()


@app.get("/api/time")
async def time_info():
    """Get current time info via MCP tools."""
    return get_time_info()


@app.post("/api/agents/check", dependencies=[Depends(require_api_key)])
async def agents_check(room_id: str = "1F"):
    """
    Check if agents should run based on conditions.
    Only runs if conditions have changed (cost optimization).
    """
    should_run, trigger = await study_lock_crew.should_run()

    if not should_run:
        return {
            "ran": False,
            "reason": trigger,
            "message": "No condition changes detected. Agents idle.",
        }

    result = await study_lock_crew.run(room_id)
    return {"ran": True, "reason": trigger, "result": result}


@app.post("/api/agents/force", dependencies=[Depends(require_api_key)])
async def agents_force(room_id: str = "1F"):
    """Force run the agent crew (for demo/testing)."""
    result = await study_lock_crew.run(room_id)
    return {"ran": True, "reason": "forced", "result": result}


@app.get("/api/agents/log")
async def agents_log():
    """Get agent discussion log (for admin dashboard / interview demo)."""
    log = study_lock_crew.get_discussion_log()
    return {
        "total_entries": len(log),
        "log": log[-10:],  # Last 10 entries
    }


@app.post("/api/graph/run", dependencies=[Depends(require_api_key)])
async def graph_run(room_id: str = "1F"):
    """Run the LangGraph room state machine."""
    initial_state: RoomState = {
        "time_period": "morning",
        "is_raining": False,
        "temperature": 20.0,
        "user_count": 10,
        "room_id": room_id,
        "ambience_preset": "default",
        "lighting": "bright",
        "weather_effects": False,
        "needs_expansion": False,
        "last_decision": "",
    }

    result = room_graph.invoke(initial_state)
    return {"state": result}


# ===== Notion MCP Endpoints =====


@app.post("/api/notion/sync", dependencies=[Depends(require_api_key)])
async def notion_sync():
    """Sync full tech stack documentation to Notion via MCP."""
    from app.mcp.notion_sync import sync_tech_stack
    result = await sync_tech_stack(NOTION_PAGE_ID)
    return result


@app.post("/api/notion/deploy", dependencies=[Depends(require_api_key)])
async def notion_deploy(status: str = "success", version: str = "1.0.0", environment: str = "production"):
    """Log deployment result to Notion via MCP."""
    from app.mcp.notion_sync import log_deploy
    result = await log_deploy(NOTION_PAGE_ID, status, version, environment)
    return result


@app.post("/api/notion/test", dependencies=[Depends(require_api_key)])
async def notion_test(total: int = 23, passed: int = 23, failed: int = 0):
    """Log test results to Notion via MCP."""
    from app.mcp.notion_sync import log_test_results
    result = await log_test_results(NOTION_PAGE_ID, total, passed, failed)
    return result


# ===== Playwright MCP Endpoints =====

@app.post("/api/monitor/health", dependencies=[Depends(require_api_key)])
async def monitor_health():
    """AI-driven site health check via Playwright MCP."""
    from app.mcp.playwright_monitor import check_site_health
    return await check_site_health()


@app.post("/api/monitor/canvas", dependencies=[Depends(require_api_key)])
async def monitor_canvas():
    """Verify Canvas rendering via Playwright MCP."""
    from app.mcp.playwright_monitor import check_canvas_rendering
    return await check_canvas_rendering()


@app.post("/api/monitor/sound", dependencies=[Depends(require_api_key)])
async def monitor_sound():
    """Verify sound system via Playwright MCP."""
    from app.mcp.playwright_monitor import check_sound_system
    return await check_sound_system()


@app.post("/api/monitor/rooms", dependencies=[Depends(require_api_key)])
async def monitor_rooms():
    """Verify room navigation via Playwright MCP."""
    from app.mcp.playwright_monitor import check_room_navigation
    return await check_room_navigation()


@app.post("/api/monitor/full", dependencies=[Depends(require_api_key)])
async def monitor_full():
    """Run all Playwright MCP checks and return combined report."""
    from app.mcp.playwright_monitor import (
        check_site_health, check_canvas_rendering,
        check_sound_system, check_room_navigation,
    )
    results = {
        "health": await check_site_health(),
        "canvas": await check_canvas_rendering(),
        "sound": await check_sound_system(),
        "rooms": await check_room_navigation(),
    }
    all_ok = all(r.get("status") == "ok" or r.get("status") == "healthy" for r in results.values())
    results["overall"] = "all_passed" if all_ok else "some_failed"
    return results
