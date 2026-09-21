/**
 * Authentication routes: register, login, logout, session, password change.
 * Account-enumeration-safe errors; brute-force rate limiting.
 */

import { Env } from '../lib/env';
import {
  json, readJson, unauthorized, conflict, badRequest, clientIp, nowIso,
} from '../lib/http';
import { hashPassword, verifyPassword, uuid } from '../lib/crypto';
import { asString, asEmail, asOptionalPhone, passwordPolicy, asPhone } from '../lib/validate';
import { AuthContext, createSession, destroySession, destroyAllSessions, bearerToken, requireAuth } from '../lib/auth';
import { rateLimit } from '../lib/ratelimit';
import { UserRow, publicUser } from '../lib/rows';

export async function register(env: Env, request: Request): Promise<Response> {
  await rateLimit(env, `register:${clientIp(request)}`, 10, 3600);
  const body = await readJson(request);
  const email = asEmail(body.email);
  const password = passwordPolicy(body.password);
  const name = asString(body.name, 'name', { min: 2, max: 80 });
  const phoneNumber = asOptionalPhone(body.phoneNumber);
  if (body.inviteCode !== undefined && typeof body.inviteCode === 'string') {
    // Reserved for future invite-only launches; accept and ignore valid-format codes.
    asString(body.inviteCode, 'inviteCode', { max: 64, required: false });
  }

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email_lower = ?').bind(email).first();
  if (existing) {
    throw conflict('An account with this email already exists — try signing in instead', {
      field: 'email',
    });
  }

  const { hash, salt } = await hashPassword(password);
  const now = nowIso();
  const id = uuid();
  await env.DB.prepare(
    `INSERT INTO users (id, email, email_lower, password_hash, password_salt, name, phone_number, role, plan,
       messages_quota, messages_used, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,'user','free_trial',500,0,?,?)`,
  )
    .bind(id, email, email, hash, salt, name, phoneNumber ?? null, now, now)
    .run();
  await env.DB.prepare('INSERT INTO user_settings (user_id, updated_at) VALUES (?, ?)').bind(id, now).run();

  await logAudit(env, id, 'auth.register', {}, clientIp(request));

  const { token, expiresAt } = await createSession(env, id, {
    userAgent: request.headers.get('user-agent'),
    ip: clientIp(request),
  });
  const user = (await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>())!;
  return json({ token, expiresAt, user: publicUser(user) }, { status: 201 });
}

export async function login(env: Env, request: Request): Promise<Response> {
  const ip = clientIp(request);
  await rateLimit(env, `login:${ip}`, 20, 900);
  const body = await readJson(request);
  const email = asEmail(body.email);
  const password = asString(body.password, 'password', { min: 1, max: 128 });

  const user = await env.DB.prepare('SELECT * FROM users WHERE email_lower = ?').bind(email).first<UserRow>();
  // Enumeration-safe: identical error + timing work for unknown user vs wrong password.
  const valid = user
    ? await verifyPassword(password, user.password_salt, user.password_hash)
    : await verifyPassword(password, '00'.repeat(16), '00'.repeat(32));
  if (!user || !valid) {
    await rateLimit(env, `login-fail:${email}:${ip}`, 10, 900);
    throw unauthorized('Invalid email or password');
  }

  const { token, expiresAt } = await createSession(env, user.id, {
    userAgent: request.headers.get('user-agent'),
    ip,
  });
  await logAudit(env, user.id, 'auth.login', {}, ip);
  return json({ token, expiresAt, user: publicUser(user) });
}

export async function logout(env: Env, request: Request): Promise<Response> {
  const token = bearerToken(request);
  if (token) await destroySession(env, token);
  return json({ ok: true });
}

export async function me(ctx: AuthContext, env: Env): Promise<Response> {
  const user = (await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(ctx.user.id).first<UserRow>())!;
  return json({ user: publicUser(user) });
}

export async function changePassword(ctx: AuthContext, env: Env, request: Request): Promise<Response> {
  await rateLimit(env, `pw:${ctx.user.id}`, 10, 3600);
  const body = await readJson(request);
  const currentPassword = asString(body.currentPassword, 'currentPassword', { min: 1, max: 128 });
  const newPassword = passwordPolicy(body.newPassword, 'newPassword');

  const user = (await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(ctx.user.id).first<UserRow>())!;
  const valid = await verifyPassword(currentPassword, user.password_salt, user.password_hash);
  if (!valid) throw unauthorized('Current password is incorrect');

  const { hash, salt } = await hashPassword(newPassword);
  await env.DB.prepare('UPDATE users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?')
    .bind(hash, salt, nowIso(), user.id)
    .run();
  // Invalidate every other session on password change.
  await destroyAllSessions(env, user.id, ctx.sessionId);
  await logAudit(env, user.id, 'auth.password_changed', {}, clientIp(request));
  return json({ ok: true, message: 'Password updated. Other sessions were signed out.' });
}

export async function logAudit(
  env: Env,
  userId: string | null,
  action: string,
  meta: Record<string, unknown> = {},
  ip?: string,
): Promise<void> {
  try {
    await env.DB.prepare(
      'INSERT INTO audit_log (id, user_id, action, meta, ip, created_at) VALUES (?,?,?,?,?,?)',
    )
      .bind(uuid(), userId, action, JSON.stringify(meta), ip ?? null, nowIso())
      .run();
  } catch (err) {
    console.error('audit log failed:', err);
  }
}

export { badRequest };
