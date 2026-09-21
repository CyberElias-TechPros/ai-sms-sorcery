/**
 * Dashboard + analytics aggregates, computed live from the message log.
 */

import { Env } from '../lib/env';
import { json } from '../lib/http';
import { AuthContext } from '../lib/auth';
import { UserRow, publicUser } from '../lib/rows';

const RANGES: Record<string, number> = {
  '7days': 7,
  '30days': 30,
  '90days': 90,
  '12months': 365,
};

export async function dashboard(ctx: AuthContext, env: Env): Promise<Response> {
  const user = (await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(ctx.user.id).first<UserRow>())!;

  const since30 = daysAgo(30);
  const since7 = daysAgo(7);

  const totals = await env.DB.prepare(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN ai_generated = 1 THEN 1 ELSE 0 END) AS ai_generated,
       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
       SUM(CASE WHEN status IN ('queued','sending','sent') THEN 1 ELSE 0 END) AS pending
     FROM messages WHERE user_id = ? AND created_at >= ?`,
  )
    .bind(ctx.user.id, since30)
    .first<{ total: number; ai_generated: number; delivered: number; failed: number; pending: number }>();

  const contacts = await env.DB.prepare(
    `SELECT COUNT(*) AS all_count,
            SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS new_week
     FROM contacts WHERE user_id = ?`,
  )
    .bind(since7, ctx.user.id)
    .first<{ all_count: number; new_week: number }>();

  const upcoming = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM campaigns
     WHERE user_id = ? AND status IN ('scheduled','paused') AND scheduled_at IS NOT NULL AND scheduled_at >= ?`,
  )
    .bind(ctx.user.id, new Date().toISOString())
    .first<{ n: number }>();

  const drafts = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM campaigns WHERE user_id = ? AND status = 'draft'`,
  )
    .bind(ctx.user.id)
    .first<{ n: number }>();

  // Last 7 days chart
  const daily = await dailySeries(env, ctx.user.id, 7);

  const recentMessages = (
    await env.DB.prepare(
      `SELECT id, body, ai_generated, created_at, status, to_phone, to_name FROM messages
       WHERE user_id = ? AND ai_generated = 1 ORDER BY created_at DESC LIMIT 6`,
    )
      .bind(ctx.user.id)
      .all<{ id: string; body: string; ai_generated: number; created_at: string; status: string; to_phone: string; to_name: string | null }>()
  ).results;

  const recentTemplates = (
    await env.DB.prepare(
      `SELECT id, title, content, model, created_at FROM templates WHERE user_id = ? ORDER BY updated_at DESC LIMIT 3`,
    )
      .bind(ctx.user.id)
      .all<{ id: string; title: string; content: string; model: string | null; created_at: string }>()
  ).results;

  const nextCampaigns = (
    await env.DB.prepare(
      `SELECT id, title, status, scheduled_at, total_recipients FROM campaigns
       WHERE user_id = ? AND status IN ('scheduled','paused','draft')
       ORDER BY CASE WHEN scheduled_at IS NULL THEN 1 ELSE 0 END, scheduled_at ASC LIMIT 4`,
    )
      .bind(ctx.user.id)
      .all<{ id: string; title: string; status: string; scheduled_at: string | null; total_recipients: number }>()
  ).results;

  return json({
    user: publicUser(user),
    stats: {
      totalSent: totals?.total ?? 0,
      aiGenerated: totals?.ai_generated ?? 0,
      aiShare: totals?.total ? Math.round(((totals.ai_generated ?? 0) / totals.total) * 100) : 0,
      delivered: totals?.delivered ?? 0,
      failed: totals?.failed ?? 0,
      pending: totals?.pending ?? 0,
      activeContacts: contacts?.all_count ?? 0,
      newContactsWeek: contacts?.new_week ?? 0,
      scheduledNext7: upcoming?.n ?? 0,
      drafts: drafts?.n ?? 0,
      messagesQuota: user.messages_quota,
      messagesUsed: user.messages_used,
      messagesRemaining: Math.max(0, user.messages_quota - user.messages_used),
    },
    daily,
    recentMessages: recentMessages.map((m) => ({
      id: m.id,
      title: m.to_name ? `To ${m.to_name}` : `To ${m.to_phone}`,
      content: m.body,
      model: 'AI',
      status: m.status,
      timestamp: m.created_at,
    })),
    recentTemplates: recentTemplates.map((t) => ({
      id: t.id,
      title: t.title,
      content: t.content,
      model: t.model,
      createdAt: t.created_at,
    })),
    upcoming: nextCampaigns.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      date: c.scheduled_at,
      recipients: c.total_recipients,
    })),
  });
}

export async function analytics(ctx: AuthContext, env: Env, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const rangeKey = (url.searchParams.get('range') || '7days') as keyof typeof RANGES;
  const days = RANGES[rangeKey] || 7;
  const since = daysAgo(days);

  const byStatus = (
    await env.DB.prepare(
      `SELECT status, COUNT(*) AS n FROM messages WHERE user_id = ? AND created_at >= ? GROUP BY status`,
    )
      .bind(ctx.user.id, since)
      .all<{ status: string; n: number }>()
  ).results;

  const byChannel = (
    await env.DB.prepare(
      `SELECT channel, COUNT(*) AS n FROM messages WHERE user_id = ? AND created_at >= ? GROUP BY channel`,
    )
      .bind(ctx.user.id, since)
      .all<{ channel: string; n: number }>()
  ).results;

  const byCategory = (
    await env.DB.prepare(
      `SELECT COALESCE(t.category, 'other') AS category, COUNT(*) AS n
       FROM messages m LEFT JOIN templates t ON t.id = m.template_id
       WHERE m.user_id = ? AND m.created_at >= ? GROUP BY 1 ORDER BY n DESC`,
    )
      .bind(ctx.user.id, since)
      .all<{ category: string; n: number }>()
  ).results;

  const daily = await dailySeries(env, ctx.user.id, days);

  const totals = byStatus.reduce(
    (acc, r) => {
      acc.total += r.n;
      if (r.status === 'delivered') acc.delivered += r.n;
      if (r.status === 'failed') acc.failed += r.n;
      if (['queued', 'sending', 'sent'].includes(r.status)) acc.pending += r.n;
      return acc;
    },
    { total: 0, delivered: 0, failed: 0, pending: 0 },
  );

  const deliveryRate = totals.total ? Math.round((totals.delivered / totals.total) * 1000) / 10 : 0;

  return json({
    range: rangeKey,
    days,
    totals,
    deliveryRate,
    byStatus: byStatus.map((r) => ({ name: r.status, value: r.n })),
    byChannel: byChannel.map((r) => ({ name: r.channel, value: r.n })),
    byCategory: byCategory.map((r) => ({ name: r.category, value: r.n })),
    daily,
  });
}

async function dailySeries(env: Env, userId: string, days: number) {
  const rows = (
    await env.DB.prepare(
      `SELECT substr(created_at, 1, 10) AS day,
               SUM(CASE WHEN channel = 'sms' THEN 1 ELSE 0 END) AS sms,
               SUM(CASE WHEN channel = 'whatsapp' THEN 1 ELSE 0 END) AS whatsapp,
               COUNT(*) AS total
       FROM messages WHERE user_id = ? AND created_at >= ?
       GROUP BY day ORDER BY day ASC`,
    )
      .bind(userId, daysAgo(days))
      .all<{ day: string; sms: number; whatsapp: number; total: number }>()
  ).results;

  const byDay = new Map(rows.map((r) => [r.day, r]));
  const out: Array<{ name: string; sms: number; whatsapp: number; sent: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    const label = days <= 14
      ? d.toLocaleDateString('en-US', { weekday: 'short' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const row = byDay.get(key);
    out.push({
      name: label,
      sms: row?.sms ?? 0,
      whatsapp: row?.whatsapp ?? 0,
      sent: row?.total ?? 0,
    });
  }
  return out;
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}
