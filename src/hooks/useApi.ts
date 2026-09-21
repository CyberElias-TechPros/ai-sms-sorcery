/**
 * React Query hooks — the single data layer for every screen.
 * All happy paths are wired to the live Sorcery API.
 */

import {
  useMutation, useQuery, useQueryClient, UseQueryOptions,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AnalyticsData, Campaign, Contact, DashboardData, Message, MessageTemplateType, UserSettings,
} from '@/lib/types';

// ── keys ───────────────────────────────────────────────────────────
export const qk = {
  dashboard: ['stats', 'dashboard'] as const,
  analytics: (range: string) => ['stats', 'analytics', range] as const,
  contacts: (params: unknown) => ['contacts', params] as const,
  templates: (params: unknown) => ['templates', params] as const,
  messages: (params: unknown) => ['messages', params] as const,
  campaigns: (params: unknown) => ['campaigns', params] as const,
  settings: ['settings'] as const,
  credentials: ['credentials'] as const,
  aiHistory: ['ai', 'history'] as const,
};

// ── dashboard & analytics ──────────────────────────────────────────
export const useDashboard = (options?: Partial<UseQueryOptions<DashboardData>>) =>
  useQuery({ queryKey: qk.dashboard, queryFn: api.dashboard, ...options });

export const useAnalytics = (range: string) =>
  useQuery<AnalyticsData>({ queryKey: qk.analytics(range), queryFn: () => api.analytics(range) });

// ── contacts ───────────────────────────────────────────────────────
export interface ContactFilters {
  q?: string;
  group?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export const useContacts = (params: ContactFilters = {}) =>
  useQuery({
    queryKey: qk.contacts(params),
    queryFn: () => api.listContacts(params),
  });

export const useCreateContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createContact,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
};

export const useUpdateContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...b }: { id: string } & Partial<Contact>) => api.updateContact(id, b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
};

export const useDeleteContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteContact(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
};

export const useImportContacts = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contacts: Array<Partial<Contact>>) => api.importContacts(contacts),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
};

// ── templates ──────────────────────────────────────────────────────
export const useTemplates = (params: { q?: string; category?: string } = {}) =>
  useQuery({
    queryKey: qk.templates(params),
    queryFn: () => api.listTemplates(params),
  });

export const useCreateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
};

export const useUpdateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...b }: { id: string } & Partial<MessageTemplateType>) => api.updateTemplate(id, b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
};

export const useDeleteTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
};

export const useTemplateUsage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.useTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
};

// ── messages ───────────────────────────────────────────────────────
export interface MessageFilters {
  q?: string;
  status?: string;
  channel?: string;
  page?: number;
  pageSize?: number;
}

export const useMessages = (params: MessageFilters = {}) =>
  useQuery({
    queryKey: qk.messages(params),
    queryFn: () => api.listMessages(params),
  });

export const useSendMessages = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.sendMessages,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useResendMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.resendMessage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useCancelMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.cancelMessage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages'] }),
  });
};

// ── scheduled campaigns ────────────────────────────────────────────
export const useCampaigns = (params: { tab?: string; q?: string } = {}) =>
  useQuery({
    queryKey: qk.campaigns(params),
    queryFn: () => api.listCampaigns(params),
  });

export const useCreateCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createCampaign,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useUpdateCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...b }: { id: string } & Partial<Campaign>) => api.updateCampaign(id, b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
};

export const useDeleteCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteCampaign(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useCampaignAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, body }: { id: string; action: Parameters<typeof api.campaignAction>[1]; body?: unknown }) =>
      api.campaignAction(id, action, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

// ── settings & credentials ─────────────────────────────────────────
export const useSettings = () =>
  useQuery({ queryKey: qk.settings, queryFn: api.getSettings });

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.updateSettings,
    onSuccess: (data) => qc.setQueryData(qk.settings, data),
  });
};

export const useCredentials = () =>
  useQuery({ queryKey: qk.credentials, queryFn: api.listCredentials });

export const useUpsertCredential = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.upsertCredential,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credentials'] }),
  });
};

export const useDeleteCredential = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteCredential(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credentials'] }),
  });
};

export const useTestCredential = () =>
  useMutation({ mutationFn: api.testCredential });

// ── AI ─────────────────────────────────────────────────────────────
export const useAiHistory = (limit = 12) =>
  useQuery({ queryKey: qk.aiHistory, queryFn: () => api.aiHistory(limit) });
