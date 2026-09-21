/**
 * User settings, profile, account deletion + full data export (privacy).
 */

import { Env } from '../lib/env';
import { json, readJson, nowIso, unauthorized, clientIp, badRequest } from '../lib/http';
import { asString, asOptionalPhone, asBool, passwordPolicy } from '../lib/validate';
import { verifyPassword, hashPassword } from '../lib/crypto';
import { AuthContext, destroyAllSessions, bearerToken, destroySession } from '../lib/auth';
import { UserRow, UserSettingsRow, ContactRow, TemplateRow, CampaignRow, MessageRow, publicUser, publicSettings, publicContact, publicTemplate, publicCampaign, publicMessage } from '../lib/rows';
import { getSettings } from '../dispatch';
import { logAudit } from './auth';

export async function getSettingsRoute(ctx: AuthContext, env: Env): Promise<Response> {
  const settings = await getSettings(env, ctx.user.id);
  return json(publicSettings(settings));
}

const BOOL_FIELDS = [
  'emailNotifications', 'smsNotifications', 'browserNotifications', 'darkMode',
  'compactView', 'autoSave', 'optOutFooter', 'complianceCheck',
] as const;

const DB_BOOL_COLUMN: Record<(typeof BOOL_FIELDS)[number], string> = {
  emailNotifications: 'email_notifications',
  smsNotifications: 'sms_notifications',
  browserNotifications: 'browser_notifications',
  darkMode: 'dark_mode',
  compactView: 'compact_view',
  autoSave: 'auto_save',
  optOutFooter: 'opt_out_footer',
  complianceCheck: 'compliance_check',
};

export async function updateSettings(ctx: AuthContext, env: Env, request: Request): Promise<Response> {
  const body = await readJson(request);
  const current = await getSettings(env, ctx.user.id);
  const updates: string[] = [];
  const binds: unknown[] = [];

  for (const field of BOOL_FIELDS) {
    if (body[field] !== undefined) {
      updates.push(`${DB_BOOL_COLUMN[field]} = ?`);
      binds.push(asBool(body[field], field) ? 1 : 0);
    }
  }
  if (body.timezone !== undefined) {
    const tz = asString(body.timezone, 'timezone', { max: 64 });
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: tz });
    } catch {
      throw badRequest('Unknown timezone');
    }
    updates.push('timezone = ?');
    binds.push(tz);
  }
  if (updates.length === 0) return json(publicSettings(current));

  updates.push('updated_at = ?');
  binds.push(nowIso(), ctx.user.id);
  await env.DB.prepare(`UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = ?`).bind(...binds).run();
  return json(publicSettings(await getSettings(env, ctx.user.id)));
}

export async function updateProfile(ctx: AuthContext, env: Env, request: Request): Promise<Response> {
  const body = await readJson(request);
  const user = (await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(ctx.user.id).first<UserRow>())!;

  const name = body.name !== undefined ? asString(body.name, 'name', { min: 2, max: 80 }) : user.name;
  const phoneNumber = body.phoneNumber !== undefined ? (asOptionalPhone(body.phoneNumber) ?? null) : user.phone_number;
  const avatarUrl = body.avatarUrl !== undefined
    ? (body.avatarUrl ? asString(body.avatarUrl, 'avatarUrl', { max: 2000, pattern: /^https:\/\// }) : null)
    : user.avatar_url;
  const email = body.email !== undefined ? asString(body.email, 'email', { max: 254, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/ }).toLowerCase() : user.email_lower;

  if (email !== user.email_lower) {
    const dup = await env.DB.prepare('SELECT id FROM users WHERE email_lower = ? AND id != ?').bind(email, user.id).first();
    if (dup) throw badRequest('That email is already in use');
  }

  await env.DB.prepare(
    'UPDATE users SET name=?, phone_number=?, avatar_url=?, email=?, email_lower=?, updated_at=? WHERE id=?',
  )
    .bind(name, phoneNumber, avatarUrl, email, email, nowIso(), user.id)
    .run();

  const fresh = (await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first<UserRow>())!;
  return json({ user: publicUser(fresh) });
}

/** Full account data export (GDPR-style portability). */
export async function exportAll(ctx: AuthContext, env: Env): Promise<Response> {
  const userId = ctx.user.id;
  const user = (await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRow>())!;
  const settings = await getSettings(env, userId);
  const contacts = (await env.DB.prepare('SELECT * FROM contacts WHERE user_id = ?').bind(userId).all<ContactRow>()).results;
  const templates = (await env.DB.prepare('SELECT * FROM templates WHERE user_id = ?').bind(userId).all<TemplateRow>()).results;
  const campaigns = (await env.DB.prepare('SELECT * FROM campaigns WHERE user_id = ?').bind(userId).all<CampaignRow>()).results;
  const messages = (await env.DB.prepare('SELECT * FROM messages WHERE user_id = ? LIMIT 10000').bind(userId).all<MessageRow>()).results;

  return json({
    format: 'ai-sms-sorcery.account-export.v1',
    exportedAt: nowIso(),
    user: publicUser(user),
    settings: publicSettings(settings),
    contacts: contacts.map(publicContact),
    templates: templates.map(publicTemplate),
    campaigns: campaigns.map(publicCampaign),
    messages: messages.map(publicMessage),
  });
}

/** Permanent account deletion — cascades through all owned data. */
export async function deleteAccount(ctx: AuthContext, env: Env, request: Request): Promise<Response> {
  const body = await readJson(request);
  const password = passwordPolicy(body.password, 'password');
  const user = (await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(ctx.user.id).first<UserRow>())!;
  const valid = await verifyPassword(password, user.password_salt, user.password_hash);
  if (!valid) throw unauthorized('Password is incorrect — account deletion cancelled');

  await logAudit(env, user.id, 'account.delete', {}, clientIp(request));
  // FK cascade covers sessions/contacts/templates/campaigns/messages; explicit for safety.
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM contacts WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM templates WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM messages WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM campaigns WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM credentials WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM user_settings WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM ai_generations WHERE user_id = ?').bind(user.id),
    env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id),
  ]);
  const token = bearerToken(request);
  if (token) await destroySession(env, token);
  return json({ ok: true, message: 'Your account and all data have been permanently deleted.' });
}

/** Sign out everywhere (all devices). */
export async function logoutAll(ctx: AuthContext, env: Env): Promise<Response> {
  await destroyAllSessions(env, ctx.user.id);
  return json({ ok: true });
}

/** Simple change-password echo used by the security tab. */
export async function securitySummary(ctx: AuthContext, env: Env): Promise<Response> {
  const sessions = (
    await env.DB.prepare(
      'SELECT id, user_agent, ip, created_at, last_seen_at, expires_at FROM sessions WHERE user_id = ? ORDER BY last_seen_at DESC LIMIT 20',
    )
      .bind(ctx.user.id)
      .all<{ id: string; user_agent: string | null; ip: string | null; created_at: string; last_seen_at: string; expires_at: string }>()
  ).results;
  return json({
    activeSessions: sessions.map((s) => ({
      id: s.id,
      userAgent: s.user_agent,
      ip: s.ip,
      createdAt: s.created_at,
      lastSeenAt: s.last_seen_at,
      expiresAt: s.expires_at,
      current: s.id === (undefined as never),
    })),
    passwordChangedAt: null,
    twoFactorEnabled: false,
  });
}

export { hashPassword };
