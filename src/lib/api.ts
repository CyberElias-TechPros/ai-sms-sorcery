/**
 * Typed API client for the AI SMS Sorcery Worker API.
 * - Relative `/api` by default (dev proxy → local worker; Vercel rewrites in prod),
 *   or set VITE_API_URL to point at a deployed worker.
 * - Bearer session token from the auth store.
 * - Uniform `{ data }` / `{ error }` envelope handling with typed errors.
 */

import { useAuthStore } from '@/store/authStore';
import type {
  AnalyticsData, AiBulkResult, AiGenerationResult, AiHistoryItem, Campaign, Contact,
  CredentialView, DashboardData, Message, MessageTemplateType, Paginated, RecipientInput, User, UserSettings,
} from './types';

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;
  requestId?: string;
  constructor(status: number, code: string, message: string, details?: unknown, requestId?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers);
  headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, 'network_error', 'Cannot reach the server — check your connection and try again');
  }

  let payload: { data?: T; error?: { code: string; message: string; details?: unknown }; requestId?: string } | null = null;
  try {
    payload = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok || payload?.error) {
    const err = payload?.error;
    if (res.status === 401 && token) {
      // Session is dead — clear client state so ProtectedRoute redirects to /auth.
      useAuthStore.getState().logout();
    }
    throw new ApiError(res.status, err?.code || 'http_error', err?.message || `Request failed (HTTP ${res.status})`, err?.details, payload?.requestId);
  }
  return payload!.data as T;
}

const json = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });
const put = (body: unknown): RequestInit => ({ method: 'PUT', body: JSON.stringify(body) });

