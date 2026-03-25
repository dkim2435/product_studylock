# CI/CD Pipeline

## Overview

Push to GitHub → auto test → build → deploy.

## Pipeline Flow

```
Push/PR → Lint → Playwright Tests → Build → Deploy
                                         ├── Vercel (frontend)
                                         └── Railway (backend)
                                         └── MCP → Notion (log results)
```

## GitHub Actions Workflows

### On PR: Tests Only
- ESLint + TypeScript check
- Playwright E2E tests
- Python backend tests

### On main merge: Tests + Deploy
- Pass all tests above
- Vercel auto-deploy (GitHub integration)
- Railway auto-deploy (GitHub integration)
- MCP → Notion logs deployment result

## Deployment Environments

| Environment | Frontend | Backend |
|-------------|----------|---------|
| Production | Vercel | Railway |
| Preview | Vercel Preview (per PR) | - |

## Domain

- Initial: studylock.vercel.app (free)
- Later: studylock.dev (Vercel domain purchase)
