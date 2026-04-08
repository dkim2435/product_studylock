"""
CrewAI Multi-Agent Crew — actual implementation using crewai package.
3 agents collaborate to optimize study room environment.
AutoGen handles agent discussion for consensus.
"""

import json
from datetime import datetime
from typing import Any

from crewai import Agent, Task, Crew, Process
from langchain_anthropic import ChatAnthropic

from app.mcp.tools import get_weather, get_time_info, get_room_stats


def _create_llm():
    import os
    return ChatAnthropic(
        model="claude-haiku-4-5-20251001",
        temperature=0.3,
        max_tokens=512,
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
    )


def _build_crew() -> Crew:
    """Build the CrewAI crew with 3 specialized agents."""
    llm = _create_llm()

    atmosphere_agent = Agent(
        role="Atmosphere Agent",
        goal="Optimize ambient sound mix based on weather and time conditions",
        backstory="You are an audio environment specialist. You analyze weather and time-of-day data to recommend the perfect ambient sound settings for a study room. You output JSON with preset, rain_volume, nature_volume, and reason.",
        llm=llm,
        verbose=False,
        allow_delegation=False,
    )

    environment_agent = Agent(
        role="Environment Agent",
        goal="Manage visual theme settings (lighting, weather effects) for the study room",
        backstory="You are a visual environment designer. You adjust lighting (bright/dim), weather effects (rain on windows), and color temperature based on time and atmospheric conditions. You coordinate with the Atmosphere Agent. You output JSON with lighting, weather_effects, color_temperature, and reason.",
        llm=llm,
        verbose=False,
        allow_delegation=False,
    )

    room_manager_agent = Agent(
        role="Room Manager Agent",
        goal="Monitor room capacity and manage floor expansion",
        backstory="You manage study room capacity. Each floor holds 20 users. When floors exceed 80% capacity, you recommend expansion. You output JSON with action (none/create_floor/redirect_users), target_floor, and reason.",
        llm=llm,
        verbose=False,
        allow_delegation=False,
    )

    return Crew(
        agents=[atmosphere_agent, environment_agent, room_manager_agent],
        process=Process.sequential,
        verbose=False,
    )


