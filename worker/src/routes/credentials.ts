/**
 * Provider credentials: store AES-GCM-encrypted at rest, return masked views only.
 */

import { Env } from '../lib/env';
import { json, readJson, badRequest, notFound, serverError } from '../lib/http';
import { uuid, encryptSecret, decryptSecret } from '../lib/crypto';
import { asString, asEnum } from '../lib/validate';
import { AuthContext } from '../lib/auth';
import { CredentialRow, publicCredential } from '../lib/rows';
import { testSmsCredentials, SMS_PROVIDERS, SmsCredentials } from '../providers/sms';
import { testAiCredentials, AI_PROVIDERS, AiCredentials } from '../providers/ai';

const SECRET_FIELDS: Record<string, string[]> = {
  sms: ['apiKey', 'apiSecret', 'authToken', 'accountSid', 'authHeader'],
  ai: ['apiKey'],
};

const META_FIELDS: Record<string, string[]> = {
  sms: ['senderId', 'from', 'baseUrl', 'endpoint', 'channel'],
  ai: ['model', 'temperature', 'maxTokens'],
};

export async function listCredentials(ctx: AuthContext, env: Env): Promise<Response> {
  const rows = (
    await env.DB.prepare('SELECT * FROM credentials WHERE user_id = ?').bind(ctx.user.id).all<CredentialRow>()
  ).results;

  // Provide maskedKey in meta for the UI without exposing secret values.
  const items = await Promise.all(
    rows.map(async (row) => {
      const view = publicCredential(row);
      try {
        const key = requireKey(env);
        const plain = JSON.parse(await decryptSecret(row.ciphertext, key)) as Record<string, unknown>;
        const firstSecret = SECRET_FIELDS[row.kind].map((f) => plain[f]).find((v) => typeof v === 'string' && v);
        const secretStr = String(firstSecret || '');
        view.maskedKey = secretStr.length > 8 ? `${secretStr.slice(0, 3)}••••••••${secretStr.slice(-4)}` : '••••••••';
      } catch {
        view.maskedKey = '••••••••';
      }
      return view;
    }),
  );

  return json({
    items,
    available: { sms: SMS_PROVIDERS, ai: AI_PROVIDERS },
  });
}

