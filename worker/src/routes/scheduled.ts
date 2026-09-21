/**
 * Scheduled campaigns: CRUD + lifecycle (pause / resume / cancel / duplicate / send-now / draft→schedule).
 */

import { Env } from '../lib/env';
import { json, readJson, notFound, badRequest, conflict, nowIso, clientIp } from '../lib/http';
import { uuid } from '../lib/crypto';
import { asString, asEnum, asBool, asIsoDate, asRecipients } from '../lib/validate';
import { AuthContext } from '../lib/auth';
import { CampaignRow, UserRow, publicCampaign, RecipientJson } from '../lib/rows';
import { createMessages, deliverMessages, enqueueDispatch } from '../dispatch';
import { logAudit } from './auth';

const CHANNELS = ['sms', 'whatsapp', 'both'] as const;
const FILTERS: Record<string, string> = {
  all: '1=1',
  drafts: "status = 'draft'",
  scheduled: "status IN ('scheduled','sending')",
  paused: "status = 'paused'",
  completed: "status IN ('completed','failed')",
};

export async function listCampaigns(ctx: AuthContext, env: Env, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const tab = (url.searchParams.get('tab') || 'all').trim();
  const q = (url.searchParams.get('q') || '').trim();
  const filterSql = FILTERS[tab] || FILTERS.all;

  const where: string[] = ['user_id = ?', filterSql];
  const binds: unknown[] = [ctx.user.id];
  if (q) {
    where.push('(title LIKE ? OR body LIKE ?)');
    binds.push(`%${q}%`, `%${q}%`);
  }

  const rows = (
    await env.DB.prepare(
      `SELECT * FROM campaigns WHERE ${where.join(' AND ')} ORDER BY
         CASE WHEN scheduled_at IS NULL THEN 1 ELSE 0 END, scheduled_at ASC, created_at DESC
       LIMIT 200`,
    )
      .bind(...binds)
      .all<CampaignRow>()
  ).results;
  return json({ items: rows.map(publicCampaign), total: rows.length });
}

export async function getCampaign(ctx: AuthContext, env: Env, params: Record<string, string>): Promise<Response> {
  return json(publicCampaign(await findCampaign(ctx, env, params.id)));
}

