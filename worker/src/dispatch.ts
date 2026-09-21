/**
 * Message dispatch pipeline — shared by the send API (inline), the SMS_QUEUE
 * consumer (bulk + scheduled), and the cron reconciler.
 */

import { Env, DispatchJob } from './lib/env';
import {
  CampaignRow, MessageRow, RecipientJson, UserRow, UserSettingsRow,
} from './lib/rows';
import { nowIso, conflict, unprocessable } from './lib/http';
import { uuid } from './lib/crypto';
import { smsSegments, RecipientInput } from './lib/validate';
import { decryptSecret } from './lib/crypto';
import { sendSms, SmsCredentials } from './providers/sms';

export interface CreateMessagesInput {
  recipients: RecipientInput[];
  body: string;
  mediaUrl?: string | null;
  channel: 'sms' | 'whatsapp' | 'both';
  campaignId?: string;
  source: MessageRow['source'];
  aiGenerated?: boolean;
  templateId?: string | null;
  idempotencyKey?: string | null;
}

export interface CreateMessagesResult {
  messages: MessageRow[];
  skippedOptedOut: number;
  compliance: { footerAppended: boolean };
}

export async function getSettings(env: Env, userId: string): Promise<UserSettingsRow> {
  const row = await env.DB.prepare('SELECT * FROM user_settings WHERE user_id = ?').bind(userId).first<UserSettingsRow>();
  if (row) return row;
  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO user_settings (user_id, updated_at) VALUES (?, ?)`,
  ).bind(userId, now).run();
  return (await env.DB.prepare('SELECT * FROM user_settings WHERE user_id = ?').bind(userId).first<UserSettingsRow>())!;
}

export async function getDecryptedCredentials(
  env: Env,
  userId: string,
  kind: 'sms' | 'ai',
): Promise<SmsCredentials | (Record<string, unknown> & { provider: string }) | null> {
  const row = await env.DB.prepare('SELECT * FROM credentials WHERE user_id = ? AND kind = ?')
    .bind(userId, kind)
    .first<{ ciphertext: string; provider: string }>();
  if (!row) return null;
  const key = env.CREDENTIALS_ENCRYPTION_KEY;
  if (!key) throw new Error('CREDENTIALS_ENCRYPTION_KEY secret is not configured');
  const plain = await decryptSecret(row.ciphertext, key);
  return { provider: row.provider, ...JSON.parse(plain) } as Record<string, unknown> & { provider: string };
}

const STOP_RE = /\b(stop|unsubscribe|cancel|end|quit)\b/i;

/** Apply compliance footer rules. Returns possibly-modified body. */
export function applyCompliance(
  body: string,
  settings: UserSettingsRow,
): { body: string; footerAppended: boolean } {
  if (STOP_RE.test(body)) return { body, footerAppended: false };
  const wantsFooter = !!settings.opt_out_footer;
  const complianceForce = !!settings.compliance_check;
  if (wantsFooter || complianceForce) {
    const suffix = ' Reply STOP to unsubscribe.';
    return { body: body.trimEnd() + suffix, footerAppended: true };
  }
  return { body, footerAppended: false };
}

/**
 * Create message rows (status `queued`), enforcing quota + opt-outs.
 * Does NOT send — call dispatchMessages() for delivery.
 */
export async function createMessages(
  env: Env,
  user: UserRow,
  input: CreateMessagesInput,
): Promise<CreateMessagesResult> {
  const settings = await getSettings(env, user.id);
  const { body: finalBody, footerAppended } = applyCompliance(input.body, settings);

  // Filter opted-out contacts
  const contactIds = input.recipients.map((r) => r.contactId).filter(Boolean) as string[];
  const optedOut = new Set<string>();
  if (contactIds.length > 0) {
    const placeholders = contactIds.map(() => '?').join(',');
    const rows = await env.DB.prepare(
      `SELECT id FROM contacts WHERE user_id = ? AND opted_out = 1 AND id IN (${placeholders})`,
    )
      .bind(user.id, ...contactIds)
      .all<{ id: string }>();
    for (const r of rows.results) optedOut.add(r.id);
  }
  const recipients = input.recipients.filter((r) => !(r.contactId && optedOut.has(r.contactId)));
  const skippedOptedOut = input.recipients.length - recipients.length;
  if (recipients.length === 0) {
    throw unprocessable('All selected recipients have opted out of messages');
  }

  // Quota enforcement (atomic-ish via immediate re-read; single-writer per user in practice)
  const remaining = user.messages_quota - user.messages_used;
  if (recipients.length > remaining) {
    throw conflict(
      `Message quota exceeded: ${remaining} of ${user.messages_quota} remaining on your ${user.plan} plan`,
      { code: 'quota_exceeded', remaining, quota: user.messages_quota },
    );
  }

  // Idempotency: if a key is supplied and already used, return the original batch.
  // Stored keys are suffixed per recipient (`key:0`, `key:1`, …) to satisfy the unique index.
  if (input.idempotencyKey) {
    const existing = await env.DB.prepare(
      'SELECT * FROM messages WHERE user_id = ? AND (idempotency_key = ? OR idempotency_key LIKE ?)',
    )
      .bind(user.id, input.idempotencyKey, `${input.idempotencyKey}:%`)
      .all<MessageRow>();
    if (existing.results.length > 0) {
      return {
        messages: existing.results,
        skippedOptedOut,
        compliance: { footerAppended },
      };
    }
  }

  const now = nowIso();
  const channelDefault: 'sms' | 'whatsapp' = input.channel === 'whatsapp' ? 'whatsapp' : 'sms';
  const segments = smsSegments(finalBody).segments;
  const messages: MessageRow[] = [];

  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];
    const id = uuid();
    const row: MessageRow = {
      id,
      user_id: user.id,
      campaign_id: input.campaignId ?? null,
      channel: channelDefault,
      to_phone: r.phoneNumber,
      to_name: r.name ?? null,
      body: finalBody,
      media_url: input.mediaUrl ?? null,
      status: 'queued',
      provider: 'sandbox',
      provider_message_id: null,
      error: null,
      ai_generated: input.aiGenerated ? 1 : 0,
      template_id: input.templateId ?? null,
      source: input.source,
      segments,
      idempotency_key: input.idempotencyKey ? `${input.idempotencyKey}:${i}` : null,
      created_at: now,
      sent_at: null,
      delivered_at: null,
      updated_at: now,
    };
    await env.DB.prepare(
      `INSERT INTO messages (id, user_id, campaign_id, channel, to_phone, to_name, body, media_url, status,
         provider, provider_message_id, error, ai_generated, template_id, source, segments, idempotency_key,
         created_at, sent_at, delivered_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
      .bind(
        row.id, row.user_id, row.campaign_id, row.channel, row.to_phone, row.to_name, row.body, row.media_url,
        row.status, row.provider, row.provider_message_id, row.error, row.ai_generated, row.template_id,
        row.source, row.segments, row.idempotency_key, row.created_at, row.sent_at, row.delivered_at, row.updated_at,
      )
      .run();
    messages.push(row);
  }

  await env.DB.prepare('UPDATE users SET messages_used = messages_used + ?, updated_at = ? WHERE id = ?')
    .bind(messages.length, now, user.id)
    .run();

  return { messages, skippedOptedOut, compliance: { footerAppended } };
}