export async function upsertCredential(ctx: AuthContext, env: Env, request: Request): Promise<Response> {
  const body = await readJson(request);
  const kind = asEnum(body.kind, ['sms', 'ai'] as const, 'kind');
  const provider = asString(body.provider, 'provider', { max: 40 });
  const allowed = kind === 'sms' ? SMS_PROVIDERS : AI_PROVIDERS;
  if (!(allowed as readonly string[]).includes(provider)) {
    throw badRequest(`Unknown ${kind} provider: ${provider}`);
  }

  // Assemble config from secret + meta fields; secrets encrypted, meta stored in clear.
  const config: Record<string, unknown> = {};
  const meta: Record<string, unknown> = { provider };
  for (const field of SECRET_FIELDS[kind]) {
    if (body[field] !== undefined && body[field] !== '') {
      if (typeof body[field] !== 'string' || (body[field] as string).length > 2000) {
        throw badRequest(`${field} is invalid`);
      }
      config[field] = body[field];
    }
  }
  for (const field of META_FIELDS[kind]) {
    if (body[field] !== undefined && body[field] !== '') {
      meta[field] = typeof body[field] === 'string' ? (body[field] as string).slice(0, 500) : body[field];
      config[field] = meta[field];
    }
  }
  // Allow sending-from override commonly used across providers:
  if (body.from !== undefined) {
    meta.from = String(body.from).slice(0, 64);
    config.from = meta.from;
  }
  if (body.senderId !== undefined) {
    meta.senderId = String(body.senderId).slice(0, 64);
    config.senderId = meta.senderId;
  }
  if (kind === 'ai') {
    if (body.enableAiIntegration !== undefined) meta.enableAiIntegration = !!body.enableAiIntegration;
  }

  // Merge with existing secrets so a partial update never wipes a stored key.
  const existing = await env.DB.prepare('SELECT * FROM credentials WHERE user_id = ? AND kind = ?')
    .bind(ctx.user.id, kind)
    .first<CredentialRow>();
  if (existing) {
    try {
      const key = requireKey(env);
      const oldPlain = JSON.parse(await decryptSecret(existing.ciphertext, key)) as Record<string, unknown>;
      for (const field of SECRET_FIELDS[kind]) {
        if (config[field] === undefined && oldPlain[field] !== undefined) config[field] = oldPlain[field];
      }
      config.provider = provider;
    } catch {
      // If decryption fails we can only replace wholesale.
    }
  }

  if (kind === 'sms' && provider !== 'sandbox' && provider !== 'custom') {
    if (!config.apiKey && !config.authToken) {
      throw badRequest('An API key (or auth token) is required for this provider');
    }
  }

  const key = requireKey(env);
  const ciphertext = await encryptSecret(JSON.stringify(config), key);
  const now = new Date().toISOString();

  if (existing) {
    await env.DB.prepare(
      'UPDATE credentials SET provider=?, ciphertext=?, meta=?, updated_at=? WHERE id=?',
    )
      .bind(provider, ciphertext, JSON.stringify(meta), now, existing.id)
      .run();
  } else {
    await env.DB.prepare(
      'INSERT INTO credentials (id, user_id, kind, provider, ciphertext, meta, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)',
    )
      .bind(uuid(), ctx.user.id, kind, provider, ciphertext, JSON.stringify(meta), now, now)
      .run();
  }

  const row = (await env.DB.prepare('SELECT * FROM credentials WHERE user_id = ? AND kind = ?')
    .bind(ctx.user.id, kind)
    .first<CredentialRow>())!;
  return json({ ...publicCredential(row), maskedKey: '••••••••' });
}

export async function deleteCredential(ctx: AuthContext, env: Env, params: Record<string, string>): Promise<Response> {
  const existing = await env.DB.prepare('SELECT * FROM credentials WHERE id = ? AND user_id = ?')
    .bind(params.id, ctx.user.id)
    .first<CredentialRow>();
  if (!existing) throw notFound('Credential not found');
  await env.DB.prepare('DELETE FROM credentials WHERE id = ? AND user_id = ?').bind(existing.id, ctx.user.id).run();
  return json({ ok: true });
}

export async function testCredential(ctx: AuthContext, env: Env, request: Request): Promise<Response> {
  const body = await readJson(request);
  const kind = asEnum(body.kind, ['sms', 'ai'] as const, 'kind');

  // Test either the saved credential (default) or an unsaved draft from the form.
  let config: (SmsCredentials & AiCredentials) | null = null;
  if (body.draft && typeof body.draft === 'object') {
    config = { provider: String((body.draft as Record<string, unknown>).provider || 'sandbox'), ...(body.draft as Record<string, unknown>) } as never;
  } else {
    const row = await env.DB.prepare('SELECT * FROM credentials WHERE user_id = ? AND kind = ?')
      .bind(ctx.user.id, kind)
      .first<CredentialRow>();
    if (!row) {
      return json(kind === 'sms'
        ? { ok: true, message: 'Sandbox provider ready — messages are simulated end-to-end' }
        : { ok: true, message: 'Sorcery engine ready — no API key required' });
    }
    const key = requireKey(env);
    config = { provider: row.provider, ...JSON.parse(await decryptSecret(row.ciphertext, key)) } as never;
  }

  const result = kind === 'sms'
    ? await testSmsCredentials(config as SmsCredentials)
    : await testAiCredentials(config as AiCredentials);
  return json(result);
}

function requireKey(env: Env): string {
  if (!env.CREDENTIALS_ENCRYPTION_KEY) {
    throw serverError('Server is missing CREDENTIALS_ENCRYPTION_KEY — ask the operator to set the secret');
  }
  return env.CREDENTIALS_ENCRYPTION_KEY;
}
