/**
 * Session auth: opaque bearer tokens, SHA-256-hashed at rest in D1.
 * Sliding expiry — active sessions extend automatically.
 */

import { Env } from './env';
import { unauthorized, forbidden, nowIso } from './http';
import { randomToken, sha256Hex, uuid } from './crypto';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const RENEW_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // renew when < 7 days left

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  phone_number: string | null;
  role: 'user' | 'admin';
  plan: string;
  messages_quota: number;
  messages_used: number;
  created_at: string;
  updated_at: string;
}

export interface AuthContext {
  user: AuthUser;
  sessionId: string;
}

export async function createSession(
  env: Env,
  userId: string,
  meta: { userAgent?: string | null; ip?: string | null } = {},
): Promise<{ token: string; expiresAt: string }> {
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const now = Date.now();
  const id = uuid();
  const expiresAt = new Date(now + SESSION_TTL_MS).toISOString();
  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, user_agent, ip, created_at, last_seen_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, userId, tokenHash, meta.userAgent ?? null, meta.ip ?? null, nowIso(), nowIso(), expiresAt)
    .run();
  return { token, expiresAt };
}

export async function destroySession(env: Env, token: string): Promise<void> {
  const tokenHash = await sha256Hex(token);
  await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
}

export async function destroyAllSessions(env: Env, userId: string, exceptSessionId?: string): Promise<void> {
  if (exceptSessionId) {
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?').bind(userId, exceptSessionId).run();
  } else {
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
  }
}

/** Resolve the authenticated user from a request's Authorization header. */
export async function requireAuth(env: Env, request: Request): Promise<AuthContext> {
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) throw unauthorized();
  const token = match[1].trim();
  const tokenHash = await sha256Hex(token);

  const row = await env.DB.prepare(
    `SELECT s.id AS session_id, s.expires_at, u.*
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ?`,
  )
    .bind(tokenHash)
    .first<{ session_id: string; expires_at: string } & AuthUser>();

  if (!row) throw unauthorized('Session expired or invalid — please sign in again');
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(row.session_id).run();
    throw unauthorized('Session expired — please sign in again');
  }

  // Sliding renewal
  const remaining = new Date(row.expires_at).getTime() - Date.now();
  if (remaining < RENEW_AFTER_MS) {
    const newExpiry = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    await env.DB.prepare('UPDATE sessions SET expires_at = ?, last_seen_at = ? WHERE id = ?')
      .bind(newExpiry, nowIso(), row.session_id)
      .run();
  } else {
    await env.DB.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').bind(nowIso(), row.session_id).run();
  }

  const { session_id: _s, expires_at: _e, ...user } = row;
  return { user: user as AuthUser, sessionId: row.session_id };
}

export function requireRole(ctx: AuthContext, role: 'admin'): void {
  if (ctx.user.role !== role) throw forbidden();
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : null;
}
