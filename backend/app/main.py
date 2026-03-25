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

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.agents.crew import study_lock_crew
from app.mcp.tools import get_weather, get_time_info, get_room_stats
from app.graphs.room_state import room_graph, RoomState

load_dotenv()

app = FastAPI(
    title="StudyLock API",
    description="AI-powered adaptive study room backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "studylock-backend"}


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


@app.post("/api/agents/check")
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


@app.post("/api/agents/force")
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


@app.post("/api/graph/run")
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

NOTION_PAGE_ID = os.getenv("NOTION_PAGE_ID", "32eb0da0c373801487f0dbebfc58b58b")


@app.post("/api/notion/sync")
async def notion_sync():
    """Sync full tech stack documentation to Notion via MCP."""
    from app.mcp.notion_sync import sync_tech_stack
    result = await sync_tech_stack(NOTION_PAGE_ID)
    return result


@app.post("/api/notion/deploy")
async def notion_deploy(status: str = "success", version: str = "1.0.0", environment: str = "production"):
    """Log deployment result to Notion via MCP."""
    from app.mcp.notion_sync import log_deploy
    result = await log_deploy(NOTION_PAGE_ID, status, version, environment)
    return result


@app.post("/api/notion/test")
async def notion_test(total: int = 23, passed: int = 23, failed: int = 0):
    """Log test results to Notion via MCP."""
    from app.mcp.notion_sync import log_test_results
    result = await log_test_results(NOTION_PAGE_ID, total, passed, failed)
    return result


# ===== Playwright MCP Endpoints =====

@app.post("/api/monitor/health")
async def monitor_health():
    """AI-driven site health check via Playwright MCP."""
    from app.mcp.playwright_monitor import check_site_health
    return await check_site_health()


@app.post("/api/monitor/canvas")
async def monitor_canvas():
    """Verify Canvas rendering via Playwright MCP."""
    from app.mcp.playwright_monitor import check_canvas_rendering
    return await check_canvas_rendering()


@app.post("/api/monitor/sound")
async def monitor_sound():
    """Verify sound system via Playwright MCP."""
    from app.mcp.playwright_monitor import check_sound_system
    return await check_sound_system()


@app.post("/api/monitor/rooms")
async def monitor_rooms():
    """Verify room navigation via Playwright MCP."""
    from app.mcp.playwright_monitor import check_room_navigation
    return await check_room_navigation()


@app.post("/api/monitor/full")
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
