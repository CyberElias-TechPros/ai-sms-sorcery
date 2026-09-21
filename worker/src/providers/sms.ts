/**
 * SMS provider adapters.
 *
 * Real providers (Twilio, Vonage, Infobip, Termii, custom webhook) are called with
 * the user's own credentials (decrypted server-side). The built-in `sandbox`
 * provider is the default: it deterministically simulates a carrier so every
 * send/delivery happy path works before real keys are configured.
 */

export interface SmsCredentials {
  provider: string;
  [key: string]: unknown;
}

export interface SmsSendRequest {
  to: string;
  body: string;
  mediaUrl?: string | null;
  from?: string | null;
  /** Provider status callback URL (Twilio et al.) */
  statusCallback?: string;
}

export interface SmsSendResult {
  providerMessageId: string;
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed';
  raw?: unknown;
}

export const SMS_PROVIDERS = ['sandbox', 'twilio', 'vonage', 'infobip', 'termii', 'custom'] as const;
export type SmsProviderName = (typeof SMS_PROVIDERS)[number];

export async function sendSms(
  credentials: SmsCredentials | null,
  req: SmsSendRequest,
): Promise<SmsSendResult> {
  const provider = (credentials?.provider || 'sandbox') as SmsProviderName;
  switch (provider) {
    case 'twilio':
      return sendTwilio(credentials!, req);
    case 'vonage':
      return sendVonage(credentials!, req);
    case 'infobip':
      return sendInfobip(credentials!, req);
    case 'termii':
      return sendTermii(credentials!, req);
    case 'custom':
      return sendCustom(credentials!, req);
    case 'sandbox':
    default:
      return sendSandbox(req);
  }
}

/** Test stored credentials against the provider (best-effort per provider). */
export async function testSmsCredentials(credentials: SmsCredentials): Promise<{ ok: boolean; message: string }> {
  const provider = credentials.provider as SmsProviderName;
  try {
    switch (provider) {
      case 'twilio': {
        const sid = String(credentials.accountSid || '');
        const token = String(credentials.authToken || '');
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}.json`, {
          headers: { authorization: 'Basic ' + btoa(`${sid}:${token}`) },
        });
        return res.ok
          ? { ok: true, message: 'Twilio credentials verified' }
          : { ok: false, message: `Twilio rejected credentials (HTTP ${res.status})` };
      }
      case 'vonage': {
        const res = await fetch('https://rest.nexmo.com/account/get-balance', {
          headers: { authorization: 'Basic ' + btoa(`${credentials.apiKey}:${credentials.apiSecret}`) },
        });
        return res.ok
          ? { ok: true, message: 'Vonage credentials verified' }
          : { ok: false, message: `Vonage rejected credentials (HTTP ${res.status})` };
      }
      case 'infobip': {
        const base = normalizeBaseUrl(String(credentials.baseUrl || 'https://api.infobip.com'));
        const res = await fetch(`${base}/account/1/balance`, {
          headers: { authorization: `App ${credentials.apiKey}` },
        });
        return res.ok
          ? { ok: true, message: 'Infobip credentials verified' }
          : { ok: false, message: `Infobip rejected credentials (HTTP ${res.status})` };
      }
      case 'termii': {
        const res = await fetch(
          `https://api.termii.com/api/get/balance?api_key=${encodeURIComponent(String(credentials.apiKey))}`,
        );
        const body = (await res.json().catch(() => ({}))) as { balance?: unknown };
        return res.ok && body.balance !== undefined
          ? { ok: true, message: `Termii verified — balance ${body.balance}` }
          : { ok: false, message: `Termii rejected credentials (HTTP ${res.status})` };
      }
      case 'custom': {
        return credentials.endpoint
          ? { ok: true, message: 'Custom webhook endpoint saved' }
          : { ok: false, message: 'Custom provider requires an endpoint URL' };
      }
      case 'sandbox':
      default:
        return { ok: true, message: 'Sandbox provider ready — messages are simulated end-to-end' };
    }
  } catch (err) {
    return { ok: false, message: `Connection failed: ${err instanceof Error ? err.message : 'network error'}` };
  }
}

function normalizeBaseUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') throw new Error('Provider base URL must use https');
    return u.origin;
  } catch {
    throw new Error('Invalid provider base URL');
  }
}

// ─────────────────────────── sandbox ───────────────────────────

async function sendSandbox(req: SmsSendRequest): Promise<SmsSendResult> {
  // Deterministic pseudo-id derived from destination + timestamp keeps logs stable in tests.
  const seed = [...`${req.to}:${Date.now()}`].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const id = `sb_${seed.toString(36)}${Date.now().toString(36)}`;
  // Numbers with an odd final digit simulate a carrier rejection — exercises the
  // failed-message path in the UI without any real keys. Everything else delivers.
  const lastDigit = Number(req.to.slice(-1));
  const willFail = Number.isFinite(lastDigit) && lastDigit % 2 === 1;
  if (willFail) {
    return {
      providerMessageId: id,
      status: 'failed',
      raw: { sandbox: true, simulatedFailure: true, reason: 'Simulated carrier rejection (sandbox)' },
    };
  }
  return {
    providerMessageId: id,
    status: 'delivered',
    raw: { sandbox: true, simulatedFailure: false },
  };
}

// ─────────────────────────── twilio ───────────────────────────