export async function createCampaign(ctx: AuthContext, env: Env, request: Request): Promise<Response> {
  const body = await readJson(request);
  const title = asString(body.title, 'title', { min: 1, max: 160 });
  const messageBody = asString(body.body ?? body.content, 'body', { min: 1, max: 1600 });
  const channel = asEnum(body.channel, CHANNELS, 'channel', 'sms');
  const mediaUrl = body.mediaUrl ? asString(body.mediaUrl, 'mediaUrl', { max: 2000, pattern: /^https:\/\// }) : null;
  const aiGenerated = asBool(body.aiGenerated, 'aiGenerated', false);
  const wantDraft = asBool(body.draft, 'draft', false);
  const scheduledAt = asIsoDate(body.scheduledAt ?? body.scheduledTime, 'scheduledAt', {
    required: !wantDraft,
    future: !wantDraft,
  });

  let recipients: RecipientJson[] = [];
  if (!wantDraft || body.recipients !== undefined) {
    recipients = asRecipients(body.recipients, 'recipients').map((r) => ({
      contactId: r.contactId,
      phoneNumber: r.phoneNumber,
      name: r.name,
    }));
    if (wantDraft && recipients.length === 0) {
      recipients = [];
    }
  }

  const now = nowIso();
  const id = uuid();
  await env.DB.prepare(
    `INSERT INTO campaigns (id, user_id, title, body, media_url, channel, status, scheduled_at, recipients,
       total_recipients, sent_count, failed_count, ai_generated, created_at, updated_at, completed_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,0,0,?,?,?,NULL)`,
  )
    .bind(
      id, ctx.user.id, title, messageBody, mediaUrl, channel,
      wantDraft ? 'draft' : 'scheduled',
      scheduledAt ?? null,
      JSON.stringify(recipients),
      recipients.length,
      aiGenerated ? 1 : 0, now, now,
    )
    .run();

  await logAudit(env, ctx.user.id, 'campaign.create', { id, status: wantDraft ? 'draft' : 'scheduled' }, clientIp(request));
  const row = (await env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first<CampaignRow>())!;
  return json(publicCampaign(row), { status: 201 });
}

export async function updateCampaign(ctx: AuthContext, env: Env, request: Request, params: Record<string, string>): Promise<Response> {
  const existing = await findCampaign(ctx, env, params.id);
  if (['completed', 'cancelled', 'failed', 'sending'].includes(existing.status)) {
    throw conflict(`A ${existing.status} campaign can no longer be edited — duplicate it instead`);
  }
  const body = await readJson(request);

  const title = body.title !== undefined ? asString(body.title, 'title', { min: 1, max: 160 }) : existing.title;
  const rawBody = body.body ?? body.content;
  const messageBody = rawBody !== undefined ? asString(rawBody, 'body', { min: 1, max: 1600 }) : existing.body;
  const channel = body.channel !== undefined ? asEnum(body.channel, CHANNELS, 'channel') : existing.channel;
  const mediaUrl = body.mediaUrl !== undefined ? (body.mediaUrl ? asString(body.mediaUrl, 'mediaUrl', { max: 2000, pattern: /^https:\/\// }) : null) : existing.media_url;
  let recipientsJson = existing.recipients;
  let total = existing.total_recipients;
  if (body.recipients !== undefined) {
    const recipients = asRecipients(body.recipients, 'recipients').map((r) => ({
      contactId: r.contactId, phoneNumber: r.phoneNumber, name: r.name,
    }));
    recipientsJson = JSON.stringify(recipients);
    total = recipients.length;
  }
  let scheduledAt = existing.scheduled_at;
  if (body.scheduledAt !== undefined || body.scheduledTime !== undefined) {
    scheduledAt = asIsoDate(body.scheduledAt ?? body.scheduledTime, 'scheduledAt', { required: existing.status !== 'draft', future: true }) ?? null;
  }

  await env.DB.prepare(
    `UPDATE campaigns SET title=?, body=?, media_url=?, channel=?, recipients=?, total_recipients=?, scheduled_at=?, updated_at=?
     WHERE id=? AND user_id=?`,
  )
    .bind(title, messageBody, mediaUrl, channel, recipientsJson, total, scheduledAt, nowIso(), existing.id, ctx.user.id)
    .run();
  const row = (await env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(existing.id).first<CampaignRow>())!;
  return json(publicCampaign(row));
}

export async function deleteCampaign(ctx: AuthContext, env: Env, params: Record<string, string>): Promise<Response> {
  const existing = await findCampaign(ctx, env, params.id);
  if (existing.status === 'sending') throw conflict('A campaign that is sending cannot be deleted');
  await env.DB.prepare('DELETE FROM campaigns WHERE id = ? AND user_id = ?').bind(existing.id, ctx.user.id).run();
  await env.DB.prepare("UPDATE messages SET status = 'cancelled', updated_at = ? WHERE campaign_id = ? AND status = 'queued'")
    .bind(nowIso(), existing.id)
    .run();
  return json({ ok: true });
}

type Action = 'pause' | 'resume' | 'cancel' | 'duplicate' | 'send-now' | 'schedule';

export async function campaignAction(ctx: AuthContext, env: Env, request: Request, params: Record<string, string>): Promise<Response> {
  const existing = await findCampaign(ctx, env, params.id);
  const action = params.action as Action;

  switch (action) {
    case 'pause': {
      if (existing.status !== 'scheduled') throw conflict('Only scheduled campaigns can be paused');
      return updateStatus(env, existing, 'paused');
    }
    case 'resume': {
      if (existing.status !== 'paused') throw conflict('Only paused campaigns can be resumed');
      if (!existing.scheduled_at || new Date(existing.scheduled_at).getTime() <= Date.now()) {
        // Resuming a past-due campaign fires it as soon as possible.
        await env.DB.prepare('UPDATE campaigns SET scheduled_at = ? WHERE id = ?')
          .bind(new Date(Date.now() + 60_000).toISOString(), existing.id)
          .run();
      }
      return updateStatus(env, existing, 'scheduled');
    }
    case 'cancel': {
      if (['completed', 'cancelled', 'failed'].includes(existing.status)) {
        throw conflict(`Campaign is already ${existing.status}`);
      }
      await env.DB.prepare("UPDATE messages SET status = 'cancelled', updated_at = ? WHERE campaign_id = ? AND status = 'queued'")
        .bind(nowIso(), existing.id)
        .run();
      return updateStatus(env, existing, 'cancelled');
    }
    case 'duplicate': {
      const now = nowIso();
      const id = uuid();
      const recipients = JSON.parse(existing.recipients || '[]') as RecipientJson[];
      await env.DB.prepare(
        `INSERT INTO campaigns (id, user_id, title, body, media_url, channel, status, scheduled_at, recipients,
           total_recipients, sent_count, failed_count, ai_generated, created_at, updated_at, completed_at)
         VALUES (?,?,?,?,?,?, 'draft', NULL, ?, ?,0,0, ?,?,?,NULL)`,
      )
        .bind(
          id, ctx.user.id, `${existing.title} (copy)`, existing.body, existing.media_url, existing.channel,
          JSON.stringify(recipients), recipients.length, existing.ai_generated, now, now,
        )
        .run();
      const row = (await env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first<CampaignRow>())!;
      return json(publicCampaign(row), { status: 201 });
    }
    case 'schedule': {
      // Turn a draft into a scheduled campaign (body must include scheduledAt) or re-schedule.
      if (!['draft', 'paused', 'scheduled'].includes(existing.status)) {
        throw conflict(`A ${existing.status} campaign cannot be scheduled`);
      }
      const body = await readJson(request);
      const scheduledAt = asIsoDate(body.scheduledAt ?? body.scheduledTime, 'scheduledAt', { required: true, future: true })!;
      const recipients = JSON.parse(existing.recipients || '[]') as RecipientJson[];
      if (recipients.length === 0) throw badRequest('Add at least one recipient before scheduling');
      await env.DB.prepare("UPDATE campaigns SET status = 'scheduled', scheduled_at = ?, updated_at = ? WHERE id = ?")
        .bind(scheduledAt, nowIso(), existing.id)
        .run();
      const row = (await env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(existing.id).first<CampaignRow>())!;
      return json(publicCampaign(row));
    }
    case 'send-now': {
      if (['sending', 'completed', 'cancelled'].includes(existing.status)) {
        throw conflict(`A ${existing.status} campaign cannot be sent now`);
      }
      // Fire immediately: create + deliver messages synchronously via dispatch pipeline.
      const claimed = await env.DB.prepare(
        "UPDATE campaigns SET status = 'sending', scheduled_at = ?, updated_at = ? WHERE id = ? AND status IN ('draft','paused','scheduled','failed')",
      )
        .bind(nowIso(), nowIso(), existing.id)
        .run();
      if ((claimed.meta.changes ?? 0) === 0) throw conflict('Campaign was already claimed for sending');

      const user = (await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(ctx.user.id).first<UserRow>())!;
      const recipients = JSON.parse(existing.recipients || '[]') as RecipientJson[];
      if (recipients.length === 0) throw badRequest('Campaign has no recipients');

      const result = await createMessages(env, user, {
        recipients: recipients.map((r) => ({ contactId: r.contactId, phoneNumber: r.phoneNumber, name: r.name })),
        body: existing.body,
        mediaUrl: existing.media_url,
        channel: existing.channel,
        campaignId: existing.id,
        source: 'scheduled',
        aiGenerated: !!existing.ai_generated,
      });
      await env.DB.prepare('UPDATE campaigns SET total_recipients = ?, updated_at = ? WHERE id = ?')
        .bind(result.messages.length, nowIso(), existing.id)
        .run();
      const ids = result.messages.map((m) => m.id);
      if (ids.length <= 10) {
        await deliverMessages(env, { kind: 'send-batch', userId: ctx.user.id, messageIds: ids, campaignId: existing.id, attempt: 0 });
      } else {
        await enqueueDispatch(env, ctx.user.id, ids, existing.id);
      }
      await logAudit(env, ctx.user.id, 'campaign.send_now', { id: existing.id, count: ids.length }, clientIp(request));
      const row = (await env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(existing.id).first<CampaignRow>())!;
      return json(publicCampaign(row));
    }
    default:
      throw badRequest(`Unknown action: ${action}`);
  }
}

async function updateStatus(env: Env, campaign: CampaignRow, status: CampaignRow['status']): Promise<Response> {
  await env.DB.prepare('UPDATE campaigns SET status = ?, updated_at = ? WHERE id = ?')
    .bind(status, nowIso(), campaign.id)
    .run();
  const row = (await env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(campaign.id).first<CampaignRow>())!;
  return json(publicCampaign(row));
}

async function findCampaign(ctx: AuthContext, env: Env, id: string): Promise<CampaignRow> {
  const row = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?')
    .bind(id, ctx.user.id)
    .first<CampaignRow>();
  if (!row) throw notFound('Scheduled message not found');
  return row;
}
