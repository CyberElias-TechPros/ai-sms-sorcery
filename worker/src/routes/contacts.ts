/**
 * Contacts CRUD + search + JSON import/export. All queries scoped to the
 * authenticated user (no cross-tenant reads).
 */

import { Env } from '../lib/env';
import { json, readJson, notFound, badRequest, conflict, nowIso } from '../lib/http';
import { uuid } from '../lib/crypto';
import { asString, asEmail, asPhone, asOptionalPhone, asStringArray, E164_RE, EMAIL_RE } from '../lib/validate';
import { AuthContext } from '../lib/auth';
import { ContactRow, publicContact } from '../lib/rows';

const SORTS: Record<string, string> = {
  name: 'name COLLATE NOCASE',
  phone: 'phone_number',
  created: 'created_at DESC',
  updated: 'updated_at DESC',
};

export async function listContacts(ctx: AuthContext, env: Env, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const group = (url.searchParams.get('group') || '').trim();
  const tag = (url.searchParams.get('tag') || '').trim();
  const page = Math.max(1, Number(url.searchParams.get('page') || 1) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get('pageSize') || 100) || 100));
  const sort = SORTS[url.searchParams.get('sort') || 'name'] || SORTS.name;

  const where: string[] = ['user_id = ?'];
  const binds: unknown[] = [ctx.user.id];
  if (q) {
    where.push('(name LIKE ? OR phone_number LIKE ? OR IFNULL(email, \'\') LIKE ? OR IFNULL(group_name, \'\') LIKE ? OR tags LIKE ?)');
    const like = `%${q}%`;
    binds.push(like, like, like, like, like);
  }
  if (group) { where.push('group_name = ?'); binds.push(group); }
  if (tag) { where.push('tags LIKE ?'); binds.push(`%"${tag}"%`); }

  const whereSql = where.join(' AND ');
  const total = (
    await env.DB.prepare(`SELECT COUNT(*) AS n FROM contacts WHERE ${whereSql}`).bind(...binds).first<{ n: number }>()
  )!.n;
  const rows = (
    await env.DB.prepare(
      `SELECT * FROM contacts WHERE ${whereSql} ORDER BY ${sort} LIMIT ? OFFSET ?`,
    )
      .bind(...binds, pageSize, (page - 1) * pageSize)
      .all<ContactRow>()
  ).results;

  return json({
    items: rows.map(publicContact),
    total,
    page,
    pageSize,
    // Distinct groups/tags power the filter sidebar.
    groups: (
      await env.DB.prepare('SELECT DISTINCT group_name AS g FROM contacts WHERE user_id = ? AND group_name IS NOT NULL AND group_name != \'\' ORDER BY g')
        .bind(ctx.user.id)
        .all<{ g: string }>()
    ).results.map((r) => r.g),
  });
}

export async function getContact(ctx: AuthContext, env: Env, params: Record<string, string>): Promise<Response> {
  const row = await findContact(ctx, env, params.id);
  return json(publicContact(row));
}

export async function createContact(ctx: AuthContext, env: Env, request: Request): Promise<Response> {
  const body = await readJson(request);
  const name = asString(body.name, 'name', { min: 1, max: 120 });
  const phoneNumber = asPhone(body.phoneNumber);
  const email = body.email ? asEmail(body.email, 'email') : null;
  const group = body.group ?? body.groupName ? asString(body.group ?? body.groupName, 'group', { max: 60, required: false }) || null : null;
  const tags = asStringArray(body.tags, 'tags');
  const notes = body.notes ? asString(body.notes, 'notes', { max: 2000, required: false }) : null;

  const dup = await env.DB.prepare('SELECT id FROM contacts WHERE user_id = ? AND phone_number = ?')
    .bind(ctx.user.id, phoneNumber)
    .first();
  if (dup) throw conflict('A contact with this phone number already exists', { field: 'phoneNumber' });

  const now = nowIso();
  const id = uuid();
  await env.DB.prepare(
    `INSERT INTO contacts (id, user_id, name, phone_number, email, group_name, tags, notes, opted_out, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,0,?,?)`,
  )
    .bind(id, ctx.user.id, name, phoneNumber, email, group, JSON.stringify(tags), notes, now, now)
    .run();
  const row = (await env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(id).first<ContactRow>())!;
  return json(publicContact(row), { status: 201 });
}