export const api = {
  // ── auth ──
  register: (b: { email: string; password: string; name: string; phoneNumber?: string }) =>
    request<{ token: string; expiresAt: string; user: User }>('/auth/register', json(b)),
  login: (b: { email: string; password: string }) =>
    request<{ token: string; expiresAt: string; user: User }>('/auth/login', json(b)),
  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
  logoutAll: () => request<{ ok: true }>('/auth/logout-all', { method: 'POST' }),
  me: () => request<{ user: User }>('/auth/me'),
  changePassword: (b: { currentPassword: string; newPassword: string }) =>
    request<{ ok: true; message: string }>('/auth/change-password', json(b)),

  // ── contacts ──
  listContacts: (params: { q?: string; group?: string; tag?: string; page?: number; pageSize?: number; sort?: string } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)); });
    return request<Paginated<Contact> & { groups: string[] }>(`/contacts?${qs}`);
  },
  createContact: (b: Partial<Contact> & { name: string; phoneNumber: string }) =>
    request<Contact>('/contacts', json(b)),
  updateContact: (id: string, b: Partial<Contact>) =>
    request<Contact>(`/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  deleteContact: (id: string) => request<{ ok: true }>(`/contacts/${id}`, { method: 'DELETE' }),
  importContacts: (contacts: Array<Partial<Contact>>) =>
    request<{ created: number; updated: number; skipped: number; errors: Array<{ index: number; reason: string }> }>('/contacts/import', json({ contacts })),
  exportContacts: () =>
    request<{ exportedAt: string; count: number; contacts: Array<Partial<Contact>> }>('/contacts/export'),

  // ── templates ──
  listTemplates: (params: { q?: string; category?: string } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v && v !== 'all') qs.set(k, String(v)); });
    return request<{ items: MessageTemplateType[]; total: number }>(`/templates?${qs}`);
  },
  createTemplate: (b: { title: string; content: string; category: string; model?: string }) =>
    request<MessageTemplateType>('/templates', json(b)),
  updateTemplate: (id: string, b: Partial<MessageTemplateType>) =>
    request<MessageTemplateType>(`/templates/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  deleteTemplate: (id: string) => request<{ ok: true }>(`/templates/${id}`, { method: 'DELETE' }),
  useTemplate: (id: string) => request<MessageTemplateType>(`/templates/${id}/use`, { method: 'POST' }),

  // ── ai ──
  generate: (b: { prompt: string; kind: string; maxLength?: number; variants?: number; audience?: string; tone?: string }) =>
    request<AiGenerationResult>('/ai/generate', json(b)),
  generateBulk: (b: { prompt: string; kind: string; maxLength?: number; recipients: RecipientInput[] }) =>
    request<AiBulkResult>('/ai/generate-bulk', json(b)),
  aiHistory: (limit = 20) => request<{ items: AiHistoryItem[] }>(`/ai/history?limit=${limit}`),

  // ── messages ──
  sendMessages: (b: {
    body: string; recipients: RecipientInput[]; channel?: 'sms' | 'whatsapp' | 'both';
    mediaUrl?: string; templateId?: string; aiGenerated?: boolean; idempotencyKey?: string;
  }) => request<{
    messages: Message[]; count: number; skippedOptedOut: number;
    compliance: { footerAppended: boolean };
    segments: { segments: number; encoding: string };
  }>('/messages/send', {
    method: 'POST',
    body: JSON.stringify(b),
    headers: b.idempotencyKey ? { 'x-idempotency-key': b.idempotencyKey } : undefined,
  }),
  listMessages: (params: { q?: string; status?: string; channel?: string; source?: string; campaignId?: string; page?: number; pageSize?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '' && v !== 'all') qs.set(k, String(v)); });
    return request<Paginated<Message>>(`/messages?${qs}`);
  },
  getMessage: (id: string) => request<Message>(`/messages/${id}`),
  resendMessage: (id: string) => request<{ message: Message }>(`/messages/${id}/resend`, { method: 'POST' }),
  cancelMessage: (id: string) => request<Message>(`/messages/${id}/cancel`, { method: 'POST' }),
  exportMessages: () => request<{ exportedAt: string; count: number; messages: Message[] }>('/messages/export'),

  // ── scheduled campaigns ──
  listCampaigns: (params: { tab?: string; q?: string } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    return request<{ items: Campaign[]; total: number }>(`/scheduled?${qs}`);
  },
  getCampaign: (id: string) => request<Campaign>(`/scheduled/${id}`),
  createCampaign: (b: {
    title: string; body: string; channel?: string; mediaUrl?: string;
    recipients: RecipientInput[]; scheduledAt?: string; draft?: boolean; aiGenerated?: boolean;
  }) => request<Campaign>('/scheduled', json(b)),
  updateCampaign: (id: string, b: Partial<Campaign>) =>
    request<Campaign>(`/scheduled/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
  deleteCampaign: (id: string) => request<{ ok: true }>(`/scheduled/${id}`, { method: 'DELETE' }),
  campaignAction: (id: string, action: 'pause' | 'resume' | 'cancel' | 'duplicate' | 'send-now' | 'schedule', body?: unknown) =>
    request<Campaign>(`/scheduled/${id}/${action}`, json(body ?? {})),

  // ── stats ──
  dashboard: () => request<DashboardData>('/stats/dashboard'),
  analytics: (range = '7days') => request<AnalyticsData>(`/stats/analytics?range=${range}`),

  // ── settings / account ──
  getSettings: () => request<UserSettings>('/settings'),
  updateSettings: (b: Partial<UserSettings>) => request<UserSettings>('/settings', put(b)),
  updateProfile: (b: { name?: string; phoneNumber?: string; avatarUrl?: string; email?: string }) =>
    request<{ user: User }>('/profile', { method: 'PATCH', body: JSON.stringify(b) }),
  securitySummary: () => request<{ activeSessions: Array<Record<string, unknown>> }>('/settings/security'),
  exportAccount: () => request<Record<string, unknown>>('/account/export'),
  deleteAccount: (password: string) =>
    request<{ ok: true; message: string }>('/account', { method: 'DELETE', body: JSON.stringify({ password }) }),

  // ── credentials ──
  listCredentials: () =>
    request<{ items: CredentialView[]; available: { sms: string[]; ai: string[] } }>('/credentials'),
  upsertCredential: (b: Record<string, unknown>) => request<CredentialView>('/credentials', put(b)),
  deleteCredential: (id: string) => request<{ ok: true }>(`/credentials/${id}`, { method: 'DELETE' }),
  testCredential: (b: { kind: 'sms' | 'ai'; draft?: Record<string, unknown> }) =>
    request<{ ok: boolean; message: string }>('/credentials/test', json(b)),
};

export type Api = typeof api;
