import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, requireRole } from '../core/auth';
import { ApiError, body, ok, parse } from '../core/http';
import { PRIORITIES, ROLES, STATUSES, TICKET_SELECT, VISIBILITY, auditStmt, isRestricted, mapTicket, uid } from '../core/domain';
import type { AppEnv, Row } from '../core/types';

const m = new Hono<AppEnv>();
const guard = [requireAuth, requireRole('admin')] as const;

async function patchRow(db: D1Database, table: string, org: string, id: string, sets: Record<string, unknown>) {
  const keys = Object.keys(sets).filter((k) => sets[k] !== undefined);
  if (!keys.length) throw new ApiError(400, 'VALIDATION', 'Nothing to update.');
  const vals = keys.map((k) => (typeof sets[k] === 'boolean' ? (sets[k] ? 1 : 0) : sets[k]));
  const r = await db.prepare(`UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ? AND organization_id = ?`)
    .bind(...vals, id, org).run();
  if (!r.meta.changes) throw new ApiError(404, 'NOT_FOUND', 'Not found.');
}

m.get('/admin/tickets', ...guard, async (c) => {
  const org = c.get('user').org;
  const q = c.req.query();
  const where = ['t.organization_id = ?'];
  const binds: unknown[] = [org];
  if (q.status && (STATUSES as readonly string[]).includes(q.status)) { where.push('t.status = ?'); binds.push(q.status); }
  if (q.department) { where.push('t.department_id = ?'); binds.push(q.department); }
  if (q.cursor) { where.push('t.created_at < ?'); binds.push(q.cursor); }
  const { results } = await c.env.DB.prepare(`${TICKET_SELECT} WHERE ${where.join(' AND ')} ORDER BY t.created_at DESC LIMIT 51`).bind(...binds).all<Row>();
  const page = results.slice(0, 50);
  return ok(c, page.map((r) => mapTicket(r, isRestricted(r), { requester: true })), {
    nextCursor: results.length > 50 ? page[page.length - 1].created_at : null,
  });
});

m.get('/admin/audit', ...guard, async (c) => {
  const org = c.get('user').org;
  const cursor = c.req.query('cursor');
  const { results } = await c.env.DB.prepare(`SELECT a.*, u.name AS actor_name FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id
    WHERE a.organization_id = ? ${cursor ? 'AND a.created_at < ?' : ''} ORDER BY a.created_at DESC LIMIT 51`)
    .bind(...(cursor ? [org, cursor] : [org])).all<Row>();
  const page = results.slice(0, 50);
  return ok(c, page.map((a) => ({
    id: a.id, action: a.action, entity: a.entity, entityId: a.entity_id,
    actor: a.actor_id ? { id: a.actor_id, name: a.actor_name } : null,
    meta: JSON.parse(a.meta || '{}'), createdAt: a.created_at,
  })), { nextCursor: results.length > 50 ? page[page.length - 1].created_at : null });
});

m.get('/admin/users', ...guard, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM users WHERE organization_id = ? ORDER BY name').bind(c.get('user').org).all<Row>();
  return ok(c, results.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, departmentId: u.department_id, status: u.status })));
});

m.post('/admin/users', ...guard, async (c) => {
  const a = c.get('user');
  const b = parse(z.object({ email: z.string().email(), name: z.string().trim().min(1).max(100), role: z.enum(ROLES), departmentId: z.string().nullish() }), await body(c));
  const exists = await c.env.DB.prepare('SELECT id FROM users WHERE organization_id = ? AND lower(email) = lower(?)').bind(a.org, b.email).first();
  if (exists) throw new ApiError(409, 'CONFLICT', 'That email already has an account.', { email: 'Already in use' });
  const id = uid('usr');
  await c.env.DB.batch([
    c.env.DB.prepare("INSERT INTO users (id, organization_id, email, name, role, department_id, status) VALUES (?,?,?,?,?,?, 'invited')").bind(id, a.org, b.email, b.name, b.role, b.departmentId ?? null),
    auditStmt(c.env.DB, a.org, a.id, 'user.invited', 'user', id, { role: b.role }),
  ]);
  return ok(c, { id, name: b.name, email: b.email, role: b.role, departmentId: b.departmentId ?? null, status: 'invited' }, undefined, 201);
});

m.patch('/admin/users/:id', ...guard, async (c) => {
  const a = c.get('user');
  const b = parse(z.object({ role: z.enum(ROLES).optional(), departmentId: z.string().nullable().optional(), status: z.enum(['invited', 'active', 'disabled']).optional(), name: z.string().trim().min(1).max(100).optional() }), await body(c));
  await patchRow(c.env.DB, 'users', a.org, c.req.param('id'), { role: b.role, department_id: b.departmentId, status: b.status, name: b.name });
  await auditStmt(c.env.DB, a.org, a.id, 'user.updated', 'user', c.req.param('id'), b).run();
  return ok(c, { id: c.req.param('id'), ...b });
});

