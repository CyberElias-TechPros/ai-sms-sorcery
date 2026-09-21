/**
 * AI SMS Sorcery — Cloudflare Worker API
 *
 * fetch:      REST API (/api/*) + health + webhooks
 * queue:      SMS_QUEUE consumer (bulk + scheduled dispatch, retries)
 * scheduled:  cron (every minute) — dispatch due campaigns + reconcile stuck messages
 */

import { Env, DispatchJob } from './lib/env';
import { Router } from './lib/router';
import { json, errorResponse, withCors, notFound, nowIso } from './lib/http';
import { requireAuth, AuthContext } from './lib/auth';
import { rateLimit } from './lib/ratelimit';

import * as authRoutes from './routes/auth';
import * as contacts from './routes/contacts';
import * as templates from './routes/templates';
import * as ai from './routes/ai';
import * as messages from './routes/messages';
import * as scheduled from './routes/scheduled';
import * as stats from './routes/stats';
import * as settings from './routes/settings';
import * as credentials from './routes/credentials';
import * as webhooks from './routes/webhooks';
import { deliverMessages, dispatchDueCampaign } from './dispatch';
import { CampaignRow, MessageRow } from './lib/rows';

interface Ctx {
  env: Env;
  request: Request;
  requestId: string;
  auth?: AuthContext;
}

const router = new Router<Ctx>();

type H = (ctx: Ctx, params: Record<string, string>) => Promise<Response>;
const pub = (fn: (env: Env, request: Request, params: Record<string, string>) => Promise<Response>): H =>
  async (ctx, params) => fn(ctx.env, ctx.request, params);
const authed = (fn: (ctx: AuthContext, env: Env, request: Request, params: Record<string, string>) => Promise<Response>): H =>
  async (ctx, params) => {
    const auth = ctx.auth ?? (ctx.auth = await requireAuth(ctx.env, ctx.request));
    return fn(auth, ctx.env, ctx.request, params);
  };

// ── health ──────────────────────────────────────────────────────────
router.get('/api/health', async (ctx) =>
  json({
    status: 'ok',
    service: 'ai-sms-sorcery-api',
    environment: ctx.env.ENVIRONMENT ?? 'production',
    time: nowIso(),
  }),
);

// ── auth ────────────────────────────────────────────────────────────
router.post('/api/auth/register', pub((env, req) => authRoutes.register(env, req)));
router.post('/api/auth/login', pub((env, req) => authRoutes.login(env, req)));
router.post('/api/auth/logout', pub((env, req) => authRoutes.logout(env, req)));
router.get('/api/auth/me', authed((a, env) => authRoutes.me(a, env)));
router.post('/api/auth/change-password', authed((a, env, req) => authRoutes.changePassword(a, env, req)));
router.post('/api/auth/logout-all', authed((a, env) => settings.logoutAll(a, env)));

// ── contacts ────────────────────────────────────────────────────────
router.get('/api/contacts', authed((a, env, req) => contacts.listContacts(a, env, req)));
router.post('/api/contacts', authed((a, env, req) => contacts.createContact(a, env, req)));
router.post('/api/contacts/import', authed((a, env, req) => contacts.importContacts(a, env, req)));
router.get('/api/contacts/export', authed((a, env) => contacts.exportContacts(a, env)));
router.get('/api/contacts/:id', authed((a, env, _req, p) => contacts.getContact(a, env, p)));
router.patch('/api/contacts/:id', authed((a, env, req, p) => contacts.updateContact(a, env, req, p)));
router.delete('/api/contacts/:id', authed((a, env, _req, p) => contacts.deleteContact(a, env, p)));

// ── templates ───────────────────────────────────────────────────────
router.get('/api/templates', authed((a, env, req) => templates.listTemplates(a, env, req)));
router.post('/api/templates', authed((a, env, req) => templates.createTemplate(a, env, req)));
router.get('/api/templates/:id', authed((a, env, _req, p) => templates.getTemplate(a, env, p)));
router.patch('/api/templates/:id', authed((a, env, req, p) => templates.updateTemplate(a, env, req, p)));
router.delete('/api/templates/:id', authed((a, env, _req, p) => templates.deleteTemplate(a, env, p)));
router.post('/api/templates/:id/use', authed((a, env, _req, p) => templates.useTemplate(a, env, p)));

// ── ai ──────────────────────────────────────────────────────────────
router.post('/api/ai/generate', authed((a, env, req) => ai.generate(a, env, req)));
router.post('/api/ai/generate-bulk', authed((a, env, req) => ai.generateBulk(a, env, req)));
router.get('/api/ai/history', authed((a, env, req) => ai.history(a, env, req)));

// ── messages ────────────────────────────────────────────────────────
router.post('/api/messages/send', authed((a, env, req) => messages.sendMessages(a, env, req)));
router.get('/api/messages', authed((a, env, req) => messages.listMessages(a, env, req)));
router.get('/api/messages/export', authed((a, env) => messages.exportMessages(a, env)));
router.get('/api/messages/:id', authed((a, env, _req, p) => messages.getMessage(a, env, p)));
router.post('/api/messages/:id/resend', authed((a, env, req, p) => messages.resendMessage(a, env, req, p)));
router.post('/api/messages/:id/cancel', authed((a, env, _req, p) => messages.cancelMessage(a, env, p)));

