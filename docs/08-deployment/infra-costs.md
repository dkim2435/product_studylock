# Infrastructure Costs

## Free Tier Limits

| Service | Free Limit | After Limit |
|---------|-----------|-------------|
| Vercel | 100GB bandwidth/mo | $20/mo |
| Supabase | 500MB DB, 50K requests/mo | $25/mo |
| Upstash Redis | 10K requests/day | $0.2/100K requests |
| Railway | $5 credit/mo | Usage-based |
| GitHub Actions | 2,000 min/mo | $0.008/min |

## AI API Costs

| Model | Input | Output |
|-------|-------|--------|
| Claude Haiku (recommended) | $0.25/1M tokens | $1.25/1M tokens |
| Claude Sonnet | $3/1M tokens | $15/1M tokens |

### Cost Optimization
- Use Haiku (agents don't need Sonnet-level reasoning)
- Only run on condition changes (~50 calls/day)
- Expected: **$3-5/month**

## Cost by Stage

| Stage | Monthly Cost | Notes |
|-------|-------------|-------|
| Development | $0 | Local dev |
| MVP deployed | $0-5 | All free tiers |
| 100 users | ~$10 | Redis may slightly exceed |
| 1,000 users | ~$20-30 | Consider paid tiers |
| 10,000 users | ~$50-100 | Need monetization |

## Domain

- Initial: studylock.vercel.app (free)
- Later: studylock.dev ($12-20/year, Vercel)
