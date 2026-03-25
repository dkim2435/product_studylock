# MCP → Notion Auto Documentation

## Overview

MCP server calls Notion API to auto-update project documentation on key events.

## Auto-Update Events

| Event | What Gets Logged in Notion |
|-------|---------------------------|
| Deploy success | Timestamp, version, environment |
| Deploy failure | Error log, failure reason |
| Test run | Pass/fail counts, failed test cases |
| Room create/delete | Room history, peak user count |
| Agent discussion | Discussion log, decisions made |

## MCP Tool Definitions

```python
tools = [
    {
        "name": "update_deploy_log",
        "description": "Log deployment result to Notion",
        "parameters": {
            "status": "success | failure",
            "version": "string",
            "environment": "production | preview",
            "timestamp": "ISO 8601",
            "error": "optional string"
        }
    },
    {
        "name": "update_test_results",
        "description": "Log test results to Notion",
        "parameters": {
            "total": "number",
            "passed": "number",
            "failed": "number",
            "failed_cases": "array"
        }
    },
    {
        "name": "log_agent_discussion",
        "description": "Log agent discussion to Notion",
        "parameters": {
            "trigger": "string (weather change, time shift, etc.)",
            "agents": "array",
            "discussion": "string",
            "decision": "string"
        }
    }
]
```

## Notion Setup

1. Create Notion Integration: https://www.notion.so/my-integrations
2. Get API key
3. Connect integration to target pages
4. Add to environment variables:
   ```env
   NOTION_API_KEY=
   NOTION_DEPLOY_PAGE_ID=
   NOTION_TEST_PAGE_ID=
   NOTION_AGENT_PAGE_ID=
   ```

## Cost

- Notion API: Free (included with Integration)
- No additional cost
