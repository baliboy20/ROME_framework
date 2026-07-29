export function corsHeaders(allowedOrigin: string, origin: string | null): HeadersInit {
  const allow = origin === allowedOrigin ? origin : allowedOrigin;
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Admin-Key,Idempotency-Key',
    'Vary': 'Origin',
  };
}

export function handleOptions(allowedOrigin: string, origin: string | null): Response {
  return new Response(null, { status: 204, headers: corsHeaders(allowedOrigin, origin) });
}

/**
 * S6: lock the Worker down to our own origin, not just the response header. A browser already
 * refuses to hand a mismatched-ACAO response back to script, but without this check the Worker
 * still does the work server-side (creates a session, spends a rate-limit slot) for any origin
 * that bothers to call it directly (e.g. curl, not a browser). Requests with no Origin header
 * (server-to-server, curl, the webhook) are allowed through — Origin is a browser-only signal.
 */
export function isOriginAllowed(allowedOrigin: string, origin: string | null): boolean {
  return origin === null || origin === allowedOrigin;
}
