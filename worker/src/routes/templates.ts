/**
 * Message templates CRUD + usage tracking.
 */

import { Env } from '../lib/env';
import { json, readJson, notFound, nowIso } from '../lib/http';
import { uuid } from '../lib/crypto';
import { asString, asEnum } from '../lib/validate';
import { AuthContext } from '../lib/auth';
import { TemplateRow, publicTemplate } from '../lib/rows';

const CATEGORIES = ['marketing', 'notification', 'reminder', 'alert', 'other'] as const;

export async function listTemplates(ctx: AuthContext, env: Env, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const category = (url.searchParams.get('category') || '').trim();

  const where: string[] = ['user_id = ?'];
  const binds: unknown[] = [ctx.user.id];
  if (q) {
    where.push('(title LIKE ? OR content LIKE ?)');
    binds.push(`%${q}%`, `%${q}%`);
  }
  if (category && category !== 'all') {
    where.push('category = ?');
    binds.push(category);
  }

  const rows = (
    await env.DB.prepare(
      `SELECT * FROM templates WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT 500`,
    )
      .bind(...binds)
      .all<TemplateRow>()
  ).results;
  return json({ items: rows.map(publicTemplate), total: rows.length });
}

export async function getTemplate(ctx: AuthContext, env: Env, params: Record<string, string>): Promise<Response> {
  return json(publicTemplate(await findTemplate(ctx, env, params.id)));
}

export async function createTemplate(ctx: AuthContext, env: Env, request: Request): Promise<Response> {
  const body = await readJson(request);
  const title = asString(body.title, 'title', { min: 1, max: 120 });
  const content = asString(body.content, 'content', { min: 1, max: 1600 });
  const category = asEnum(body.category, CATEGORIES, 'category', 'other');
  const model = body.model ? asString(body.model, 'model', { max: 60, required: false }) : null;

  const now = nowIso();
  const id = uuid();
  await env.DB.prepare(
    `INSERT INTO templates (id, user_id, title, content, category, model, usage_count, created_at, updated_at)
     VALUES (?,?,?,?,?,?,0,?,?)`,
  )
    .bind(id, ctx.user.id, title, content, category, model, now, now)
    .run();
  const row = (await env.DB.prepare('SELECT * FROM templates WHERE id = ?').bind(id).first<TemplateRow>())!;
  return json(publicTemplate(row), { status: 201 });
}

export async function updateTemplate(ctx: AuthContext, env: Env, request: Request, params: Record<string, string>): Promise<Response> {
  const existing = await findTemplate(ctx, env, params.id);
  const body = await readJson(request);
  const title = body.title !== undefined ? asString(body.title, 'title', { min: 1, max: 120 }) : existing.title;
  const content = body.content !== undefined ? asString(body.content, 'content', { min: 1, max: 1600 }) : existing.content;
  const category = body.category !== undefined ? asEnum(body.category, CATEGORIES, 'category') : existing.category;
  const model = body.model !== undefined ? (body.model ? asString(body.model, 'model', { max: 60, required: false }) : null) : existing.model;

  await env.DB.prepare(
    'UPDATE templates SET title=?, content=?, category=?, model=?, updated_at=? WHERE id=? AND user_id=?',
  )
    .bind(title, content, category, model, nowIso(), existing.id, ctx.user.id)
    .run();
  const row = (await env.DB.prepare('SELECT * FROM templates WHERE id = ?').bind(existing.id).first<TemplateRow>())!;
  return json(publicTemplate(row));
}

export async function deleteTemplate(ctx: AuthContext, env: Env, params: Record<string, string>): Promise<Response> {
  const existing = await findTemplate(ctx, env, params.id);
  await env.DB.prepare('DELETE FROM templates WHERE id = ? AND user_id = ?').bind(existing.id, ctx.user.id).run();
  return json({ ok: true });
}

export async function useTemplate(ctx: AuthContext, env: Env, params: Record<string, string>): Promise<Response> {
  const existing = await findTemplate(ctx, env, params.id);
  await env.DB.prepare('UPDATE templates SET usage_count = usage_count + 1 WHERE id = ?').bind(existing.id).run();
  const row = (await env.DB.prepare('SELECT * FROM templates WHERE id = ?').bind(existing.id).first<TemplateRow>())!;
  return json(publicTemplate(row));
}

async function findTemplate(ctx: AuthContext, env: Env, id: string): Promise<TemplateRow> {
  const row = await env.DB.prepare('SELECT * FROM templates WHERE id = ? AND user_id = ?')
    .bind(id, ctx.user.id)
    .first<TemplateRow>();
  if (!row) throw notFound('Template not found');
  return row;
}
