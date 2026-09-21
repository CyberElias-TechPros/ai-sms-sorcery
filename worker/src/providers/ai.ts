/**
 * AI message-generation adapters.
 *
 * Real providers (OpenAI, Anthropic, Google Gemini, Cohere) are called with the
 * user's own key. The built-in `sorcery` engine needs no key: a deterministic,
 * high-quality composer that guarantees the AI happy path everywhere while
 * producing genuinely usable SMS copy (structure, length, CTA, compliance).
 */

export interface AiCredentials {
  provider: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: unknown;
}

export interface AiGenerateRequest {
  prompt: string;
  kind: string; // marketing | reminder | notification | alert | other
  maxLength: number;
  audience?: string;
  tone?: string;
  variants?: number;
}

export interface AiGenerateResult {
  provider: string;
  model: string;
  texts: string[];
}

export const AI_PROVIDERS = ['sorcery', 'openai', 'anthropic', 'google', 'cohere'] as const;
export type AiProviderName = (typeof AI_PROVIDERS)[number];

const SYSTEM_PROMPT = `You are Sorcery, an expert SMS copywriter. Write a single ready-to-send text message.
Rules: plain text only, no subject line, no quotes around the message, respect the max length,
include exactly one clear call to action when appropriate, and end promotional/marketing messages
with an opt-out phrase like "Reply STOP to unsubscribe". Be warm, concrete, and specific.`;

export async function generateMessage(
  credentials: AiCredentials | null,
  req: AiGenerateRequest,
): Promise<AiGenerateResult> {
  const provider = (credentials?.provider || 'sorcery') as AiProviderName;
  const count = Math.min(Math.max(req.variants || 1, 1), 5);
  switch (provider) {
    case 'openai':
      return generateOpenAI(credentials!, req, count);
    case 'anthropic':
      return generateAnthropic(credentials!, req, count);
    case 'google':
      return generateGoogle(credentials!, req, count);
    case 'cohere':
      return generateCohere(credentials!, req, count);
    case 'sorcery':
    default:
      return generateSorcery(req, count);
  }
}

export async function testAiCredentials(credentials: AiCredentials): Promise<{ ok: boolean; message: string }> {
  const provider = credentials.provider as AiProviderName;
  if (provider === 'sorcery') {
    return { ok: true, message: 'Sorcery engine ready — no API key required' };
  }
  try {
    // A minimal 1-token completion is the most portable verification across providers.
    const probe: AiGenerateRequest = { prompt: 'Reply with the single word: ok', kind: 'other', maxLength: 16, variants: 1 };
    const result = await generateMessage(credentials, probe);
    return result.texts.length > 0
      ? { ok: true, message: `${provider} credentials verified (model: ${result.model})` }
      : { ok: false, message: `${provider} returned no output` };
  } catch (err) {
    return { ok: false, message: `Connection failed: ${err instanceof Error ? err.message : 'network error'}` };
  }
}

function truncate(text: string, max: number): string {
  const t = text.trim();
  return t.length <= max ? t : t.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
}

// ─────────────────────────── sorcery (local, key-free) ───────────────────────────

const OPENERS: Record<string, string[]> = {
  marketing: ['Big news, {name}!', 'This one’s for you, {name}:', '{name}, your perk just landed.'],
  reminder: ['Quick reminder, {name}:', '{name}, a gentle heads-up:', 'Hi {name} — don’t forget:'],
  notification: ['Update for you, {name}:', '{name}, here’s the latest:', 'Hi {name} — good news:'],
  alert: ['Important, {name}:', '{name}, please note:', 'Heads up, {name}:'],
  other: ['Hi {name}:', 'Hello {name} —', '{name},'],
};

const CTAS: Record<string, string[]> = {
  marketing: ['Tap to claim it before it’s gone.', 'Reply YES to grab your offer.', 'Shop now and save today.'],
  reminder: ['Reply CONFIRM to lock it in or RESCHEDULE to move it.', 'See you soon!', 'Reply YES to confirm.'],
  notification: ['We’ll keep you posted every step of the way.', 'Reply INFO if you need anything.', 'You’re all set.'],
  alert: ['Reply HELP for immediate assistance.', 'Please secure your account now.', 'Act now to stay safe.'],
  other: ['Reply and let us know.', 'Reach out any time.', 'Thanks for being with us.'],
};