export async function updateContact(ctx: AuthContext, env: Env, request: Request, params: Record<string, string>): Promise<Response> {
  const existing = await findContact(ctx, env, params.id);
  const body = await readJson(request);

  const name = body.name !== undefined ? asString(body.name, 'name', { min: 1, max: 120 }) : existing.name;
  const phoneNumber = body.phoneNumber !== undefined ? asPhone(body.phoneNumber) : existing.phone_number;
  const email = body.email !== undefined ? (body.email ? asEmail(body.email, 'email') : null) : existing.email;
  const groupRaw = body.group ?? body.groupName;
  const group = groupRaw !== undefined ? (asString(groupRaw, 'group', { max: 60, required: false }) || null) : existing.group_name;
  const tags = body.tags !== undefined ? asStringArray(body.tags, 'tags') : JSON.parse(existing.tags || '[]');
  const notes = body.notes !== undefined ? (body.notes ? asString(body.notes, 'notes', { max: 2000, required: false }) : null) : existing.notes;
  const optedOut = body.optedOut !== undefined ? (body.optedOut ? 1 : 0) : existing.opted_out;

  if (phoneNumber !== existing.phone_number) {
    const dup = await env.DB.prepare('SELECT id FROM contacts WHERE user_id = ? AND phone_number = ? AND id != ?')
      .bind(ctx.user.id, phoneNumber, existing.id)
      .first();
    if (dup) throw conflict('A contact with this phone number already exists', { field: 'phoneNumber' });
  }

  await env.DB.prepare(
    `UPDATE contacts SET name=?, phone_number=?, email=?, group_name=?, tags=?, notes=?, opted_out=?, updated_at=?
     WHERE id = ? AND user_id = ?`,
  )
    .bind(name, phoneNumber, email, group, JSON.stringify(tags), notes, optedOut, nowIso(), existing.id, ctx.user.id)
    .run();
  const row = (await env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(existing.id).first<ContactRow>())!;
  return json(publicContact(row));
}

export async function deleteContact(ctx: AuthContext, env: Env, params: Record<string, string>): Promise<Response> {
  const existing = await findContact(ctx, env, params.id);
  await env.DB.prepare('DELETE FROM contacts WHERE id = ? AND user_id = ?').bind(existing.id, ctx.user.id).run();
  return json({ ok: true });
}

export async function exportContacts(ctx: AuthContext, env: Env): Promise<Response> {
  const rows = (
    await env.DB.prepare('SELECT * FROM contacts WHERE user_id = ? ORDER BY name COLLATE NOCASE').bind(ctx.user.id).all<ContactRow>()
  ).results;
  const payload = rows.map(publicContact).map((c) => ({
    name: c.name,
    phoneNumber: c.phoneNumber,
    email: c.email,
    group: c.group,
    tags: c.tags,
    notes: c.notes,
  }));
  return json({
    exportedAt: nowIso(),
    count: payload.length,
    contacts: payload,
    format: 'ai-sms-sorcery.contacts.v1',
  });
}

export async function importContacts(ctx: AuthContext, env: Env, request: Request): Promise<Response> {
  const body = await readJson<{ contacts?: unknown[] }>(request);
  const list = body.contacts ?? (Array.isArray(body) ? (body as unknown[]) : null);
  if (!Array.isArray(list)) throw badRequest('Body must contain a "contacts" array');
  if (list.length > 2000) throw badRequest('Import is limited to 2000 contacts per request');

  const now = nowIso();
  let created = 0;
  let skipped = 0;
  let updated = 0;
  const errors: Array<{ index: number; reason: string }> = [];

  for (let i = 0; i < list.length; i++) {
    const item = list[i] as Record<string, unknown>;
    try {
      const name = asString(item.name, 'name', { min: 1, max: 120 });
      const phoneRaw = String(item.phoneNumber ?? item.phone ?? '').replace(/[\s\-().]/g, '');
      if (!E164_RE.test(phoneRaw)) throw badRequest('phoneNumber must be in international format');
      const email = item.email && EMAIL_RE.test(String(item.email)) ? String(item.email).toLowerCase() : null;
      const group = item.group ?? item.groupName ? (String(item.group ?? item.groupName).slice(0, 60) || null) : null;
      const tags = Array.isArray(item.tags) ? item.tags.map((t) => String(t).slice(0, 48)).slice(0, 32) : [];
      const notes = item.notes ? String(item.notes).slice(0, 2000) : null;

      const existing = await env.DB.prepare('SELECT id FROM contacts WHERE user_id = ? AND phone_number = ?')
        .bind(ctx.user.id, phoneRaw)
        .first<{ id: string }>();
      if (existing) {
        await env.DB.prepare(
          `UPDATE contacts SET name=?, email=?, group_name=?, tags=?, notes=?, updated_at=? WHERE id=? AND user_id=?`,
        )
          .bind(name, email, group, JSON.stringify(tags), notes, now, existing.id, ctx.user.id)
          .run();
        updated++;
      } else {
        await env.DB.prepare(
          `INSERT INTO contacts (id, user_id, name, phone_number, email, group_name, tags, notes, opted_out, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?, ?, 0, ?, ?)`,
        )
          .bind(uuid(), ctx.user.id, name, phoneRaw, email, group, JSON.stringify(tags), notes, now, now)
          .run();
        created++;
      }
    } catch (err) {
      skipped++;
      if (errors.length < 20) {
        errors.push({ index: i, reason: err instanceof Error ? err.message : 'invalid contact' });
      }
    }
  }

  return json({ created, updated, skipped, errors });
}

async function findContact(ctx: AuthContext, env: Env, id: string): Promise<ContactRow> {
  const row = await env.DB.prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?')
    .bind(id, ctx.user.id)
    .first<ContactRow>();
  if (!row) throw notFound('Contact not found');
  return row;
}
