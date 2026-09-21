/**
 * Small, explicit server-side validation helpers. All client input is untrusted.
 */

import { unprocessable } from './http';

export const E164_RE = /^\+[1-9]\d{7,14}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function asString(value: unknown, field: string, opts: { min?: number; max?: number; required?: boolean; pattern?: RegExp } = {}): string {
  const { min = 0, max = 10_000, required = true, pattern } = opts;
  if (value === undefined || value === null || value === '') {
    if (required) throw unprocessable(`${field} is required`, { field });
    return '';
  }
  if (typeof value !== 'string') throw unprocessable(`${field} must be a string`, { field });
  const v = value.trim();
  if (v.length < min) throw unprocessable(`${field} must be at least ${min} characters`, { field });
  if (v.length > max) throw unprocessable(`${field} must be at most ${max} characters`, { field });
  if (pattern && !pattern.test(v)) throw unprocessable(`${field} is invalid`, { field });
  return v;
}

export function asEmail(value: unknown, field = 'email'): string {
  return asString(value, field, { max: 254, pattern: EMAIL_RE }).toLowerCase();
}

export function asPhone(value: unknown, field = 'phoneNumber'): string {
  const v = asString(value, field, { max: 24 });
  const normalized = v.replace(/[\s\-().]/g, '');
  if (!E164_RE.test(normalized)) {
    throw unprocessable(`${field} must be in international format, e.g. +12025550142`, { field });
  }
  return normalized;
}

export function asOptionalPhone(value: unknown, field = 'phoneNumber'): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return asPhone(value, field);
}

export function asEnum<T extends string>(value: unknown, allowed: readonly T[], field: string, fallback?: T): T {
  if (value === undefined || value === null || value === '') {
    if (fallback !== undefined) return fallback;
    throw unprocessable(`${field} is required`, { field });
  }
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw unprocessable(`${field} must be one of: ${allowed.join(', ')}`, { field });
  }
  return value as T;
}

export function asInt(value: unknown, field: string, opts: { min?: number; max?: number; fallback?: number } = {}): number {
  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, fallback } = opts;
  if (value === undefined || value === null || value === '') {
    if (fallback !== undefined) return fallback;
    throw unprocessable(`${field} is required`, { field });
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n)) throw unprocessable(`${field} must be an integer`, { field });
  if (n < min || n > max) throw unprocessable(`${field} must be between ${min} and ${max}`, { field });
  return n;
}

export function asBool(value: unknown, field: string, fallback?: boolean): boolean {
  if (value === undefined || value === null || value === '') {
    if (fallback !== undefined) return fallback;
    throw unprocessable(`${field} is required`, { field });
  }
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;
  throw unprocessable(`${field} must be a boolean`, { field });
}

export function asIsoDate(value: unknown, field: string, opts: { required?: boolean; future?: boolean } = {}): string | undefined {
  const { required = true, future = false } = opts;
  if (value === undefined || value === null || value === '') {
    if (required) throw unprocessable(`${field} is required`, { field });
    return undefined;
  }
  if (typeof value !== 'string') throw unprocessable(`${field} must be an ISO-8601 date string`, { field });
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw unprocessable(`${field} must be a valid date`, { field });
  if (future && d.getTime() <= Date.now()) {
    throw unprocessable(`${field} must be in the future`, { field });
  }
  return d.toISOString();
}

export function asStringArray(value: unknown, field: string, opts: { max?: number; itemMax?: number } = {}): string[] {
  const { max = 32, itemMax = 48 } = opts;
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw unprocessable(`${field} must be an array`, { field });
  if (value.length > max) throw unprocessable(`${field} may contain at most ${max} items`, { field });
  return value.map((v) => {
    if (typeof v !== 'string') throw unprocessable(`${field} items must be strings`, { field });
    const s = v.trim();
    if (!s || s.length > itemMax) throw unprocessable(`${field} contains an invalid item`, { field });
    return s;
  });
}

export interface RecipientInput {
  contactId?: string;
  phoneNumber: string;
  name?: string;
}

export function asRecipients(value: unknown, field = 'recipients', max = 1000): RecipientInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw unprocessable(`${field} must be a non-empty array`, { field });
  }
  if (value.length > max) {
    throw unprocessable(`${field} may contain at most ${max} recipients`, { field });
  }
  return value.map((item, i) => {
    if (typeof item !== 'object' || item === null) {
      throw unprocessable(`${field}[${i}] must be an object`, { field });
    }
    const r = item as Record<string, unknown>;
    const name = r.name === undefined || r.name === null || r.name === '' ? undefined : asString(r.name, `${field}[${i}].name`, { max: 120 });
    const contactId = typeof r.contactId === 'string' && r.contactId ? r.contactId : undefined;
    return { contactId, phoneNumber: asPhone(r.phoneNumber, `${field}[${i}].phoneNumber`), name };
  });
}

export function passwordPolicy(password: unknown, field = 'password'): string {
  const p = asString(password, field, { min: 8, max: 128 });
  if (!/[a-zA-Z]/.test(p) || !/[0-9]/.test(p)) {
    throw unprocessable('Password must contain at least one letter and one number', { field });
  }
  return p;
}

/** GSM-7 basic charset check (approximation sufficient for segment counting). */
const GSM7 = new Set(
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà".split(''),
);

export function smsSegments(body: string): { segments: number; encoding: 'GSM-7' | 'UCS-2' } {
  const isGsm = [...body].every((c) => GSM7.has(c));
  if (isGsm) {
    return { segments: Math.max(1, Math.ceil(body.length / (body.length <= 160 ? 160 : 153))), encoding: 'GSM-7' };
  }
  const len = [...body].length;
  return { segments: Math.max(1, Math.ceil(len / (len <= 70 ? 70 : 67))), encoding: 'UCS-2' };
}