const FRAMES: Record<string, string[]> = {
  marketing: [
    'Just dropped: {topic}. For a limited time you get exclusive early access — no strings attached.',
    'Your invite is live: {topic}. Claim it before the clock runs out and tell a friend.',
    'We saved the best for you — {topic}. It won’t last long at this price.',
  ],
  reminder: [
    '{topic} is coming up soon. A quick reply keeps everything on track.',
    'This is your scheduled nudge about {topic} — taking a moment now saves a scramble later.',
    'Friendly nudge: {topic}. If anything changed, you can fix it in one tap.',
  ],
  notification: [
    '{topic} just happened and everything is on track. Full details are waiting for you.',
    'Status update: {topic}. Nothing is needed from you — we simply wanted to keep you in the loop.',
    '{topic} is confirmed. You can relax; we’ll handle the rest.',
  ],
  alert: [
    '{topic} needs your attention right now. Please review it as soon as you can.',
    'We noticed {topic}. If this wasn’t you, act immediately to stay protected.',
    'Urgent: {topic}. Please respond promptly to avoid any interruption.',
  ],
  other: [
    '{topic}.',
    'Wanted to share: {topic}.',
    'A quick note about {topic}.',
  ],
};

function pick<T>(list: T[], seed: number): T {
  return list[Math.abs(seed) % list.length];
}

function extractTopic(prompt: string): string {
  let p = prompt.trim().replace(/\s+/g, ' ');
  p = p.replace(/^(create|write|draft|compose|generate|make|send)\s+(a|an|the|my)?\s*/i, '');
  p = p.replace(/^(sms|text|message|short message)\s*(message|copy)?\s*(for|to|about|on)?\s*/i, '');
  p = p.replace(/^(promotional message|marketing message|reminder message|notification message|alert message)\s*(for|to|about|on)?\s*/i, '');
  p = p.replace(/[.!?]+$/, '');
  if (p.length > 220) p = p.slice(0, 220).trimEnd();
  return p || 'our latest update';
}

function complianceSuffix(kind: string): string {
  return kind === 'marketing' ? ' Reply STOP to unsubscribe.' : '';
}

function generateSorcery(req: AiGenerateRequest, count: number): AiGenerateResult {
  const kind = (req.kind in FRAMES ? req.kind : 'other') as keyof typeof FRAMES;
  const topic = extractTopic(req.prompt);
  const seedBase = [...req.prompt].reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 11);
  const texts: string[] = [];
  for (let i = 0; i < count; i++) {
    const seed = seedBase + i * 7919;
    const opener = pick(OPENERS[kind], seed).replace('{name}', '{name}');
    const frame = pick(FRAMES[kind], seed).replace('{topic}', topic);
    const cta = pick(CTAS[kind], seed);
    const suffix = complianceSuffix(kind);
    let text = `${opener} ${frame} ${cta}${suffix}`;
    text = text.replace(/\s+/g, ' ').trim();
    text = truncate(text, req.maxLength);
    texts.push(text);
  }
  return { provider: 'sorcery', model: 'sorcery-sms-1', texts };
}

// ─────────────────────────── openai ───────────────────────────

