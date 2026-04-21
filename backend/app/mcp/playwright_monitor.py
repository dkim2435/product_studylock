"""
Playwright MCP — AI-driven browser monitoring.
Uses Playwright to let AI agents verify the live site is working correctly.

This is separate from the regular Playwright E2E tests (which run in CI/CD).
The MCP integration allows AI agents to trigger browser checks on demand
and report results to Notion.
"""

import asyncio
from datetime import datetime
from typing import Any

from mcp.server import Server
from mcp.types import Tool, TextContent
import json

# SSRF defense: only these URLs may be navigated by the MCP-exposed browser.
# FastAPI endpoints call the functions directly with the default URL, so this
# allowlist only bites when the MCP dispatcher is reachable from outside.
ALLOWED_URLS = frozenset({
    "https://studylock.dev",
    "https://www.studylock.dev",
})


def _assert_allowed_url(url: str) -> str:
    if url not in ALLOWED_URLS:
        raise ValueError(f"URL not allowed: {url}")
    return url


# Playwright MCP tools registered on the MCP server
PLAYWRIGHT_TOOLS = [
    Tool(
        name="check_site_health",
        description="Launch a headless browser, navigate to studylock.dev, and verify the page loads correctly. Returns load time, title, and screenshot status.",
        inputSchema={
            "type": "object",
            "properties": {
                "url": {"type": "string", "default": "https://studylock.dev"},
            },
        },
    ),
    Tool(
        name="check_canvas_rendering",
        description="Verify the pixel-art Canvas study room renders with non-zero dimensions.",
        inputSchema={
            "type": "object",
            "properties": {
                "url": {"type": "string", "default": "https://studylock.dev"},
            },
        },
    ),
    Tool(
        name="check_sound_system",
        description="Verify sound buttons are present and clickable.",
        inputSchema={
            "type": "object",
            "properties": {
                "url": {"type": "string", "default": "https://studylock.dev"},
            },
        },
    ),
    Tool(
        name="check_room_navigation",
        description="Verify floor switching works by clicking a different floor and checking the heading changes.",
        inputSchema={
            "type": "object",
            "properties": {
                "url": {"type": "string", "default": "https://studylock.dev"},
            },
        },
    ),
]


async def check_site_health(url: str = "https://studylock.dev") -> dict[str, Any]:
    """AI-triggered health check using Playwright."""
    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            try:
                page = await browser.new_page()

                start = datetime.now()
                response = await page.goto(url, wait_until="networkidle", timeout=15000)
                load_time = (datetime.now() - start).total_seconds()

                title = await page.title()
                status = response.status if response else 0

                # Check for critical elements
                has_canvas = await page.locator("canvas").count() > 0
                has_header = await page.get_by_text("StudyLock").count() > 0
                has_timer = await page.get_by_text("25:00").count() > 0
                has_floors = await page.get_by_text("Floors").count() > 0

                return {
                    "status": "healthy" if status == 200 else "unhealthy",
                    "http_status": status,
                    "load_time_seconds": round(load_time, 2),
                    "title": title,
                    "checks": {
                        "canvas_present": has_canvas,
                        "header_present": has_header,
                        "timer_present": has_timer,
                        "floors_present": has_floors,
                    },
                    "all_passed": all([has_canvas, has_header, has_timer, has_floors]),
                    "checked_at": datetime.now().isoformat(),
                }
            finally:
                await browser.close()
    except ImportError:
        return {"status": "error", "message": "Playwright not installed. Run: pip install playwright && playwright install chromium"}
    except Exception as e:
        return {"status": "error", "message": str(e), "checked_at": datetime.now().isoformat()}


async def check_canvas_rendering(url: str = "https://studylock.dev") -> dict[str, Any]:
    """Verify Canvas renders correctly."""
    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            try:
                page = await browser.new_page()
                await page.goto(url, wait_until="networkidle", timeout=15000)

                canvas = page.locator("canvas")
                await canvas.wait_for(state="visible", timeout=10000)
                box = await canvas.bounding_box()

                return {
                    "status": "ok" if box and box["width"] > 100 else "fail",
                    "canvas_found": box is not None,
                    "width": box["width"] if box else 0,
                    "height": box["height"] if box else 0,
                    "checked_at": datetime.now().isoformat(),
                }
            finally:
                await browser.close()
    except Exception as e:
        return {"status": "error", "message": str(e)}


async def check_sound_system(url: str = "https://studylock.dev") -> dict[str, Any]:
    """Verify sound system UI is present."""
    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            try:
                page = await browser.new_page()
                await page.goto(url, wait_until="networkidle", timeout=15000)

                sounds = ["Lofi", "Rain", "Ocean", "Birds", "Fire", "Cabin"]
                found = {}
                for s in sounds:
                    found[s] = await page.get_by_text(s).count() > 0

                # Try clicking one
                click_success = False
                try:
                    await page.get_by_text("Lofi").click()
                    # Check if mini player appeared (pause button)
                    click_success = await page.get_by_role("button", name="⏸").count() > 0
                except Exception:
                    pass

                return {
                    "status": "ok" if all(found.values()) else "partial",
                    "sounds_found": found,
                    "click_test": click_success,
                    "checked_at": datetime.now().isoformat(),
                }
            finally:
                await browser.close()
    except Exception as e:
        return {"status": "error", "message": str(e)}


async def check_room_navigation(url: str = "https://studylock.dev") -> dict[str, Any]:
    """Verify room switching works."""
    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            try:
                page = await browser.new_page()
                await page.goto(url, wait_until="networkidle", timeout=15000)

                # Should start on 1F
                h2 = page.locator("h2")
                initial_text = await h2.inner_text()

                # Click 2F
                await page.get_by_role("button", name="2F Modern Study").click()
                await page.wait_for_timeout(1000)
                switched_text = await h2.inner_text()

                return {
                    "status": "ok" if "2F" in switched_text else "fail",
                    "initial_floor": initial_text,
                    "after_switch": switched_text,
                    "switch_worked": "2F" in switched_text,
                    "checked_at": datetime.now().isoformat(),
                }
            finally:
                await browser.close()
    except Exception as e:
        return {"status": "error", "message": str(e)}


# Tool dispatcher
TOOL_HANDLERS = {
    "check_site_health": check_site_health,
    "check_canvas_rendering": check_canvas_rendering,
    "check_sound_system": check_sound_system,
    "check_room_navigation": check_room_navigation,
}


def register_playwright_tools(server: Server):
    """Register Playwright MCP tools on an existing MCP server."""

    @server.list_tools()
    async def list_playwright_tools() -> list[Tool]:
        return PLAYWRIGHT_TOOLS

    @server.call_tool()
    async def call_playwright_tool(name: str, arguments: dict) -> list[TextContent]:
        handler = TOOL_HANDLERS.get(name)
        if not handler:
            return [TextContent(type="text", text=json.dumps({"error": f"Unknown tool: {name}"}))]

        url = arguments.get("url", "https://studylock.dev")
        try:
            _assert_allowed_url(url)
        except ValueError as e:
            return [TextContent(type="text", text=json.dumps({"error": str(e)}))]
        result = await handler(url)
        return [TextContent(type="text", text=json.dumps(result, default=str))]
