/**
 * BeautyIntel OS — Anthropic API Proxy
 * Cloudflare Worker
 *
 * Accepts POST /api/analyze
 * Forwards to Anthropic, adds the API key from an environment secret.
 * Never exposes the key to the browser.
 *
 * Rate limit: 10 requests per IP per hour (in-memory, per isolate).
 * Replace with KV-backed counting at v1.5 for persistence across restarts.
 */

// ---------------------------------------------------------------------------
// In-memory rate limit store
// Keyed by IP. Resets when the Worker isolate is recycled (~a few minutes of
// inactivity). Good enough for launch; upgrade to KV at v1.5.
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX       = 10;              // requests per window per IP

const rateLimitStore = new Map(); // { ip: { count, windowStart } }

function checkRateLimit(ip) {
  const now  = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || (now - entry.windowStart) > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const resetMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, resetMs };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

// ---------------------------------------------------------------------------
// CORS headers — allow any origin so beautyintel.html can call from any host
// ---------------------------------------------------------------------------
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age':       '86400',
};

function corsResponse(body, status, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extraHeaders },
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Only serve POST /api/analyze
    if (request.method !== 'POST' || url.pathname !== '/api/analyze') {
      return corsResponse(JSON.stringify({ error: 'Not found' }), 404);
    }

    // Rate limit by IP
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const limit = checkRateLimit(ip);
    if (!limit.allowed) {
      const minutes = Math.ceil(limit.resetMs / 60000);
      return corsResponse(
        JSON.stringify({ error: `Rate limit reached. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.` }),
        429
      );
    }

    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch {
      return corsResponse(JSON.stringify({ error: 'Invalid JSON body.' }), 400);
    }

    const { messages, system } = body;
    if (!messages || !Array.isArray(messages)) {
      return corsResponse(JSON.stringify({ error: 'Missing or invalid "messages" field.' }), 400);
    }

    // Guard: API key must be configured as an env secret
    if (!env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY secret is not set on this Worker.');
      return corsResponse(JSON.stringify({ error: 'Service misconfigured. Contact support.' }), 500);
    }

    // Forward to Anthropic
    let anthropicResp;
    try {
      anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':        'application/json',
          'x-api-key':           env.ANTHROPIC_API_KEY,
          'anthropic-version':   '2023-06-01',
        },
        body: JSON.stringify({
          model:      'claude-sonnet-4-6',
          max_tokens: 4096,
          system:     system || '',
          messages,
        }),
      });
    } catch (err) {
      console.error('Anthropic fetch error:', err);
      return corsResponse(JSON.stringify({ error: 'Could not reach AI service.' }), 502);
    }

    // Surface Anthropic errors cleanly
    if (!anthropicResp.ok) {
      const errText = await anthropicResp.text().catch(() => '');
      console.error(`Anthropic ${anthropicResp.status}:`, errText);
      return corsResponse(
        JSON.stringify({ error: `AI service returned an error (${anthropicResp.status}). Try again shortly.` }),
        anthropicResp.status
      );
    }

    // Stream the response back as-is with CORS headers
    const responseData = await anthropicResp.json();
    return corsResponse(JSON.stringify(responseData), 200);
  },
};
