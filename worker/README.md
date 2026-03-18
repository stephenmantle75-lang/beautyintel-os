# BeautyIntel Worker — API Proxy & Rate Limiting

This Cloudflare Worker proxies Anthropic API calls from the BeautyIntel frontend, handling authentication, rate limiting, and security.

## Architecture

**The client (browser) never sees the Anthropic API key.** Instead:

1. **Client** sends financial metrics + transaction data to `POST /api/analyze`
2. **Worker** validates the request, adds the Anthropic API key (from server secret), and forwards to Claude API
3. **Worker** enforces rate limiting (10 requests/IP/hour) using persistent Cloudflare KV storage
4. **Worker** returns the analysis to the client

This design ensures:
- ✅ API key is never exposed to the browser (prevents XSS attacks)
- ✅ Rate limits persist across Worker isolate recycling (prevents bypass via reload)
- ✅ CORS validation prevents requests from untrusted origins
- ✅ Prompt injection attacks are detected and rejected

## Setup

### 1. Create KV Namespace (Persistent Rate Limiting)

```bash
cd projects/3-beautyintel-os/worker/
wrangler kv:namespace create "RATE_LIMIT" --preview false
```

Copy the namespace ID from the output and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "YOUR_NAMESPACE_ID"
preview_id = "YOUR_NAMESPACE_ID"
```

**Why:** Rate limits stored in memory can be bypassed when Worker isolates recycle. KV storage persists limits across restarts.

See `KV_SETUP.md` for full setup details including monitoring and testing.

### 2. Set API Key Secret

```bash
wrangler secret put ANTHROPIC_API_KEY
# Paste your Anthropic API key (from console.anthropic.com)
```

**Security:** This secret is never logged, never sent to the client, and never stored in `wrangler.toml`.

### 3. Configure CORS Origins

Update the `ALLOWED_ORIGINS` array in `worker.js` to include your frontend domain:

```javascript
const ALLOWED_ORIGINS = [
  'https://beautyintel.vercel.app',    // Production
  'http://localhost:3000',               // Local dev
];
```

**Why:** Prevents cross-origin API requests from malicious websites.

### 4. Deploy

```bash
wrangler deploy
```

Your Worker is now live. Check the deployment URL in the output.

## API Contract

### Endpoint: `POST /api/analyze`

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Metrics: {...}\\n\\nSales sample: {...}\\n\\nSpend sample: {...}"
    }
  ],
  "system": "You are a financial analyst..."
}
```

**Response (Success - 200):**
```json
{
  "content": [
    {
      "text": "{\"narrative\": {...}, \"one_move\": {...}, ...}"
    }
  ],
  "model": "claude-sonnet-4-6",
  "usage": {...}
}
```

**Response (Rate Limited - 429):**
```json
{
  "error": "Rate limit reached. Try again in 1 minute."
}
```

**Response (Blocked Prompt Injection - 400):**
```json
{
  "error": "Invalid system prompt"
}
```

**Response (Service Unavailable - 502):**
```json
{
  "error": "Could not reach AI service."
}
```

## Security Features

### 1. CORS Origin Validation (CVE-2026-27579)

Only allows requests from whitelisted origins. Prevents malicious websites from hijacking the Worker.

**File:** `worker.js` lines 204–227

### 2. Prompt Injection Prevention

Validates system prompts and rejects suspicious patterns like `ignore previous`, `bypass instruction`, etc.

**Limits:**
- Max 1000 characters
- Blocks regex patterns: `/ignore\s+previous/i`, `/bypass\s+instruction/i`, etc.

**File:** `worker.js` lines 108–150

### 3. Safe Error Logging (CVE-2026-*)

Never logs sensitive data (API keys, response bodies, error messages). Only logs safe metadata.

**File:** `worker.js` lines 74–102

### 4. Persistent Rate Limiting

10 requests per IP per hour, enforced via Cloudflare KV. Persists across Worker restarts.

**File:** `worker.js` lines 24–62

**Graceful Degradation:** If KV is unavailable, requests are allowed (fail-open) rather than blocking all traffic.

### 5. Retry Logic

Automatic retry on transient errors (429, 5xx) with exponential backoff (500ms, 1000ms).

**File:** `worker.js` lines 157–199

## Monitoring

### Check Rate Limit Entries

```bash
wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID
```

### View Specific IP's Rate Limit

```bash
wrangler kv:key get ratelimit:192.0.2.1 --namespace-id=YOUR_NAMESPACE_ID
```

### Watch Live Logs

```bash
wrangler tail
```

## Troubleshooting

### "RATE_LIMIT_KV is undefined"

- Verify `wrangler.toml` has the `[[kv_namespaces]]` section
- Re-run `wrangler deploy`

### "KV namespace not found"

- Check namespace ID in `wrangler.toml` matches the created namespace
- Run `wrangler kv:namespace list` to see all namespaces

### "Rate limits not working"

- Check Worker logs: `wrangler tail`
- Verify `env.RATE_LIMIT_KV` is passed to `checkRateLimit(ip, env)`

### "Anthropic error 401"

- Verify API key is set: `wrangler secret list`
- Re-run `wrangler secret put ANTHROPIC_API_KEY`
- Re-deploy: `wrangler deploy`

## Model Configuration

The model and token limits are hardcoded in `worker.js`:

```javascript
const resp = await fetch('https://api.anthropic.com/v1/messages', {
  // ...
  body: JSON.stringify({
    model: 'claude-sonnet-4-6',        // Change here
    max_tokens: 4096,                  // Change here
    // ...
  }),
});
```

To change the model or token limits, edit `worker.js`, then re-deploy.

## Environment Variables

All configuration is in `wrangler.toml` and `worker.js`:

- **ANTHROPIC_API_KEY** — Set via `wrangler secret put` (never in wrangler.toml)
- **RATE_LIMIT_KV** — Cloudflare KV namespace (binding in wrangler.toml)
- **Model:** `claude-sonnet-4-6` (hardcoded in worker.js line 290)
- **Max Tokens:** `4096` (hardcoded in worker.js line 291)

## Testing Locally

Rate limiting is disabled in local `--local` mode because KV isn't available. To test with real KV:

```bash
# Deploy to staging
wrangler deploy --env staging

# Test against staging
curl https://beautyintel-staging.example.com/api/analyze \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"system": "test", "messages": [{"role": "user", "content": "test"}]}'

# Hit the limit (10 requests)
for i in {1..15}; do curl ...; done

# 11th request should return 429
```

## Performance

- **Cold start:** ~50ms (Cloudflare global edge)
- **API call:** ~800–1500ms (depending on Anthropic load)
- **Rate limit check:** <1ms (KV lookup)

No build step required. Worker deploys instantly on `wrangler deploy`.

## Support

For Cloudflare Worker docs: https://developers.cloudflare.com/workers/
For Anthropic API docs: https://docs.anthropic.com/
