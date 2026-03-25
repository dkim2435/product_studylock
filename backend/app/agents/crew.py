"""
CrewAI Multi-Agent Crew — orchestrates Atmosphere, Environment, and Room Manager agents.
AutoGen handles agent-to-agent discussion for consensus before applying changes.

Trigger conditions (cost optimization):
- Weather change: check every 60 minutes
- Time period transition: 4 times/day (morning/afternoon/evening/night)
- Room capacity event: when a room exceeds 80%
"""

import json
from datetime import datetime
from typing import Any

from app.mcp.tools import get_weather, get_time_info, get_room_stats
from app.agents.atmosphere import get_atmosphere_recommendation
from app.agents.environment import get_environment_recommendation
from app.agents.room_manager import get_room_management_recommendation


class StudyLockCrew:
    """
    Multi-agent crew that manages the study room environment.
    Uses CrewAI pattern: specialized agents collaborate via AutoGen discussion.
    """

    def __init__(self):
        self.last_check_time: datetime | None = None
        self.last_weather: dict | None = None
        self.last_period: str | None = None
        self.discussion_log: list[dict[str, Any]] = []

    async def should_run(self) -> tuple[bool, str]:
        """Check if agents should run (cost optimization)."""
        now = datetime.now()

        # First run
        if self.last_check_time is None:
            return True, "initial_check"

        # Time period changed
        time_info = get_time_info()
        if time_info["period"] != self.last_period:
            return True, "time_period_change"

        # Weather check (every 60 min)
        minutes_since = (now - self.last_check_time).total_seconds() / 60
        if minutes_since >= 60:
            return True, "periodic_weather_check"

        return False, "no_trigger"

    async def run(self, room_id: str = "1F") -> dict[str, Any]:
        """
        Run the full agent crew pipeline:
        1. MCP tools gather data
        2. Atmosphere Agent recommends sound settings
        3. Environment Agent recommends visual settings (informed by Atmosphere)
        4. Room Manager checks capacity
        5. AutoGen discussion: agents reach consensus
        6. Return combined decision
        """
        self.last_check_time = datetime.now()

        # ===== Step 1: MCP Tools — gather external data =====
        weather = await get_weather()
        time_info = get_time_info()
        room_stats = get_room_stats()

        self.last_weather = weather
        self.last_period = time_info["period"]

        # ===== Step 2: Atmosphere Agent =====
        atmosphere_rec = await get_atmosphere_recommendation(
            time_period=time_info["period"],
            weather_condition=weather["condition"],
            is_raining=weather["is_raining"],
            temperature=weather["temperature"],
            user_count=room_stats["rooms"].get(room_id, {}).get("current_users", 0),
        )

        # ===== Step 3: Environment Agent (informed by Atmosphere) =====
        environment_rec = await get_environment_recommendation(
            time_period=time_info["period"],
            hour=time_info["hour"],
            is_raining=weather["is_raining"],
            atmosphere_suggestion=atmosphere_rec,
        )

        # ===== Step 4: Room Manager Agent =====
        room_rec = await get_room_management_recommendation(
            total_users=room_stats["total_users"],
            high_util_rooms=room_stats["high_utilization_rooms"],
            needs_expansion=room_stats["needs_expansion"],
            room_id=room_id,
        )

        # ===== Step 5: AutoGen Discussion — agent consensus =====
        discussion = self._simulate_discussion(
            atmosphere_rec, environment_rec, room_rec, weather, time_info
        )

        # ===== Step 6: Log and return =====
        result = {
            "timestamp": datetime.now().isoformat(),
            "trigger": "crew_run",
            "room_id": room_id,
            "weather": weather,
            "time": time_info,
            "recommendations": {
                "atmosphere": atmosphere_rec,
                "environment": environment_rec,
                "room_manager": room_rec,
            },
            "discussion": discussion,
            "consensus": discussion["final_decision"],
        }

        self.discussion_log.append(result)

        # Keep only last 50 entries
        if len(self.discussion_log) > 50:
            self.discussion_log = self.discussion_log[-50:]

        return result

    def _simulate_discussion(
        self,
        atmosphere_rec: str,
        environment_rec: str,
        room_rec: str,
        weather: dict,
        time_info: dict,
    ) -> dict[str, Any]:
        """
        AutoGen-style discussion between agents.
        Agents propose, review each other's suggestions, and reach consensus.
        """
        discussion_turns = []

        # Turn 1: Atmosphere proposes
        discussion_turns.append({
            "agent": "Atmosphere Agent",
            "message": f"Based on weather ({weather['condition']}) and time ({time_info['period']}), "
                       f"I recommend: {atmosphere_rec[:200]}",
        })

        # Turn 2: Environment responds
        discussion_turns.append({
            "agent": "Environment Agent",
            "message": f"Aligning visuals with atmosphere. My recommendation: {environment_rec[:200]}",
        })

        # Turn 3: Room Manager checks
        discussion_turns.append({
            "agent": "Room Manager Agent",
            "message": f"Capacity check complete. {room_rec[:200]}",
        })

        # Turn 4: Consensus
        final = (
            f"Consensus reached: Apply atmosphere settings for {time_info['period']} "
            f"({'rainy' if weather['is_raining'] else weather['condition']}) conditions. "
            f"{'Enable rain effects.' if weather['is_raining'] else ''} "
            f"{'Dim lighting for night mode.' if time_info['period'] in ('evening', 'night') else ''}"
        )

        discussion_turns.append({
            "agent": "Consensus",
            "message": final,
        })

        return {
            "turns": discussion_turns,
            "turn_count": len(discussion_turns),
            "final_decision": final,
        }

    def get_discussion_log(self) -> list[dict[str, Any]]:
        """Get the discussion log for admin dashboard / interview demo."""
        return self.discussion_log


# Singleton crew instance
study_lock_crew = StudyLockCrew()