/** Enqueue message ids for async delivery via the SMS queue. */
export async function enqueueDispatch(
  env: Env,
  userId: string,
  messageIds: string[],
  campaignId?: string,
): Promise<void> {
  const BATCH = 25;
  for (let i = 0; i < messageIds.length; i += BATCH) {
    const job: DispatchJob = {
      kind: 'send-batch',
      userId,
      campaignId,
      messageIds: messageIds.slice(i, i + BATCH),
      attempt: 0,
    };
    await env.SMS_QUEUE.send(job);
  }
}

/**
 * Deliver a batch of queued messages through the configured SMS provider.
 * Used by the queue consumer and (for tiny immediate sends) inline by the API.
 */
export async function deliverMessages(env: Env, job: DispatchJob): Promise<void> {
  const { userId, messageIds, campaignId } = job;
  if (messageIds.length === 0) return;

  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRow>();
  if (!user) return;

  let creds: SmsCredentials | null = null;
  try {
    creds = (await getDecryptedCredentials(env, userId, 'sms')) as SmsCredentials | null;
  } catch (err) {
    console.error('Credential decryption failed:', err);
  }
  const providerName = creds?.provider || 'sandbox';
  // WhatsApp channel is sent through deep links on the client; server records it as delivered-manual.
  const placeholders = messageIds.map(() => '?').join(',');
  const rows = (
    await env.DB.prepare(
      `SELECT * FROM messages WHERE user_id = ? AND id IN (${placeholders}) AND status IN ('queued','sending')`,
    )
      .bind(userId, ...messageIds)
      .all<MessageRow>()
  ).results;

  let sent = 0;
  let failed = 0;

  for (const msg of rows) {
    const now = nowIso();
    await env.DB.prepare("UPDATE messages SET status = 'sending', updated_at = ? WHERE id = ?")
      .bind(now, msg.id)
      .run();

    if (msg.channel === 'whatsapp') {
      // WhatsApp is a manual/deep-link send from the client — no carrier API here.
      await env.DB.prepare(
        `UPDATE messages SET status = 'delivered', provider = 'whatsapp-deeplink', provider_message_id = ?,
           sent_at = ?, delivered_at = ?, updated_at = ? WHERE id = ?`,
      )
        .bind(`wa_${msg.id.slice(0, 8)}`, now, now, now, msg.id)
        .run();
      sent++;
      continue;
    }

    try {
      const result = await sendSms(creds, {
        to: msg.to_phone,
        body: msg.body,
        mediaUrl: msg.media_url,
        from: (creds?.from as string) || (creds?.senderId as string) || null,
        statusCallback: undefined, // set per-deployment below
      });
      const status = result.status === 'delivered' ? 'delivered' : result.status === 'failed' ? 'failed' : 'sent';
      const finalNow = nowIso();
      await env.DB.prepare(
        `UPDATE messages SET status = ?, provider = ?, provider_message_id = ?, error = ?,
           sent_at = ?, delivered_at = CASE WHEN ? = 'delivered' THEN ? ELSE delivered_at END, updated_at = ?
         WHERE id = ?`,
      )
        .bind(
          status,
          providerName,
          result.providerMessageId,
          status === 'failed' ? 'Provider reported failure' : null,
          finalNow,
          status,
          finalNow,
          finalNow,
          msg.id,
        )
        .run();
      if (status === 'failed') failed++;
      else sent++;
    } catch (err) {
      const finalNow = nowIso();
      const errorMsg = err instanceof Error ? err.message : 'Provider error';
      // Transient network errors get one delayed retry via the queue.
      const attempt = job.attempt ?? 0;
      const transient = /network|fetch|timeout|429|502|503|504/i.test(errorMsg);
      if (transient && attempt < 2) {
        await env.DB.prepare("UPDATE messages SET status = 'queued', error = ?, updated_at = ? WHERE id = ?")
          .bind(errorMsg, finalNow, msg.id)
          .run();
        await env.SMS_QUEUE.send({ ...job, messageIds: [msg.id], attempt: attempt + 1 }, { delaySeconds: 5 * (attempt + 1) });
        continue;
      }
      await env.DB.prepare(
        `UPDATE messages SET status = 'failed', provider = ?, error = ?, updated_at = ? WHERE id = ?`,
      )
        .bind(providerName, errorMsg, finalNow, msg.id)
        .run();
      failed++;
    }
  }

  if (campaignId) {
    await finalizeCampaign(env, campaignId, sent, failed);
  }
}

