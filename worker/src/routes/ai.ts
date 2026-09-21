/**
 * AI generation routes: single generation, bulk personalization, history.
 */

import { Env } from '../lib/env';
import { json, readJson, badGateway, nowIso } from '../lib/http';
import { uuid } from '../lib/crypto';
import { asString, asEnum, asInt, asRecipients, smsSegments } from '../lib/validate';
import { AuthContext } from '../lib/auth';
import { usageLimit } from '../lib/ratelimit';
import { generateMessage, personalize, AiCredentials } from '../providers/ai';
import { getDecryptedCredentials } from '../dispatch';
import { logAudit } from './auth';

const KINDS = ['marketing', 'reminder', 'notification', 'alert', 'other'] as const;

export async function generate(ctx: AuthContext, env: Env, request: Request): Promise<Response> {
  await usageLimit(env, ctx.user.id, 'ai-generate', 30, 60);
  const body = await readJson(request);
  const prompt = asString(body.prompt, 'prompt', { min: 3, max: 1000 });
  const kind = asEnum(body.kind ?? body.type, KINDS, 'kind', 'marketing');
  const maxLength = asInt(body.maxLength, 'maxLength', { min: 40, max: 1600, fallback: 320 });
  const variants = asInt(body.variants, 'variants', { min: 1, max: 5, fallback: 1 });
  const audience = body.audience ? asString(body.audience, 'audience', { max: 200, required: false }) : undefined;
  const tone = body.tone ? asString(body.tone, 'tone', { max: 60, required: false }) : undefined;

  let creds: (AiCredentials & { provider: string }) | null = null;
  try {
    creds = (await getDecryptedCredentials(env, ctx.user.id, 'ai')) as AiCredentials | null;
  } catch (err) {
    console.error('AI credentials unavailable, falling back to sorcery engine:', err);
  }

  let result;
  try {
    result = await generateMessage(creds, { prompt, kind, maxLength, variants, audience, tone });
  } catch (err) {
    throw badGateway(err instanceof Error ? err.message : 'AI provider error');
  }

  const now = nowIso();
  for (const text of result.texts) {
    await env.DB.prepare(
      'INSERT INTO ai_generations (id, user_id, prompt, kind, provider, model, result, created_at) VALUES (?,?,?,?,?,?,?,?)',
    )
      .bind(uuid(), ctx.user.id, prompt, kind, result.provider, result.model, text, now)
      .run();
  }

  return json({
    texts: result.texts,
    provider: result.provider,
    model: result.model,
    segments: result.texts.map((t) => smsSegments(t)),
  });
}

export interface BulkItem {
  recipient: { contactId?: string; phoneNumber: string; name?: string };
  text: string;
  segments: number;
}

/** Personalized bulk generation: one variant per recipient using {{name}} substitution. */
export async function generateBulk(ctx: AuthContext, env: Env, request: Request): Promise<Response> {
  await usageLimit(env, ctx.user.id, 'ai-bulk', 10, 60);
  const body = await readJson(request);
  const prompt = asString(body.prompt, 'prompt', { min: 3, max: 1000 });
  const kind = asEnum(body.kind ?? body.type, KINDS, 'kind', 'marketing');
  const maxLength = asInt(body.maxLength, 'maxLength', { min: 40, max: 1600, fallback: 320 });
  const recipients = asRecipients(body.recipients, 'recipients', 500);

  let creds: (AiCredentials & { provider: string }) | null = null;
  try {
    creds = (await getDecryptedCredentials(env, ctx.user.id, 'ai')) as AiCredentials | null;
  } catch {
    creds = null;
  }

  let result;
  try {
    // One master message, then personalized per recipient (cost-aware: 1 generation).
    result = await generateMessage(creds, { prompt, kind, maxLength, variants: 1 });
  } catch (err) {
    throw badGateway(err instanceof Error ? err.message : 'AI provider error');
  }

  const master = result.texts[0];
  const items: BulkItem[] = recipients.map((r) => {
    const text = personalize(master, { name: r.name, phone: r.phoneNumber });
    return { recipient: r, text, segments: smsSegments(text).segments };
  });

  await env.DB.prepare(
    'INSERT INTO ai_generations (id, user_id, prompt, kind, provider, model, result, created_at) VALUES (?,?,?,?,?,?,?,?)',
  )
    .bind(uuid(), ctx.user.id, prompt, `${kind}:bulk(${recipients.length})`, result.provider, result.model, master, nowIso())
    .run();

  return json({ master, items, provider: result.provider, model: result.model });
}

export async function history(ctx: AuthContext, env: Env, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 20) || 20));
  const rows = (
    await env.DB.prepare(
      'SELECT id, prompt, kind, provider, model, result, created_at FROM ai_generations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    )
      .bind(ctx.user.id, limit)
      .all<{ id: string; prompt: string; kind: string; provider: string; model: string | null; result: string; created_at: string }>()
  ).results;
  return json({
    items: rows.map((r) => ({
      id: r.id,
      prompt: r.prompt,
      kind: r.kind,
      provider: r.provider,
      model: r.model,
      content: r.result,
      createdAt: r.created_at,
    })),
  });
}
