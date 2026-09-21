/**
 * Shared row shapes for D1 tables (mirrors worker/migrations/0001_init.sql).
 */

export interface UserRow {
  id: string;
  email: string;
  email_lower: string;
  password_hash: string;
  password_salt: string;
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

export interface ContactRow {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
  email: string | null;
  group_name: string | null;
  tags: string;
  notes: string | null;
  opted_out: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  model: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  media_url: string | null;
  channel: 'sms' | 'whatsapp' | 'both';
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'cancelled' | 'failed';
  scheduled_at: string | null;
  recipients: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  ai_generated: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface MessageRow {
  id: string;
  user_id: string;
  campaign_id: string | null;
  channel: 'sms' | 'whatsapp';
  to_phone: string;
  to_name: string | null;
  body: string;
  media_url: string | null;
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  provider: string;
  provider_message_id: string | null;
  error: string | null;
  ai_generated: number;
  template_id: string | null;
  source: 'composer' | 'scheduled' | 'resend' | 'api' | 'bulk';
  segments: number;
  idempotency_key: string | null;
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
  updated_at: string;
}

export interface CredentialRow {
  id: string;
  user_id: string;
  kind: 'sms' | 'ai';
  provider: string;
  ciphertext: string;
  meta: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettingsRow {
  user_id: string;
  email_notifications: number;
  sms_notifications: number;
  browser_notifications: number;
  dark_mode: number;
  compact_view: number;
  auto_save: number;
  opt_out_footer: number;
  compliance_check: number;
  timezone: string;
  updated_at: string;
}

export interface RecipientJson {
  contactId?: string;
  phoneNumber: string;
  name?: string;
}

// ── serialization (never leak internal columns like password_hash) ──

export function publicUser(u: UserRow | Record<string, unknown>) {
  const row = u as UserRow;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar_url ?? '',
    avatarUrl: row.avatar_url,
    phoneNumber: row.phone_number,
    role: row.role,
    plan: row.plan,
    messagesQuota: row.messages_quota,
    messagesUsed: row.messages_used,
    createdAt: row.created_at,
  };
}

export function publicContact(c: ContactRow) {
  let tags: string[] = [];
  try { tags = JSON.parse(c.tags || '[]'); } catch { tags = []; }
  return {
    id: c.id,
    name: c.name,
    phoneNumber: c.phone_number,
    email: c.email ?? '',
    group: c.group_name ?? '',
    groupName: c.group_name,
    tags,
    notes: c.notes,
    optedOut: !!c.opted_out,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

export function publicTemplate(t: TemplateRow) {
  return {
    id: t.id,
    title: t.title,
    content: t.content,
    category: t.category,
    model: t.model,
    usageCount: t.usage_count,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
}

export function publicCampaign(c: CampaignRow) {
  let recipients: RecipientJson[] = [];
  try { recipients = JSON.parse(c.recipients || '[]'); } catch { recipients = []; }
  return {
    id: c.id,
    title: c.title,
    body: c.body,
    mediaUrl: c.media_url,
    channel: c.channel,
    status: c.status,
    scheduledAt: c.scheduled_at,
    recipients,
    totalRecipients: c.total_recipients,
    sentCount: c.sent_count,
    failedCount: c.failed_count,
    aiGenerated: !!c.ai_generated,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    completedAt: c.completed_at,
  };
}

export function publicMessage(m: MessageRow) {
  return {
    id: m.id,
    campaignId: m.campaign_id,
    channel: m.channel,
    recipient: m.to_phone,
    to: m.to_phone,
    toName: m.to_name,
    content: m.body,
    body: m.body,
    mediaUrl: m.media_url,
    status: m.status,
    provider: m.provider,
    providerMessageId: m.provider_message_id,
    error: m.error,
    aiGenerated: !!m.ai_generated,
    templateId: m.template_id,
    source: m.source,
    segments: m.segments,
    timestamp: m.created_at,
    createdAt: m.created_at,
    sentAt: m.sent_at,
    deliveredAt: m.delivered_at,
  };
}

export function publicSettings(s: UserSettingsRow) {
  return {
    emailNotifications: !!s.email_notifications,
    smsNotifications: !!s.sms_notifications,
    browserNotifications: !!s.browser_notifications,
    darkMode: !!s.dark_mode,
    compactView: !!s.compact_view,
    autoSave: !!s.auto_save,
    optOutFooter: !!s.opt_out_footer,
    complianceCheck: !!s.compliance_check,
    timezone: s.timezone,
    sessionTimeoutMinutes: 30,
  };
}

/** Masked credential view — secrets NEVER leave the server. */
export function publicCredential(c: CredentialRow) {
  let meta: Record<string, unknown> = {};
  try { meta = JSON.parse(c.meta || '{}'); } catch { meta = {}; }
  return {
    id: c.id,
    kind: c.kind,
    provider: c.provider,
    meta,
    isConfigured: true,
    maskedKey: meta.__maskedKey ?? '••••••••',
    updatedAt: c.updated_at,
  };
}