async function sendTwilio(creds: SmsCredentials, req: SmsSendRequest): Promise<SmsSendResult> {
  const sid = String(creds.accountSid || '');
  const token = String(creds.authToken || '');
  const from = String(req.from || creds.from || creds.senderId || '');
  if (!sid || !token || !from) throw new Error('Twilio requires accountSid, authToken and a from number');

  const form = new URLSearchParams({ To: req.to, From: from, Body: req.body });
  if (req.mediaUrl) form.set('MediaUrl', req.mediaUrl);
  if (req.statusCallback) form.set('StatusCallback', req.statusCallback);

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: 'POST',
    headers: {
      authorization: 'Basic ' + btoa(`${sid}:${token}`),
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: form,
  });
  const body = (await res.json().catch(() => ({}))) as { sid?: string; status?: string; message?: string };
  if (!res.ok) throw new Error(body.message || `Twilio error HTTP ${res.status}`);
  return {
    providerMessageId: body.sid || 'unknown',
    status: mapTwilioStatus(body.status),
    raw: body,
  };
}

function mapTwilioStatus(status?: string): SmsSendResult['status'] {
  switch (status) {
    case 'delivered': return 'delivered';
    case 'sent':
    case 'queued':
    case 'accepted':
    case 'scheduled': return 'sent';
    case 'failed':
    case 'undelivered': return 'failed';
    default: return 'sending';
  }
}

// ─────────────────────────── vonage (nexmo) ───────────────────────────

async function sendVonage(creds: SmsCredentials, req: SmsSendRequest): Promise<SmsSendResult> {
  const apiKey = String(creds.apiKey || '');
  const apiSecret = String(creds.apiSecret || '');
  const from = String(req.from || creds.from || creds.senderId || 'SMS Sorcery');
  if (!apiKey || !apiSecret) throw new Error('Vonage requires apiKey and apiSecret');

  const res = await fetch('https://rest.nexmo.com/sms/json', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      api_secret: apiSecret,
      from,
      to: req.to.replace(/^\+/, ''),
      text: req.body,
      ...(req.statusCallback ? { status_report_req: 1, callback: req.statusCallback } : {}),
    }),
  });
  const body = (await res.json()) as { messages?: Array<{ status?: string; message_id?: string; 'error-text'?: string }> };
  const msg = body.messages?.[0];
  if (!msg || (msg.status && msg.status !== '0')) {
    throw new Error(msg?.['error-text'] || `Vonage error HTTP ${res.status}`);
  }
  return { providerMessageId: msg.message_id || 'unknown', status: 'sent', raw: body };
}

// ─────────────────────────── infobip ───────────────────────────

async function sendInfobip(creds: SmsCredentials, req: SmsSendRequest): Promise<SmsSendResult> {
  const apiKey = String(creds.apiKey || '');
  const base = normalizeBaseUrl(String(creds.baseUrl || 'https://api.infobip.com'));
  const from = String(req.from || creds.from || creds.senderId || 'SMS Sorcery');
  if (!apiKey) throw new Error('Infobip requires an API key');

  const res = await fetch(`${base}/sms/2/text/advanced`, {
    method: 'POST',
    headers: { authorization: `App ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from,
      destinations: [{ to: req.to }],
      text: req.body,
      ...(req.mediaUrl ? { mediaUrl: [req.mediaUrl] } : {}),
      notifyUrl: req.statusCallback,
    }),
  });
  const body = (await res.json()) as { messages?: Array<{ messageId?: string; status?: { name?: string; groupName?: string } }> };
  const msg = body.messages?.[0];
  if (!res.ok || !msg?.messageId) {
    throw new Error(`Infobip error HTTP ${res.status}`);
  }
  const groupName = msg.status?.groupName;
  return {
    providerMessageId: String(msg.messageId),
    status: groupName === 'DELIVERED' ? 'delivered' : groupName === 'UNDELIVERABLE' || groupName === 'REJECTED' ? 'failed' : 'sent',
    raw: body,
  };
}

// ─────────────────────────── termii ───────────────────────────

async function sendTermii(creds: SmsCredentials, req: SmsSendRequest): Promise<SmsSendResult> {
  const apiKey = String(creds.apiKey || '');
  const from = String(req.from || creds.from || creds.senderId || 'SMS Sorcery');
  const channel = String(creds.channel || 'generic');
  if (!apiKey) throw new Error('Termii requires an API key');

  const res = await fetch('https://api.termii.com/api/sms/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      to: req.to,
      from,
      sms: req.body,
      type: 'plain',
      channel,
    }),
  });
  const body = (await res.json()) as { message_id?: string; message?: string; code?: string };
  if (!res.ok || body.code === 'ok' || body.message_id) {
    if (body.message_id) return { providerMessageId: body.message_id, status: 'sent', raw: body };
  }
  throw new Error(body.message || `Termii error HTTP ${res.status}`);
}

// ─────────────────────────── custom webhook ───────────────────────────

async function sendCustom(creds: SmsCredentials, req: SmsSendRequest): Promise<SmsSendResult> {
  const endpoint = String(creds.endpoint || '');
  if (!endpoint) throw new Error('Custom provider requires an endpoint URL');
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error('Custom provider endpoint is not a valid URL');
  }
  if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    throw new Error('Custom provider endpoint must use https');
  }
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (creds.authHeader) headers.authorization = String(creds.authHeader);

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ to: req.to, body: req.body, mediaUrl: req.mediaUrl ?? null }),
  });
  const body = (await res.json().catch(() => ({}))) as { id?: string; messageId?: string; status?: string };
  if (!res.ok) throw new Error(`Custom provider error HTTP ${res.status}`);
  return {
    providerMessageId: String(body.id || body.messageId || `custom_${Date.now()}`),
    status: body.status === 'delivered' ? 'delivered' : body.status === 'failed' ? 'failed' : 'sent',
    raw: body,
  };
}
