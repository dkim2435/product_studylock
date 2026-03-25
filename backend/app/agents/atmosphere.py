"""
Atmosphere Agent — manages sound mix optimization.
Uses LangChain for LLM calls, MCP tools for weather data.
Part of CrewAI multi-agent crew.
"""

from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate

ATMOSPHERE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are the Atmosphere Agent for StudyLock, a collaborative study room.
Your role is to optimize the ambient sound mix based on current conditions.

Available sound presets:
- rainy: Rain sounds prominent, calm atmosphere
- night_study: Soft, minimal sounds for late-night focus
- morning_fresh: Birds, gentle nature sounds
- default: Balanced mix for general study

Respond with a JSON object:
{{"preset": "...", "rain_volume": 0.0-1.0, "nature_volume": 0.0-1.0, "reason": "..."}}"""),
    ("human", """Current conditions:
- Time: {time_period}
- Weather: {weather_condition}
- Raining: {is_raining}
- Temperature: {temperature}°C
- Users in room: {user_count}

What sound settings should we apply?"""),
])


def create_atmosphere_agent():
    """Create the Atmosphere Agent with LangChain."""
    llm = ChatAnthropic(
        model="claude-haiku-4-5-20251001",
        temperature=0.3,
        max_tokens=256,
    )

    chain = ATMOSPHERE_PROMPT | llm
    return chain


async def get_atmosphere_recommendation(
    time_period: str,
    weather_condition: str,
    is_raining: bool,
    temperature: float,
    user_count: int,
) -> str:
    """Get atmosphere recommendation from the agent."""
    agent = create_atmosphere_agent()

    response = await agent.ainvoke({
        "time_period": time_period,
        "weather_condition": weather_condition,
        "is_raining": str(is_raining),
        "temperature": temperature,
        "user_count": user_count,
    })

    return response.content