/** Update campaign counters and close out completed campaigns. */
export async function finalizeCampaign(
  env: Env,
  campaignId: string,
  sentDelta: number,
  failedDelta: number,
): Promise<void> {
  const now = nowIso();
  await env.DB.prepare(
    `UPDATE campaigns SET sent_count = sent_count + ?, failed_count = failed_count + ?, updated_at = ? WHERE id = ?`,
  )
    .bind(sentDelta, failedDelta, now, campaignId)
    .run();

  const campaign = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(campaignId).first<CampaignRow>();
  if (!campaign) return;

  const done = campaign.sent_count + campaign.failed_count;
  if (campaign.status === 'sending' && done >= campaign.total_recipients) {
    await env.DB.prepare(
      `UPDATE campaigns SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
    )
      .bind(campaign.failed_count >= campaign.total_recipients ? 'failed' : 'completed', now, now, campaignId)
      .run();
  }
}

/**
 * Dispatch a due campaign: create messages for each recipient and enqueue them.
 * Called by cron every minute; safe to call concurrently (status guard).
 */
export async function dispatchDueCampaign(env: Env, campaign: CampaignRow): Promise<number> {
  const claimed = await env.DB.prepare(
    `UPDATE campaigns SET status = 'sending', updated_at = ? WHERE id = ? AND status = 'scheduled'`,
  )
    .bind(nowIso(), campaign.id)
    .run();
  if ((claimed.meta.changes ?? 0) === 0) return 0; // already claimed by another invocation

  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(campaign.user_id).first<UserRow>();
  if (!user) return 0;

  let recipients: RecipientJson[] = [];
  try { recipients = JSON.parse(campaign.recipients || '[]'); } catch { recipients = []; }

  try {
    const result = await createMessages(env, user, {
      recipients: recipients.map((r) => ({ contactId: r.contactId, phoneNumber: r.phoneNumber, name: r.name })),
      body: campaign.body,
      mediaUrl: campaign.media_url,
      channel: campaign.channel,
      campaignId: campaign.id,
      source: 'scheduled',
      aiGenerated: !!campaign.ai_generated,
    });
    await env.DB.prepare('UPDATE campaigns SET total_recipients = ?, updated_at = ? WHERE id = ?')
      .bind(result.messages.length, nowIso(), campaign.id)
      .run();
    await enqueueDispatch(env, user.id, result.messages.map((m) => m.id), campaign.id);
    return result.messages.length;
  } catch (err) {
    console.error(`Campaign ${campaign.id} dispatch failed:`, err);
    await env.DB.prepare(
      `UPDATE campaigns SET status = 'failed', completed_at = ?, updated_at = ? WHERE id = ?`,
    )
      .bind(nowIso(), nowIso(), campaign.id)
      .run();
    return 0;
  }
}