async function generateOpenAI(creds: AiCredentials, req: AiGenerateRequest, count: number): Promise<AiGenerateResult> {
  const apiKey = String(creds.apiKey || '');
  if (!apiKey) throw new Error('OpenAI requires an API key');
  const model = String(creds.model || 'gpt-4o-mini');
  const texts: string[] = [];
  for (let i = 0; i < count; i++) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: Number(creds.temperature ?? 0.8),
        max_tokens: Number(creds.maxTokens ?? 200),
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Message kind: ${req.kind}\nMax length: ${req.maxLength} characters\n${
              req.audience ? `Audience: ${req.audience}\n` : ''
            }${req.tone ? `Tone: ${req.tone}\n` : ''}Brief: ${req.prompt}`,
          },
        ],
      }),
    });
    const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
    if (!res.ok) throw new Error(body.error?.message || `OpenAI error HTTP ${res.status}`);
    const text = body.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('OpenAI returned an empty message');
    texts.push(truncate(text.replace(/^["'\s]+|["'\s]+$/g, ''), req.maxLength));
  }
  return { provider: 'openai', model, texts };
}

// ─────────────────────────── anthropic ───────────────────────────

async function generateAnthropic(creds: AiCredentials, req: AiGenerateRequest, count: number): Promise<AiGenerateResult> {
  const apiKey = String(creds.apiKey || '');
  if (!apiKey) throw new Error('Anthropic requires an API key');
  const model = String(creds.model || 'claude-3-5-haiku-latest');
  const texts: string[] = [];
  for (let i = 0; i < count; i++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: Number(creds.maxTokens ?? 200),
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Message kind: ${req.kind}\nMax length: ${req.maxLength} characters\nBrief: ${req.prompt}`,
          },
        ],
      }),
    });
    const body = (await res.json()) as { content?: Array<{ text?: string }>; error?: { message?: string } };
    if (!res.ok) throw new Error(body.error?.message || `Anthropic error HTTP ${res.status}`);
    const text = body.content?.[0]?.text?.trim();
    if (!text) throw new Error('Anthropic returned an empty message');
    texts.push(truncate(text.replace(/^["'\s]+|["'\s]+$/g, ''), req.maxLength));
  }
  return { provider: 'anthropic', model, texts };
}

// ─────────────────────────── google gemini ───────────────────────────

async function generateGoogle(creds: AiCredentials, req: AiGenerateRequest, count: number): Promise<AiGenerateResult> {
  const apiKey = String(creds.apiKey || '');
  if (!apiKey) throw new Error('Google Gemini requires an API key');
  const model = String(creds.model || 'gemini-1.5-flash');
  const texts: string[] = [];
  for (let i = 0; i < count; i++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Message kind: ${req.kind}\nMax length: ${req.maxLength} characters\nBrief: ${req.prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: Number(creds.temperature ?? 0.8),
            maxOutputTokens: Number(creds.maxTokens ?? 200),
          },
        }),
      },
    );
    const body = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };
    if (!res.ok) throw new Error(body.error?.message || `Gemini error HTTP ${res.status}`);
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error('Gemini returned an empty message');
    texts.push(truncate(text.replace(/^["'\s]+|["'\s]+$/g, ''), req.maxLength));
  }
  return { provider: 'google', model, texts };
}

// ─────────────────────────── cohere ───────────────────────────

async function generateCohere(creds: AiCredentials, req: AiGenerateRequest, count: number): Promise<AiGenerateResult> {
  const apiKey = String(creds.apiKey || '');
  if (!apiKey) throw new Error('Cohere requires an API key');
  const model = String(creds.model || 'command-r');
  const texts: string[] = [];
  for (let i = 0; i < count; i++) {
    const res = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: Number(creds.temperature ?? 0.8),
        max_tokens: Number(creds.maxTokens ?? 200),
        preamble: SYSTEM_PROMPT,
        message: `Message kind: ${req.kind}\nMax length: ${req.maxLength} characters\nBrief: ${req.prompt}`,
      }),
    });
    const body = (await res.json()) as { text?: string; message?: string };
    if (!res.ok) throw new Error(body.message || `Cohere error HTTP ${res.status}`);
    const text = body.text?.trim();
    if (!text) throw new Error('Cohere returned an empty message');
    texts.push(truncate(text.replace(/^["'\s]+|["'\s]+$/g, ''), req.maxLength));
  }
  return { provider: 'cohere', model, texts };
}

/** Personalize {{name}}-style variables for bulk generation. */
export function personalize(text: string, vars: Record<string, string | undefined>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}|\{(\w+)\}/g, (whole, a, b) => {
    const key = (a || b || '').toLowerCase();
    const map: Record<string, string | undefined> = {
      name: vars.name,
      first_name: vars.name?.split(' ')[0],
      phone: vars.phone,
    };
    return map[key] ?? whole;
  });
}
