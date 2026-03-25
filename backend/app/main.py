"""
StudyLock Backend — FastAPI server with AI agent endpoints.

Architecture:
- /api/agents/check    — Trigger agent crew check (condition-based)
- /api/agents/force    — Force run agent crew (for demo)
- /api/agents/log      — Get agent discussion log
- /api/rooms/stats     — Get room statistics
- /api/health          — Health check
"""

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
