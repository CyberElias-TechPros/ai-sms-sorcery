/**
 * KV-backed fixed-window rate limiter (best-effort, distributed).
 */

import { Env } from './env';
import { tooManyRequests } from './http';

export async function rateLimit(
  env: Env,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const kvKey = `rl:${key}:${bucket}`;
  const current = Number((await env.KV.get(kvKey)) || '0');
  if (current >= limit) {
    throw tooManyRequests();
  }
  await env.KV.put(kvKey, String(current + 1), { expirationTtl: windowSeconds * 2 });
}

/** Softer limiter for expensive outbound work (AI / sends). */
export async function usageLimit(env: Env, userId: string, action: string, limit: number, windowSeconds: number) {
  await rateLimit(env, `${action}:u:${userId}`, limit, windowSeconds);
}
