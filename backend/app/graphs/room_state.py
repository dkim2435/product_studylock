"""
LangGraph — Room state machine for adaptive environment management.

State flow:
  [Check Conditions] → [Analyze] → [Decide Changes] → [Apply] → [Wait] → [Check]

States: morning, afternoon, evening, night
Transitions triggered by: time change, weather change, room capacity change
"""

from typing import TypedDict, Literal
from langgraph.graph import StateGraph, END


class RoomState(TypedDict):
    """State of the study room environment."""
    time_period: Literal["morning", "afternoon", "evening", "night"]
    is_raining: bool
    temperature: float
    user_count: int
    room_id: str
    # Computed settings
    ambience_preset: str
    lighting: str
    weather_effects: bool
    needs_expansion: bool
    # Agent discussion log
    last_decision: str


def check_conditions(state: RoomState) -> RoomState:
    """Check current conditions from MCP tools."""
    from app.mcp.tools import get_time_info

    time_info = get_time_info()
    state["time_period"] = time_info["period"]

    return state


def analyze_environment(state: RoomState) -> RoomState:
    """Analyze if environment changes are needed."""
    period = state["time_period"]
    is_raining = state["is_raining"]

    # Determine ambience preset based on conditions
    if is_raining:
        state["ambience_preset"] = "rainy"
    elif period == "night":
        state["ambience_preset"] = "night_study"
    elif period == "morning":
        state["ambience_preset"] = "morning_fresh"
    else:
        state["ambience_preset"] = "default"

    # Lighting
    state["lighting"] = "dim" if period in ("evening", "night") else "bright"

    # Weather effects
    state["weather_effects"] = is_raining

    return state


def decide_changes(state: RoomState) -> RoomState:
    """Decide what changes to apply (agent consensus point)."""
    changes = []

    if state["weather_effects"]:
        changes.append("Enable rain effects on windows")
    if state["lighting"] == "dim":
        changes.append("Switch to dim lighting mode")
    if state["needs_expansion"]:
        changes.append(f"Room {state['room_id']} needs expansion — create new floor")

    state["last_decision"] = "; ".join(changes) if changes else "No changes needed"

    return state


def should_apply(state: RoomState) -> Literal["apply", "wait"]:
    """Router: should we apply changes or wait?"""
    if state["last_decision"] != "No changes needed":
        return "apply"
    return "wait"


def apply_changes(state: RoomState) -> RoomState:
    """Apply the decided changes to the room."""
    # In production, this would update Supabase and notify clients
    return state


def wait_for_next_check(state: RoomState) -> RoomState:
    """Wait state — no changes needed."""
    return state


def build_room_state_graph() -> StateGraph:
    """Build the LangGraph state machine for room management."""

    graph = StateGraph(RoomState)

    # Add nodes
    graph.add_node("check_conditions", check_conditions)
    graph.add_node("analyze", analyze_environment)
    graph.add_node("decide", decide_changes)
    graph.add_node("apply", apply_changes)
    graph.add_node("wait", wait_for_next_check)

    # Add edges
    graph.set_entry_point("check_conditions")
    graph.add_edge("check_conditions", "analyze")
    graph.add_edge("analyze", "decide")
    graph.add_conditional_edges("decide", should_apply, {"apply": "apply", "wait": "wait"})
    graph.add_edge("apply", END)
    graph.add_edge("wait", END)

    return graph.compile()


# Pre-built graph instance
room_graph = build_room_state_graph()
