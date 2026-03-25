"""
Environment Agent — manages visual theme (day/night, weather effects).
Uses LangChain for LLM calls, MCP tools for time data.
Part of CrewAI multi-agent crew.
"""

from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate

ENVIRONMENT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are the Environment Agent for StudyLock, a pixel-art collaborative study room.
Your role is to manage visual environment settings based on time and weather.

Visual settings you control:
- lighting: "bright" (day) or "dim" (evening/night)
- weather_effects: true/false (rain on windows)
- color_temperature: "warm" (evening/cozy) or "cool" (day/focus)

Respond with a JSON object:
{{"lighting": "...", "weather_effects": true/false, "color_temperature": "...", "reason": "..."}}"""),
    ("human", """Current conditions:
- Time period: {time_period}
- Hour: {hour}
- Is raining: {is_raining}
- Atmosphere Agent suggests: {atmosphere_suggestion}

What visual settings should we apply?"""),
])


def create_environment_agent():
    """Create the Environment Agent with LangChain."""
    llm = ChatAnthropic(
        model="claude-haiku-4-5-20251001",
        temperature=0.3,
        max_tokens=256,
    )

    chain = ENVIRONMENT_PROMPT | llm
    return chain


async def get_environment_recommendation(
    time_period: str,
    hour: int,
    is_raining: bool,
    atmosphere_suggestion: str,
) -> str:
    """Get environment recommendation from the agent."""
    agent = create_environment_agent()

    response = await agent.ainvoke({
        "time_period": time_period,
        "hour": hour,
        "is_raining": str(is_raining),
        "atmosphere_suggestion": atmosphere_suggestion,
    })

    return response.content
