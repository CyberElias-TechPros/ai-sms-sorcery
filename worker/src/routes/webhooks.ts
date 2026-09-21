/**
 * Provider webhooks: delivery-status callbacks (Twilio & generic).
 * Verified via HMAC signature when WEBHOOK_SIGNING_SECRET is configured
 * (Twilio `X-Twilio-Signature` scheme), otherwise accepted for sandbox flows.
 */

import { Env } from '../lib/env';
import { json, readJson, notFound, badRequest, nowIso } from '../lib/http';
import { sha256Hex } from '../lib/crypto';
import { MessageRow } from '../lib/rows';

const STATUS_MAP: Record<string, MessageRow['status']> = {
  delivered: 'delivered',
  sent: 'sent',
  queued: 'sent',
  sending: 'sending',
  failed: 'failed',
  undelivered: 'failed',
  read: 'delivered',
};

export async function twilioStatus(env: Env, request: Request, params: Record<string, string>): Promise<Response> {
  const form = await request.formData().catch(() => null);
  const body: Record<string, string> = {};
  if (form) {
    form.forEach((v, k) => { body[k] = String(v); });
  } else {
    const parsed = await readJson<Record<string, unknown>>(request);
    for (const [k, v] of Object.entries(parsed)) body[k] = String(v);
  }

  // Optional signature verification (Twilio HMAC-SHA1 scheme reduced to constant compare).
  const secret = env.WEBHOOK_SIGNING_SECRET;
  if (secret) {
    const sig = request.headers.get('x-twilio-signature');
    if (!sig || !(await verifyTwilioSignature(request, secret, sig, body))) {
      throw badRequest('Invalid webhook signature');
    }
  }

  const messageId = params.messageId || body.messageId || body.id;
  const statusRaw = (body.status || body.MessageStatus || '').toLowerCase();
  const status = STATUS_MAP[statusRaw];
  if (!messageId || !status) {
    throw badRequest('Missing messageId or status');
  }

  const row = await env.DB.prepare('SELECT * FROM messages WHERE provider_message_id = ? OR id = ?')
    .bind(messageId, messageId)
    .first<MessageRow>();
  if (!row) throw notFound('Unknown message');

  const now = nowIso();
  await env.DB.prepare(
    `UPDATE messages SET status = ?, error = ?, delivered_at = CASE WHEN ? = 'delivered' THEN ? ELSE delivered_at END, updated_at = ?
     WHERE id = ?`,
  )
    .bind(status, body.ErrorCode || body.error || null, status, now, now, row.id)
    .run();

  return json({ ok: true });
}

/** Generic webhook: POST { messageId | providerMessageId, status, error? } */
export async function genericStatus(env: Env, request: Request): Promise<Response> {
  const body = await readJson<{ messageId?: string; providerMessageId?: string; status?: string; error?: string }>(request);
  const messageId = body.messageId || body.providerMessageId;
  const status = STATUS_MAP[(body.status || '').toLowerCase()];
  if (!messageId || !status) throw badRequest('messageId and status are required');

  const row = await env.DB.prepare('SELECT * FROM messages WHERE provider_message_id = ? OR id = ?')
    .bind(messageId, messageId)
    .first<MessageRow>();
  if (!row) throw notFound('Unknown message');

  const now = nowIso();
  await env.DB.prepare(
    `UPDATE messages SET status = ?, error = ?, delivered_at = CASE WHEN ? = 'delivered' THEN ? ELSE delivered_at END, updated_at = ?
     WHERE id = ?`,
  )
    .bind(status, body.error ?? null, status, now, now, row.id)
    .run();
  return json({ ok: true });
}

/**
 * Twilio signature: HMAC-SHA1(authToken, url + sorted POST params), base64.
 * Uses SHA-1 via WebCrypto — acceptable here strictly for third-party signature compat.
 */
async function verifyTwilioSignature(
  request: Request,
  authToken: string,
  signature: string,
  params: Record<string, string>,
): Promise<boolean> {
  const url = request.url;
  const sorted = Object.keys(params).sort().map((k) => k + params[k]).join('');
  const data = url + sorted;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)));
  const expected = btoa(String.fromCharCode(...mac));
  // Constant-time compare
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

export { sha256Hex };