m.get('/admin/departments', ...guard, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM departments WHERE organization_id = ? ORDER BY name').bind(c.get('user').org).all<Row>();
  return ok(c, results.map((d) => ({ id: d.id, name: d.name, slug: d.slug, capacity: d.capacity, visibility: d.visibility, active: !!d.active })));
});

m.post('/admin/departments', ...guard, async (c) => {
  const a = c.get('user');
  const b = parse(z.object({ name: z.string().trim().min(2).max(60), capacity: z.number().int().min(1).max(1000).default(10), visibility: z.enum(VISIBILITY).default('full') }), await body(c));
  const slug = b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const id = uid('dep');
  try {
    await c.env.DB.batch([
      c.env.DB.prepare('INSERT INTO departments (id, organization_id, name, slug, capacity, visibility) VALUES (?,?,?,?,?,?)').bind(id, a.org, b.name, slug, b.capacity, b.visibility),
      auditStmt(c.env.DB, a.org, a.id, 'department.created', 'department', id, b),
    ]);
  } catch {
    throw new ApiError(409, 'CONFLICT', 'A department with that name already exists.', { name: 'Already in use' });
  }
  return ok(c, { id, name: b.name, slug, capacity: b.capacity, visibility: b.visibility, active: true }, undefined, 201);
});

m.patch('/admin/departments/:id', ...guard, async (c) => {
  const a = c.get('user');
  const b = parse(z.object({ name: z.string().trim().min(2).max(60).optional(), capacity: z.number().int().min(1).max(1000).optional(), visibility: z.enum(VISIBILITY).optional(), active: z.boolean().optional() }), await body(c));
  await patchRow(c.env.DB, 'departments', a.org, c.req.param('id'), b);
  await auditStmt(c.env.DB, a.org, a.id, 'department.updated', 'department', c.req.param('id'), b).run();
  return ok(c, { id: c.req.param('id'), ...b });
});

const fieldDef = z.object({ key: z.string().min(1), label: z.string().min(1), type: z.enum(['text', 'number', 'date', 'select']), required: z.boolean().default(false), options: z.array(z.string()).optional() });

m.get('/admin/categories', ...guard, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM categories WHERE organization_id = ? ORDER BY name').bind(c.get('user').org).all<Row>();
  return ok(c, results.map((k) => ({ id: k.id, departmentId: k.department_id, name: k.name, defaultPriority: k.default_priority, customFields: JSON.parse(k.custom_fields || '[]'), active: !!k.active })));
});

m.post('/admin/categories', ...guard, async (c) => {
  const a = c.get('user');
  const b = parse(z.object({ departmentId: z.string(), name: z.string().trim().min(2).max(80), defaultPriority: z.enum(PRIORITIES).default('medium'), customFields: z.array(fieldDef).default([]) }), await body(c));
  const dep = await c.env.DB.prepare('SELECT id FROM departments WHERE id = ? AND organization_id = ?').bind(b.departmentId, a.org).first();
  if (!dep) throw new ApiError(400, 'VALIDATION', 'Pick a valid department.', { departmentId: 'Unknown department' });
  const id = uid('cat');
  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO categories (id, organization_id, department_id, name, default_priority, custom_fields) VALUES (?,?,?,?,?,?)').bind(id, a.org, b.departmentId, b.name, b.defaultPriority, JSON.stringify(b.customFields)),
    auditStmt(c.env.DB, a.org, a.id, 'category.created', 'category', id, { name: b.name }),
  ]);
  return ok(c, { id, ...b, active: true }, undefined, 201);
});

m.patch('/admin/categories/:id', ...guard, async (c) => {
  const a = c.get('user');
  const b = parse(z.object({ name: z.string().trim().min(2).max(80).optional(), defaultPriority: z.enum(PRIORITIES).optional(), customFields: z.array(fieldDef).optional(), active: z.boolean().optional() }), await body(c));
  await patchRow(c.env.DB, 'categories', a.org, c.req.param('id'), {
    name: b.name, default_priority: b.defaultPriority, active: b.active,
    custom_fields: b.customFields ? JSON.stringify(b.customFields) : undefined,
  });
  await auditStmt(c.env.DB, a.org, a.id, 'category.updated', 'category', c.req.param('id'), { name: b.name }).run();
  return ok(c, { id: c.req.param('id'), ...b });
});

export default m;