// ── scheduled campaigns ─────────────────────────────────────────────
router.get('/api/scheduled', authed((a, env, req) => scheduled.listCampaigns(a, env, req)));
router.post('/api/scheduled', authed((a, env, req) => scheduled.createCampaign(a, env, req)));
router.get('/api/scheduled/:id', authed((a, env, _req, p) => scheduled.getCampaign(a, env, p)));
router.patch('/api/scheduled/:id', authed((a, env, req, p) => scheduled.updateCampaign(a, env, req, p)));
router.delete('/api/scheduled/:id', authed((a, env, _req, p) => scheduled.deleteCampaign(a, env, p)));
router.post('/api/scheduled/:id/:action', authed((a, env, req, p) => scheduled.campaignAction(a, env, req, p)));

// ── stats ───────────────────────────────────────────────────────────
router.get('/api/stats/dashboard', authed((a, env) => stats.dashboard(a, env)));
router.get('/api/stats/analytics', authed((a, env, req) => stats.analytics(a, env, req)));

// ── settings / profile / account ────────────────────────────────────
router.get('/api/settings', authed((a, env) => settings.getSettingsRoute(a, env)));
router.put('/api/settings', authed((a, env, req) => settings.updateSettings(a, env, req)));
router.get('/api/settings/security', authed((a, env) => settings.securitySummary(a, env)));
router.patch('/api/profile', authed((a, env, req) => settings.updateProfile(a, env, req)));
router.get('/api/account/export', authed((a, env) => settings.exportAll(a, env)));
router.delete('/api/account', authed((a, env, req) => settings.deleteAccount(a, env, req)));

// ── credentials ─────────────────────────────────────────────────────
router.get('/api/credentials', authed((a, env) => credentials.listCredentials(a, env)));
router.put('/api/credentials', authed((a, env, req) => credentials.upsertCredential(a, env, req)));
router.post('/api/credentials/test', authed((a, env, req) => credentials.testCredential(a, env, req)));
router.delete('/api/credentials/:id', authed((a, env, _req, p) => credentials.deleteCredential(a, env, p)));

// ── webhooks ────────────────────────────────────────────────────────
router.post('/api/webhooks/sms/twilio/:messageId', pub((env, req, p) => webhooks.twilioStatus(env, req, p)));
router.post('/api/webhooks/sms/status', pub((env, req) => webhooks.genericStatus(env, req)));

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const requestId = crypto.randomUUID();
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return withCors(request, new Response(null, { status: 204 }), env.CORS_ORIGINS);
    }

    let response: Response;
    try {
      if (url.pathname === '/api' || url.pathname === '/api/') {
        return withCors(request, json({ service: 'ai-sms-sorcery-api', docs: '/api/health' }), env.CORS_ORIGINS);
      }

      // Per-IP global rate limit (generous).
      if (url.pathname.startsWith('/api/')) {
        await rateLimit(env, `global:${request.headers.get('cf-connecting-ip') || 'unknown'}`, 600, 60);
      }

      const match = router.match(request.method, url.pathname);
      if (!match) throw notFound(`No route for ${request.method} ${url.pathname}`);
      response = await match.handler({ env, request, requestId }, match.params);
    } catch (err) {
      response = errorResponse(err, requestId);
    }

    const headers = new Headers(response.headers);
    headers.set('x-request-id', requestId);
    const withReqId = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    return withCors(request, withReqId, env.CORS_ORIGINS);
  },

  /** SMS_QUEUE consumer: deliver batches of messages. */
  async queue(batch: MessageBatch<DispatchJob>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const job = message.body;
      try {
        if (job.kind === 'send-batch') {
          await deliverMessages(env, job);
        }
        message.ack();
      } catch (err) {
        console.error('Queue job failed:', err);
        message.retry();
      }
    }
  },

  /** Cron (every minute): dispatch due campaigns + reconcile stuck messages. */
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runCron(env));
  },
};

async function runCron(env: Env): Promise<void> {
  const now = nowIso();

  // 1) Dispatch due scheduled campaigns
  const due = (
    await env.DB.prepare(
      `SELECT * FROM campaigns WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= ? LIMIT 25`,
    )
      .bind(now)
      .all<CampaignRow>()
  ).results;
  for (const campaign of due) {
    await dispatchDueCampaign(env, campaign);
  }

  // 2) Reconcile messages stuck mid-flight for > 10 minutes
  const stuckBefore = new Date(Date.now() - 10 * 60_000).toISOString();
  await env.DB.prepare(
    `UPDATE messages SET status = 'failed', error = 'Delivery timed out', updated_at = ?
     WHERE status IN ('sending','queued') AND updated_at < ?`,
  )
    .bind(now, stuckBefore)
    .run();

  // 3) Expire old sessions (cheap hygiene)
  await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now).run();

  // 4) Close campaigns whose messages all resolved but counters lag (safety net)
  const stragglers = (
    await env.DB.prepare(
      `SELECT c.id AS id FROM campaigns c
       WHERE c.status = 'sending'
         AND (SELECT COUNT(*) FROM messages m WHERE m.campaign_id = c.id AND m.status NOT IN ('queued','sending')) >= c.total_recipients
       LIMIT 10`,
    )
      .bind()
      .all<{ id: string }>()
  ).results;
  for (const s of stragglers) {
    const counts = await env.DB.prepare(
      `SELECT SUM(CASE WHEN status IN ('sent','delivered') THEN 1 ELSE 0 END) AS sent,
              SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed
       FROM messages WHERE campaign_id = ?`,
    )
      .bind(s.id)
      .first<{ sent: number; failed: number }>();
    await env.DB.prepare(
      `UPDATE campaigns SET sent_count = ?, failed_count = ?, status = 'completed', completed_at = ?, updated_at = ? WHERE id = ?`,
    )
      .bind(counts?.sent ?? 0, counts?.failed ?? 0, now, now, s.id)
      .run();
  }
}