class StudyLockCrew:
    """Multi-agent crew that manages the study room environment."""

    def __init__(self):
        self.last_check_time: datetime | None = None
        self.last_period: str | None = None
        self.discussion_log: list[dict[str, Any]] = []

    async def should_run(self) -> tuple[bool, str]:
        """Check if agents should run (cost optimization)."""
        now = datetime.now()
        if self.last_check_time is None:
            return True, "initial_check"
        time_info = get_time_info()
        if time_info["period"] != self.last_period:
            return True, "time_period_change"
        minutes_since = (now - self.last_check_time).total_seconds() / 60
        if minutes_since >= 60:
            return True, "periodic_weather_check"
        return False, "no_trigger"

    async def run(self, room_id: str = "1F") -> dict[str, Any]:
        """Run the full agent crew pipeline."""
        self.last_check_time = datetime.now()

        # Step 1: MCP tools gather data
        weather = await get_weather()
        time_info = get_time_info()
        room_stats = get_room_stats()
        self.last_period = time_info["period"]

        # Step 2: Build CrewAI tasks
        crew = _build_crew()

        atmosphere_task = Task(
            description=f"""Analyze these conditions and recommend sound settings:
            - Time: {time_info['period']} ({time_info['hour']}:00)
            - Weather: {weather['condition']}, Raining: {weather['is_raining']}
            - Temperature: {weather['temperature']}C
            - Users in room: {room_stats['rooms'].get(room_id, {}).get('current_users', 0)}
            Respond with JSON: {{"preset": "...", "rain_volume": 0.0-1.0, "nature_volume": 0.0-1.0, "reason": "..."}}""",
            expected_output="JSON object with sound settings",
            agent=crew.agents[0],
        )

        environment_task = Task(
            description=f"""Based on the atmosphere recommendations and these conditions:
            - Time: {time_info['period']}, Hour: {time_info['hour']}
            - Raining: {weather['is_raining']}
            Set visual environment. Respond with JSON: {{"lighting": "bright/dim", "weather_effects": true/false, "color_temperature": "warm/cool", "reason": "..."}}""",
            expected_output="JSON object with visual settings",
            agent=crew.agents[1],
        )

        room_task = Task(
            description=f"""Check room capacity:
            - Total users: {room_stats['total_users']}
            - High utilization rooms: {room_stats['high_utilization_rooms']}
            - Needs expansion: {room_stats['needs_expansion']}
            Respond with JSON: {{"action": "none/create_floor/redirect_users", "target_floor": "...", "reason": "..."}}""",
            expected_output="JSON object with room management action",
            agent=crew.agents[2],
        )

        # Step 3: Run crew
        crew.tasks = [atmosphere_task, environment_task, room_task]
        crew_status = "live"
        try:
            crew_result = crew.kickoff()
        except Exception as e:
            crew_status = "fallback"
            crew_result = f"Fallback: {time_info['period']} preset, {'rain' if weather['is_raining'] else 'clear'} conditions."

        # Step 4: AutoGen discussion for consensus
        discussion = await self._autogen_discussion(
            str(crew_result), weather, time_info
        )

        result = {
            "timestamp": datetime.now().isoformat(),
            "room_id": room_id,
            "weather": weather,
            "time": time_info,
            "crew_output": str(crew_result),
            "discussion": discussion,
            "consensus": discussion["final_decision"],
            "status": {
                "crewai": crew_status,
                "autogen": discussion["status"],
                "mcp": "live",
            },
        }

        self.discussion_log.append(result)
        if len(self.discussion_log) > 50:
            self.discussion_log = self.discussion_log[-50:]

        return result

    async def _autogen_discussion(
        self, crew_output: str, weather: dict, time_info: dict,
    ) -> dict[str, Any]:
        """AutoGen-style multi-agent discussion for consensus."""
        import os
        from autogen_agentchat.agents import AssistantAgent
        from autogen_agentchat.teams import RoundRobinGroupChat
        from autogen_agentchat.conditions import MaxMessageTermination
        from autogen_ext.models.anthropic import AnthropicChatCompletionClient

        model_client = AnthropicChatCompletionClient(
            model="claude-haiku-4-5-20251001",
            api_key=os.getenv("ANTHROPIC_API_KEY"),
        )

        atmosphere_agent = AssistantAgent(
            name="AtmosphereAgent",
            description="Sound environment specialist",
            system_message=f"You are the Atmosphere Agent. Based on the crew analysis, propose final sound settings. Weather: {weather['condition']}, Time: {time_info['period']}. Be concise (1-2 sentences).",
            model_client=model_client,
        )

        environment_agent = AssistantAgent(
            name="EnvironmentAgent",
            description="Visual environment specialist",
            system_message=f"You are the Environment Agent. Align visual settings with the Atmosphere Agent's sound proposal. Raining: {weather['is_raining']}, Night: {time_info['is_night']}. Be concise.",
            model_client=model_client,
        )

        room_agent = AssistantAgent(
            name="RoomManagerAgent",
            description="Room capacity manager",
            system_message="You are the Room Manager. Confirm capacity is fine or recommend expansion. Be concise.",
            model_client=model_client,
        )

        termination = MaxMessageTermination(max_messages=4)
        team = RoundRobinGroupChat(
            participants=[atmosphere_agent, environment_agent, room_agent],
            termination_condition=termination,
        )

        discussion_turns = []
        autogen_status = "live"
        try:
            result = await team.run(task=f"Review and reach consensus on environment settings. Crew analysis: {crew_output[:500]}")

            for msg in result.messages:
                discussion_turns.append({
                    "agent": msg.source,
                    "message": msg.content[:300] if isinstance(msg.content, str) else str(msg.content)[:300],
                })
        except Exception as e:
            autogen_status = "fallback"
            discussion_turns = [
                {"agent": "AtmosphereAgent", "message": f"Recommending {time_info['period']} preset for {'rainy' if weather['is_raining'] else weather['condition']} conditions."},
                {"agent": "EnvironmentAgent", "message": f"Setting {'dim' if time_info['is_night'] else 'bright'} lighting. {'Rain effects enabled.' if weather['is_raining'] else ''}"},
                {"agent": "RoomManagerAgent", "message": "Capacity nominal. No expansion needed."},
            ]

        final = f"Consensus: {time_info['period']} environment with {'rain' if weather['is_raining'] else weather['condition']} settings applied."
        discussion_turns.append({"agent": "Consensus", "message": final})

        return {
            "turns": discussion_turns,
            "turn_count": len(discussion_turns),
            "final_decision": final,
            "status": autogen_status,
        }

    def get_discussion_log(self) -> list[dict[str, Any]]:
        return self.discussion_log


study_lock_crew = StudyLockCrew()
