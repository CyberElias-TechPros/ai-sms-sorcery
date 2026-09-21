/**
 * Message sending + logs: send now, list/filter/paginate, detail, resend, export.
 * Small sends deliver inline (immediate feedback); larger batches go through the queue.
 */

import { Env } from '../lib/env';
import { json, readJson, notFound, nowIso, clientIp, badRequest } from '../lib/http';
import { uuid } from '../lib/crypto';
import { asString, asEnum, asRecipients, asBool, smsSegments } from '../lib/validate';
import { AuthContext } from '../lib/auth';
import { usageLimit } from '../lib/ratelimit';
import { MessageRow, TemplateRow, UserRow, publicMessage, RecipientJson } from '../lib/rows';
import { createMessages, deliverMessages, enqueueDispatch, finalizeCampaign } from '../dispatch';
import { logAudit } from './auth';

const CHANNELS = ['sms', 'whatsapp', 'both'] as const;
const STATUSES = ['queued', 'sending', 'sent', 'delivered', 'failed', 'cancelled'] as const;

const INLINE_THRESHOLD = 10; // deliver inline for small batches for instant UX

export async function sendMessages(ctx: AuthContext, env: Env, request: Request): Promise<Response> {
  await usageLimit(env, ctx.user.id, 'send', 60, 60);
  const body = await readJson(request);
  const messageBody = asString(body.body ?? body.content, 'body', { min: 1, max: 1600 });
  const recipients = asRecipients(body.recipients);
  const channel = asEnum(body.channel, CHANNELS, 'channel', 'sms');
  const via = asEnum(body.via, ['device', 'provider'] as const, 'via', 'provider');
  const mediaUrl = body.mediaUrl
    ? asString(body.mediaUrl, 'mediaUrl', { max: 2000, pattern: /^https:\/\// })
    : null;
  const templateId = body.templateId ? asString(body.templateId, 'templateId', { max: 64, required: false }) : null;
  const aiGenerated = asBool(body.aiGenerated, 'aiGenerated', false);
  const idempotencyKey =
    request.headers.get('x-idempotency-key') ||
    (body.idempotencyKey ? asString(body.idempotencyKey, 'idempotencyKey', { max: 100, required: false }) : null);

  // Optional campaign attachment (device runs launched from the Scheduled page).
  let campaignId: string | undefined;
  if (body.campaignId) {
    campaignId = asString(body.campaignId, 'campaignId', { max: 64 });
    const owned = await env.DB.prepare('SELECT id FROM campaigns WHERE id = ? AND user_id = ?')
      .bind(campaignId, ctx.user.id)
      .first();
    if (!owned) throw notFound('Campaign not found');
  }

  // Track template usage + provenance
  if (templateId) {
    const tpl = await env.DB.prepare('SELECT * FROM templates WHERE id = ? AND user_id = ?')
      .bind(templateId, ctx.user.id)
      .first<TemplateRow>();
    if (tpl) {
      await env.DB.prepare('UPDATE templates SET usage_count = usage_count + 1 WHERE id = ?').bind(tpl.id).run();
    }
  }

  const user = await userRow(ctx, env);
  const channels: Array<'sms' | 'whatsapp'> = channel === 'both' ? ['sms', 'whatsapp'] : [channel === 'whatsapp' ? 'whatsapp' : 'sms'];

  let created: MessageRow[] = [];
  let skippedOptedOut = 0;
  let footerAppended = false;
  for (const ch of channels) {
    const result = await createMessages(env, user, {
      recipients,
      body: messageBody,
      mediaUrl,
      channel: ch,
      campaignId,
      source: via === 'device' ? 'composer' : 'composer',
      aiGenerated,
      templateId,
      idempotencyKey: channels.length > 1 && idempotencyKey ? `${idempotencyKey}:${ch}` : idempotencyKey,
      via,
    });
    created = created.concat(result.messages);
    skippedOptedOut += result.skippedOptedOut;
    footerAppended = footerAppended || result.compliance.footerAppended;
  }

  const ids = created.map((m) => m.id);
  // Device (phone-URI) sends are handed to the user's own phone — no provider
  // dispatch. Cloud sends: small batches inline, larger batches via the queue.
  if (via !== 'device') {
    if (ids.length <= INLINE_THRESHOLD) {
      await deliverMessages(env, { kind: 'send-batch', userId: ctx.user.id, messageIds: ids, campaignId, attempt: 0 });
    } else {
      await enqueueDispatch(env, ctx.user.id, ids, campaignId);
    }
  }

  await logAudit(env, ctx.user.id, via === 'device' ? 'messages.send_device' : 'messages.send', { count: ids.length, channel, via }, clientIp(request));

  const fresh = await loadMessages(env, ids);
  return json({
    messages: fresh.map(publicMessage),
    count: fresh.length,
    via,
    skippedOptedOut,
    compliance: { footerAppended },
    segments: smsSegments(created[0]?.body ?? messageBody),
  }, { status: 201 });
}

async function userRow(ctx: AuthContext, env: Env): Promise<UserRow> {
  const row = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(ctx.user.id).first<UserRow>();
  if (!row) throw notFound('User not found');
  return row;
}

async function loadMessages(env: Env, ids: string[]): Promise<MessageRow[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  return (
    await env.DB.prepare(`SELECT * FROM messages WHERE id IN (${placeholders})`).bind(...ids).all<MessageRow>()
  ).results;
}

export async function listMessages(ctx: AuthContext, env: Env, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const status = (url.searchParams.get('status') || 'all').trim();
  const channel = (url.searchParams.get('channel') || 'all').trim();
  const source = (url.searchParams.get('source') || 'all').trim();
  const campaignId = (url.searchParams.get('campaignId') || '').trim();
  const page = Math.max(1, Number(url.searchParams.get('page') || 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || 25) || 25));

  const where: string[] = ['user_id = ?'];
  const binds: unknown[] = [ctx.user.id];
  if (q) {
    where.push('(to_phone LIKE ? OR body LIKE ? OR IFNULL(to_name, \'\') LIKE ?)');
    const like = `%${q}%`;
    binds.push(like, like, like);
  }
  if (status !== 'all' && (STATUSES as readonly string[]).includes(status)) {
    where.push('status = ?');
    binds.push(status);
  }
  if (channel !== 'all') {
    where.push('channel = ?');
    binds.push(channel);
  }
  if (source !== 'all') {
    where.push('source = ?');
    binds.push(source);
  }
  if (campaignId) {
    where.push('campaign_id = ?');
    binds.push(campaignId);
  }

  const whereSql = where.join(' AND ');
  const total = (
    await env.DB.prepare(`SELECT COUNT(*) AS n FROM messages WHERE ${whereSql}`).bind(...binds).first<{ n: number }>()
  )!.n;
  const rows = (
    await env.DB.prepare(
      `SELECT * FROM messages WHERE ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    )
      .bind(...binds, pageSize, (page - 1) * pageSize)
      .all<MessageRow>()
  ).results;

  return json({ items: rows.map(publicMessage), total, page, pageSize });
}

export async function getMessage(ctx: AuthContext, env: Env, params: Record<string, string>): Promise<Response> {
  const row = await env.DB.prepare('SELECT * FROM messages WHERE id = ? AND user_id = ?')
    .bind(params.id, ctx.user.id)
    .first<MessageRow>();
  if (!row) throw notFound('Message not found');
  return json(publicMessage(row));
}

export async function resendMessage(ctx: AuthContext, env: Env, request: Request, params: Record<string, string>): Promise<Response> {
  const original = await env.DB.prepare('SELECT * FROM messages WHERE id = ? AND user_id = ?')
    .bind(params.id, ctx.user.id)
    .first<MessageRow>();
  if (!original) throw notFound('Message not found');

  const result = await createMessages(env, await userRow(ctx, env), {
    recipients: [{ phoneNumber: original.to_phone, name: original.to_name ?? undefined }],
    body: original.body,
    mediaUrl: original.media_url,
    channel: original.channel === 'whatsapp' ? 'whatsapp' : 'sms',
    campaignId: undefined,
    source: 'resend',
    aiGenerated: !!original.ai_generated,
    templateId: original.template_id,
  });

  await deliverMessages(env, {
    kind: 'send-batch',
    userId: ctx.user.id,
    messageIds: result.messages.map((m) => m.id),
    attempt: 0,
  });
  const fresh = await loadMessages(env, result.messages.map((m) => m.id));
  return json({ message: publicMessage(fresh[0]) }, { status: 201 });
}

export async function exportMessages(ctx: AuthContext, env: Env): Promise<Response> {
  const rows = (
    await env.DB.prepare('SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 10000')
      .bind(ctx.user.id)
      .all<MessageRow>()
  ).results;
  return json({
    exportedAt: nowIso(),
    count: rows.length,
    format: 'ai-sms-sorcery.messages.v1',
    messages: rows.map(publicMessage),
  });
}

export async function cancelMessage(ctx: AuthContext, env: Env, params: Record<string, string>): Promise<Response> {
  const row = await env.DB.prepare('SELECT * FROM messages WHERE id = ? AND user_id = ?')
    .bind(params.id, ctx.user.id)
    .first<MessageRow>();
  if (!row) throw notFound('Message not found');
  if (row.status !== 'queued') throw badRequest('Only queued messages can be cancelled');
  await env.DB.prepare("UPDATE messages SET status = 'cancelled', updated_at = ? WHERE id = ?")
    .bind(nowIso(), row.id)
    .run();
  const fresh = (await env.DB.prepare('SELECT * FROM messages WHERE id = ?').bind(row.id).first<MessageRow>())!;
  return json(publicMessage(fresh));
}

/**
 * Manual status marking — used by the device send queue to record what
 * actually happened on the phone (sent / delivered / failed / skipped).
 */
export async function markMessage(ctx: AuthContext, env: Env, request: Request, params: Record<string, string>): Promise<Response> {
  const body = await readJson(request);
  const status = asEnum(body.status, ['sent', 'delivered', 'failed', 'cancelled'] as const, 'status');
  const row = await env.DB.prepare('SELECT * FROM messages WHERE id = ? AND user_id = ?')
    .bind(params.id, ctx.user.id)
    .first<MessageRow>();
  if (!row) throw notFound('Message not found');

  const now = nowIso();
  await env.DB.prepare(
    `UPDATE messages SET status = ?,
       sent_at = COALESCE(sent_at, CASE WHEN ? IN ('sent','delivered') THEN ? ELSE NULL END),
       delivered_at = CASE WHEN ? = 'delivered' THEN ? ELSE delivered_at END,
       error = CASE WHEN ? = 'failed' THEN COALESCE(error, 'Marked failed on device') ELSE error END,
       updated_at = ?
     WHERE id = ?`,
  )
    .bind(status, status, now, status, now, status, now, row.id)
    .run();

  if (row.campaign_id) {
    await finalizeCampaign(env, row.campaign_id);
  }

  const fresh = (await env.DB.prepare('SELECT * FROM messages WHERE id = ?').bind(row.id).first<MessageRow>())!;
  return json(publicMessage(fresh));
}

export type { RecipientJson };
