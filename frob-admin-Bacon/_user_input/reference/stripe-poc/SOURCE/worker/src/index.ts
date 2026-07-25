import { corsHeaders, handleOptions, isOriginAllowed } from './middleware/cors';
import { isRateLimited } from './lib/rateLimit';
import { handleCheckoutSession } from './routes/checkoutSession';
import { handleSessionStatus } from './routes/sessionStatus';
import { handleWebhook } from './routes/webhook';
import { handleAdminPayments, handleAdminRefund } from './routes/admin';
import { handleReconcile } from './routes/reconcile';
import { isAdminAuthorized } from './middleware/adminGuard';

export interface Env {
  DB: D1Database;
  STRIPE_MODE: string;
  ALLOWED_ORIGIN: string;
  RESEND_FROM_EMAIL: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  ADMIN_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return handleOptions(env.ALLOWED_ORIGIN, origin);
    }

    const headers = corsHeaders(env.ALLOWED_ORIGIN, origin);
    const withCors = (response: Response): Response => {
      const merged = new Response(response.body, response);
      for (const [key, value] of Object.entries(headers)) merged.headers.set(key, value);
      return merged;
    };

    try {
      if (url.pathname === '/api/health' && request.method === 'GET') {
        return withCors(Response.json({ ok: true, mode: env.STRIPE_MODE }));
      }

      // S4: guard against a mismatched STRIPE_MODE/key pair — e.g. STRIPE_MODE left at "test"
      // (which gates the test-card UI panel) while a live secret key got set, which would
      // silently take real payments through what the UI is telling the operator is a test run.
      if (url.pathname.startsWith('/api/') && url.pathname !== '/api/health') {
        const isLiveKey = env.STRIPE_SECRET_KEY.startsWith('sk_live_');
        if ((env.STRIPE_MODE === 'test') === isLiveKey) {
          console.error(`STRIPE_MODE="${env.STRIPE_MODE}" does not match secret key mode — refusing request`);
          return withCors(Response.json({ error: 'Server misconfiguration: mode/key mismatch' }, { status: 500 }));
        }
      }

      // S6: browser-facing routes only — reject a mismatched Origin server-side rather than
      // relying solely on the browser to honour the CORS response header. The webhook is
      // exempt (server-to-server, no Origin header at all).
      if (url.pathname !== '/api/webhook' && !isOriginAllowed(env.ALLOWED_ORIGIN, origin)) {
        return withCors(Response.json({ error: 'Origin not allowed' }, { status: 403 }));
      }

      if (url.pathname === '/api/checkout-session' && request.method === 'POST') {
        const clientIp = request.headers.get('CF-Connecting-IP') ?? 'unknown';
        // S5: 5 session-creation attempts per IP per minute.
        if (isRateLimited(`checkout-session:${clientIp}`, 5, 60_000)) {
          return withCors(Response.json({ error: 'Too many requests' }, { status: 429 }));
        }
        return withCors(await handleCheckoutSession(request, env));
      }

      if (url.pathname === '/api/session-status' && request.method === 'GET') {
        return withCors(await handleSessionStatus(request, env));
      }

      if (url.pathname === '/api/webhook' && request.method === 'POST') {
        // Called server-to-server by Stripe, not the browser — CORS headers are harmless here
        // but irrelevant; signature verification (not Origin) is what secures this route.
        return await handleWebhook(request, env);
      }

      if (url.pathname.startsWith('/api/admin/')) {
        if (!isAdminAuthorized(request, env.ADMIN_API_KEY)) {
          return withCors(Response.json({ error: 'Unauthorized' }, { status: 401 }));
        }
        if (url.pathname === '/api/admin/payments' && request.method === 'GET') {
          return withCors(await handleAdminPayments(request, env));
        }
        if (url.pathname === '/api/admin/refund' && request.method === 'POST') {
          return withCors(await handleAdminRefund(request, env));
        }
        if (url.pathname === '/api/admin/reconcile' && request.method === 'POST') {
          return withCors(await handleReconcile(request, env));
        }
      }

      return withCors(new Response('Not found', { status: 404 }));
    } catch (err) {
      console.error(err);
      return withCors(Response.json({ error: 'Internal error' }, { status: 500 }));
    }
  },
};
