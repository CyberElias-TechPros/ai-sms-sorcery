/**
 * Domain types mirroring the AI SMS Sorcery API (worker/src/lib/rows.ts).
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
  role: 'user' | 'admin';
  plan: string;
  messagesQuota: number;
  messagesUsed: number;
  createdAt: string;
  apiKeys?: {
    smsProvider?: string;
    aiProvider?: string;
  };
}

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  group: string;
  groupName: string | null;
  tags: string[];
  notes: string | null;
  optedOut: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageTemplateType {
  id: string;
  title: string;
  content: string;
  category: string;
  model: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt?: string;
}

export type MessageStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
export type MessageChannel = 'sms' | 'whatsapp';

export interface Message {
  id: string;
  campaignId: string | null;
  channel: MessageChannel;
  recipient: string;
  to: string;
  toName: string | null;
  content: string;
  body: string;
  mediaUrl: string | null;
  status: MessageStatus;
  provider: string;
  providerMessageId: string | null;
  error: string | null;
  aiGenerated: boolean;
  templateId: string | null;
  source: string;
  segments: number;
  timestamp: string;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
}

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'cancelled' | 'failed';

export interface Campaign {
  id: string;
  title: string;
  body: string;
  mediaUrl: string | null;
  channel: 'sms' | 'whatsapp' | 'both';
  status: CampaignStatus;
  scheduledAt: string | null;
  recipients: Array<{ contactId?: string; phoneNumber: string; name?: string }>;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface RecipientInput {
  contactId?: string;
  phoneNumber: string;
  name?: string;
}

export interface UserSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  browserNotifications: boolean;
  darkMode: boolean;
  compactView: boolean;
  autoSave: boolean;
  optOutFooter: boolean;
  complianceCheck: boolean;
  timezone: string;
  sessionTimeoutMinutes: number;
}

export interface CredentialView {
  id: string;
  kind: 'sms' | 'ai';
  provider: string;
  meta: Record<string, unknown>;
  isConfigured: boolean;
  maskedKey: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalSent: number;
  aiGenerated: number;
  aiShare: number;
  delivered: number;
  failed: number;
  pending: number;
  activeContacts: number;
  newContactsWeek: number;
  scheduledNext7: number;
  drafts: number;
  messagesQuota: number;
  messagesUsed: number;
  messagesRemaining: number;
}

export interface DailyPoint {
  name: string;
  sms: number;
  whatsapp: number;
  sent: number;
}

export interface DashboardData {
  user: User;
  stats: DashboardStats;
  daily: DailyPoint[];
  recentMessages: Array<{ id: string; title: string; content: string; model: string; status: string; timestamp: string }>;
  recentTemplates: Array<{ id: string; title: string; content: string; model: string | null; createdAt: string }>;
  upcoming: Array<{ id: string; title: string; status: string; date: string | null; recipients: number }>;
}

export interface AnalyticsData {
  range: string;
  days: number;
  totals: { total: number; delivered: number; failed: number; pending: number };
  deliveryRate: number;
  byStatus: Array<{ name: string; value: number }>;
  byChannel: Array<{ name: string; value: number }>;
  byCategory: Array<{ name: string; value: number }>;
  daily: DailyPoint[];
}

export interface AiGenerationResult {
  texts: string[];
  provider: string;
  model: string;
  segments: Array<{ segments: number; encoding: string }>;
}

export interface AiBulkItem {
  recipient: RecipientInput;
  text: string;
  segments: number;
}

export interface AiBulkResult {
  master: string;
  items: AiBulkItem[];
  provider: string;
  model: string;
}

export interface AiHistoryItem {
  id: string;
  prompt: string;
  kind: string;
  provider: string;
  model: string | null;
  content: string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
