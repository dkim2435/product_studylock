"""
MCP Tool Server — actual implementation using the mcp package.
Provides tools for AI agents to access external data.
"""

from mcp.server import Server
from mcp.types import Tool, TextContent
import json

from app.mcp.tools import get_weather, get_time_info, get_room_stats

# Create MCP server instance
mcp_server = Server("studylock-tools")


@mcp_server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_weather",
            description="Get current weather conditions for a location. Returns temperature, humidity, rain status, and day/night.",
            inputSchema={
                "type": "object",
                "properties": {
                    "location": {"type": "string", "description": "City name", "default": "New York"}
                },
            },
        ),
        Tool(
            name="get_time_info",
            description="Get current time information including period (morning/afternoon/evening/night) and day/night status.",
            inputSchema={"type": "object", "properties": {}},
        ),
        Tool(
            name="get_room_stats",
            description="Get study room statistics including user counts, utilization, and expansion needs.",
            inputSchema={"type": "object", "properties": {}},
        ),
    ]


@mcp_server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "get_weather":
        result = await get_weather(arguments.get("location", "New York"))
    elif name == "get_time_info":
        result = get_time_info()
    elif name == "get_room_stats":
        result = get_room_stats()
    else:
        result = {"error": f"Unknown tool: {name}"}

    return [TextContent(type="text", text=json.dumps(result, default=str))]
