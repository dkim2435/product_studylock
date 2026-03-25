"""
MCP Tool Server — provides external data tools for AI agents.
Tools: get_weather, get_time_info, get_room_stats
"""

import os
import httpx
from datetime import datetime, timezone
from typing import Any


async def get_weather(location: str = "New York") -> dict[str, Any]:
    """Get current weather for a location. Used by Atmosphere Agent to set ambience."""
    api_key = os.getenv("OPENWEATHER_API_KEY")

    if not api_key:
        # Fallback: simulate weather based on time
        hour = datetime.now().hour
        return {
            "location": location,
            "condition": "rain" if hour % 6 == 0 else "clear",
            "temperature": 20 + (hour % 10),
            "humidity": 60 + (hour % 30),
            "is_raining": hour % 6 == 0,
            "is_night": hour >= 20 or hour < 6,
            "source": "simulated",
        }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={"q": location, "appid": api_key, "units": "metric"},
                timeout=5.0,
            )
            data = resp.json()

            weather_main = data.get("weather", [{}])[0].get("main", "Clear").lower()
            is_raining = weather_main in ("rain", "drizzle", "thunderstorm")

            return {
                "location": location,
                "condition": weather_main,
                "temperature": data.get("main", {}).get("temp", 20),
                "humidity": data.get("main", {}).get("humidity", 50),
                "is_raining": is_raining,
                "is_night": data.get("sys", {}).get("sunset", 0) < datetime.now().timestamp(),
                "source": "openweather",
            }
    except Exception:
        return {
            "location": location,
            "condition": "clear",
            "temperature": 20,
            "humidity": 50,
            "is_raining": False,
            "is_night": datetime.now().hour >= 20 or datetime.now().hour < 6,
            "source": "fallback",
        }


def get_time_info() -> dict[str, Any]:
    """Get current time info. Used by Environment Agent for day/night transitions."""
    now = datetime.now()
    hour = now.hour

    if 6 <= hour < 12:
        period = "morning"
    elif 12 <= hour < 17:
        period = "afternoon"
    elif 17 <= hour < 20:
        period = "evening"
    else:
        period = "night"

    return {
        "hour": hour,
        "minute": now.minute,
        "period": period,
        "is_night": hour >= 20 or hour < 6,
        "timestamp": now.isoformat(),
        "timezone": str(now.astimezone().tzinfo),
    }


def get_room_stats() -> dict[str, Any]:
    """Get room statistics. Used by Room Manager Agent for load balancing."""
    # In production, this would query Supabase
    # For now, return simulated stats
    from random import randint

    floors = {}
    for i in range(1, 15):
        floors[f"{i}F"] = {
            "current_users": randint(3, 15),
            "max_users": 20,
            "utilization": 0,
        }
        floors[f"{i}F"]["utilization"] = round(
            floors[f"{i}F"]["current_users"] / floors[f"{i}F"]["max_users"], 2
        )

    floors["cafe"] = {"current_users": randint(2, 10), "max_users": 30, "utilization": 0}
    floors["cafe"]["utilization"] = round(floors["cafe"]["current_users"] / 30, 2)

    floors["garden"] = {"current_users": randint(2, 8), "max_users": 30, "utilization": 0}
    floors["garden"]["utilization"] = round(floors["garden"]["current_users"] / 30, 2)

    total = sum(f["current_users"] for f in floors.values())
    high_util = [k for k, v in floors.items() if v["utilization"] > 0.8]

    return {
        "total_users": total,
        "rooms": floors,
        "high_utilization_rooms": high_util,
        "needs_expansion": len(high_util) > len(floors) * 0.8,
    }


# MCP tool definitions for registration
MCP_TOOLS = [
    {
        "name": "get_weather",
        "description": "Get current weather conditions for ambience adaptation",
        "function": get_weather,
    },
    {
        "name": "get_time_info",
        "description": "Get current time info for day/night environment transitions",
        "function": get_time_info,
    },
    {
        "name": "get_room_stats",
        "description": "Get room statistics for load balancing decisions",
        "function": get_room_stats,
    },
]
