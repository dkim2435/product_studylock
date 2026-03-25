"""
Room Manager Agent — handles room creation/deletion and user load balancing.
Uses LangChain for LLM calls, MCP tools for room stats.
Part of CrewAI multi-agent crew.
"""

from langchain_anthropic import ChatAnthropic
from langchain.prompts import ChatPromptTemplate

ROOM_MANAGER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are the Room Manager Agent for StudyLock, a collaborative study room.
Your role is to manage room capacity and load balancing.

Rules:
- Each study floor holds max 20 users
- Break rooms (cafe, garden) hold max 30 users
- When all floors exceed 80% capacity, create a new floor
- Clean up empty floors (except floors 1-14 which always exist)
- Direct new users to the least crowded appropriate floor

Respond with a JSON object:
{{"action": "none"|"create_floor"|"redirect_users", "target_floor": "...", "reason": "..."}}"""),
    ("human", """Current room stats:
- Total users: {total_users}
- High utilization rooms: {high_util_rooms}
- Needs expansion: {needs_expansion}
- Room requesting check: {room_id}

What action should we take?"""),
])


def create_room_manager_agent():
    """Create the Room Manager Agent with LangChain."""
    llm = ChatAnthropic(
        model="claude-haiku-4-5-20251001",
        temperature=0.2,
        max_tokens=256,
    )

    chain = ROOM_MANAGER_PROMPT | llm
    return chain


async def get_room_management_recommendation(
    total_users: int,
    high_util_rooms: list[str],
    needs_expansion: bool,
    room_id: str,
) -> str:
    """Get room management recommendation from the agent."""
    agent = create_room_manager_agent()

    response = await agent.ainvoke({
        "total_users": total_users,
        "high_util_rooms": ", ".join(high_util_rooms) if high_util_rooms else "none",
        "needs_expansion": str(needs_expansion),
        "room_id": room_id,
    })

    return response.content
