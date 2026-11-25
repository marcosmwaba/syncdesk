import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, requireRole } from '../core/auth';
import { classifyTicket } from '../core/ai';
import { ApiError, body, ok, parse } from '../core/http';
import {
  PRIORITIES, STATUSES, TICKET_SELECT, TYPES, auditStmt, canTransition,
  getTicket, mapTicket, maskedFor, now, slaDue, uid,
} from '../core/domain';
import type { AppEnv, AuthUser, Row } from '../core/types';

const m = new Hono<AppEnv>();
const notFound = () => new ApiError(404, 'NOT_FOUND', 'Ticket not found.');
const forbidden = () => new ApiError(403, 'FORBIDDEN', 'You do not have access to this ticket.');

const createSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(1).max(5000),
  departmentId: z.string().min(1),
  categoryId: z.string().nullish(),
  priority: z.enum(PRIORITIES).optional(),
  type: z.enum(TYPES).default('request'),
  confidential: z.boolean().default(false),
  customFields: z.record(z.any()).default({}),
});

async function loadForUser(db: D1Database, u: AuthUser, id: string) {
  const row = await getTicket(db, u.org, id);
  if (!row) throw notFound();
  const masked = maskedFor(u, row);
  if (u.role === 'requester' && row.requester_id !== u.id) throw forbidden();
  if (masked && u.role !== 'admin') throw forbidden();
  return { row, masked };
}

function agentScope(u: AuthUser, row: Row) {
  if (u.role === 'requester') throw forbidden();
  if (u.role !== 'admin' && u.dept !== row.department_id) throw forbidden();
}

m.post('/tickets', requireAuth, async (c) => {
  const u = c.get('user');
  const b = parse(createSchema, await body(c));
  const db = c.env.DB;

  const dep = await db.prepare('SELECT id FROM departments WHERE id = ? AND organization_id = ? AND active = 1').bind(b.departmentId, u.org).first();
  if (!dep) throw new ApiError(400, 'VALIDATION', 'Pick a valid department.', { departmentId: 'Unknown department' });

  let cat: Row | null = null;
  if (b.categoryId) {
    cat = await db.prepare('SELECT * FROM categories WHERE id = ? AND organization_id = ? AND department_id = ? AND active = 1')
      .bind(b.categoryId, u.org, b.departmentId).first<Row>();
    if (!cat) throw new ApiError(400, 'VALIDATION', 'Pick a valid category.', { categoryId: 'Unknown category for this department' });
    const missing: Record<string, string> = {};
    for (const f of JSON.parse(cat.custom_fields || '[]')) {
      const v = b.customFields[f.key];
      if (f.required && (v === undefined || v === null || v === '')) missing[`customFields.${f.key}`] = `${f.label} is required`;
    }
    if (Object.keys(missing).length) throw new ApiError(400, 'VALIDATION', 'Check the highlighted fields.', missing);
  }

  const ai = await classifyTicket(c.env, `${b.title}\n${b.description}`);
  const priority = b.priority ?? ai.priority ?? cat?.default_priority ?? 'medium';
  const needsTriage = !b.priority && ai.priority === null ? 1 : 0;
  const due = slaDue(priority);
  const id = uid('tkt');
  const ts = now();

  await db.batch([
    db.prepare(`INSERT INTO tickets (id, organization_id, type, title, description, department_id, category_id, priority, status,
      confidential, requester_id, custom_fields, ai_priority, ai_confidence, needs_triage, response_due_at, resolve_due_at, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?, 'open', ?,?,?,?,?,?,?,?,?,?)`)
      .bind(id, u.org, b.type, b.title, b.description, b.departmentId, b.categoryId ?? null, priority,
        b.confidential ? 1 : 0, u.id, JSON.stringify(b.customFields), ai.priority, ai.confidence, needsTriage, due.response, due.resolve, ts, ts),
    auditStmt(db, u.org, u.id, 'ticket.created', 'ticket', id, { departmentId: b.departmentId, priority, type: b.type }),
  ]);

  const row = (await getTicket(db, u.org, id))!;
  return ok(c, mapTicket(row, false), undefined, 201);
});

m.get('/tickets', requireAuth, async (c) => {
  const u = c.get('user');
  const q = c.req.query();
  const where = ['t.organization_id = ?'];
  const binds: unknown[] = [u.org];
  if (u.role === 'requester') { where.push('t.requester_id = ?'); binds.push(u.id); }
  if (q.status && (STATUSES as readonly string[]).includes(q.status)) { where.push('t.status = ?'); binds.push(q.status); }
  if (q.priority && (PRIORITIES as readonly string[]).includes(q.priority)) { where.push('t.priority = ?'); binds.push(q.priority); }
  if (q.department) { where.push('t.department_id = ?'); binds.push(q.department); }
  if (q.cursor) { where.push('t.created_at < ?'); binds.push(q.cursor); }
  const limit = 25;
  const { results } = await c.env.DB
    .prepare(`${TICKET_SELECT} WHERE ${where.join(' AND ')} ORDER BY t.created_at DESC LIMIT ${limit + 1}`)
    .bind(...binds).all<Row>();
  const page = results.slice(0, limit);
  return ok(c, page.map((r) => mapTicket(r, maskedFor(u, r))), {
    nextCursor: results.length > limit ? page[page.length - 1].created_at : null,
  });
});

m.get('/tickets/:id', requireAuth, async (c) => {
  const u = c.get('user');
  const { row, masked } = await loadForUser(c.env.DB, u, c.req.param('id'));
  if (masked) {
    await auditStmt(c.env.DB, u.org, u.id, 'ticket.restricted_view', 'ticket', row.id, { departmentId: row.department_id }).run();
  }
  return ok(c, mapTicket(row, false));
});

m.patch('/tickets/:id/status', requireAuth, requireRole('agent', 'approver', 'admin'), async (c) => {
  const u = c.get('user');
  const { status } = parse(z.object({ status: z.enum(STATUSES) }), await body(c));
  const row = await getTicket(c.env.DB, u.org, c.req.param('id'));
  if (!row) throw notFound();
  agentScope(u, row);
  if (!canTransition(row.status, status)) {
    throw new ApiError(409, 'INVALID_TRANSITION', `A ticket cannot move from ${row.status} to ${status}.`);
  }
  const ts = now();
  const resolvedAt = status === 'resolved' ? ts : status === 'in_progress' ? null : row.resolved_at;
  const assignee = row.assignee_id ?? (status === 'in_progress' && u.role === 'agent' ? u.id : null);
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE tickets SET status = ?, resolved_at = ?, assignee_id = ?, updated_at = ? WHERE id = ? AND organization_id = ?')
      .bind(status, resolvedAt, assignee, ts, row.id, u.org),
    auditStmt(c.env.DB, u.org, u.id, 'ticket.status_changed', 'ticket', row.id, { from: row.status, to: status }),
  ]);
  return ok(c, mapTicket((await getTicket(c.env.DB, u.org, row.id))!, false));
});

m.patch('/tickets/:id', requireAuth, requireRole('agent', 'approver', 'admin'), async (c) => {
  const u = c.get('user');
  const b = parse(z.object({
    categoryId: z.string().nullable().optional(),
    priority: z.enum(PRIORITIES).optional(),
    assigneeId: z.string().nullable().optional(),
    departmentId: z.string().optional(),
  }), await body(c));
  const row = await getTicket(c.env.DB, u.org, c.req.param('id'));
  if (!row) throw notFound();
  agentScope(u, row);

  if (b.departmentId && b.departmentId !== row.department_id) {
    const d = await c.env.DB.prepare('SELECT id FROM departments WHERE id = ? AND organization_id = ? AND active = 1').bind(b.departmentId, u.org).first();
    if (!d) throw new ApiError(400, 'VALIDATION', 'Pick a valid department.', { departmentId: 'Unknown department' });
  }
  const priority = b.priority ?? row.priority;
  const due = b.priority && b.priority !== row.priority ? slaDue(priority, new Date(row.created_at)) : null;
  const ts = now();
  await c.env.DB.batch([
    c.env.DB.prepare(`UPDATE tickets SET category_id = ?, priority = ?, assignee_id = ?, department_id = ?, needs_triage = 0,
      response_due_at = ?, resolve_due_at = ?, updated_at = ? WHERE id = ? AND organization_id = ?`)
      .bind(b.categoryId === undefined ? row.category_id : b.categoryId, priority,
        b.assigneeId === undefined ? row.assignee_id : b.assigneeId, b.departmentId ?? row.department_id,
        due?.response ?? row.response_due_at, due?.resolve ?? row.resolve_due_at, ts, row.id, u.org),
    auditStmt(c.env.DB, u.org, u.id, 'ticket.updated', 'ticket', row.id, { before: { priority: row.priority, departmentId: row.department_id, aiPriority: row.ai_priority }, after: b }),
  ]);
  return ok(c, mapTicket((await getTicket(c.env.DB, u.org, row.id))!, false));
});

const mapComment = (r: Row) => ({
  id: r.id, ticketId: r.ticket_id, body: r.body, createdAt: r.created_at,
  author: { id: r.author_id, name: r.author_name, role: r.author_role },
});

m.get('/tickets/:id/comments', requireAuth, async (c) => {
  const u = c.get('user');
  const { row } = await loadForUser(c.env.DB, u, c.req.param('id'));
  const { results } = await c.env.DB
    .prepare(`SELECT c.*, a.name AS author_name, a.role AS author_role FROM comments c JOIN users a ON a.id = c.author_id
      WHERE c.ticket_id = ? AND c.organization_id = ? ORDER BY c.created_at ASC`).bind(row.id, u.org).all<Row>();
  return ok(c, results.map(mapComment));
});

m.post('/tickets/:id/comments', requireAuth, async (c) => {
  const u = c.get('user');
  const { text } = parse(z.object({ text: z.string().trim().min(1).max(4000) }), await body(c));
  const { row } = await loadForUser(c.env.DB, u, c.req.param('id'));
  const id = uid('cmt');
  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO comments (id, organization_id, ticket_id, author_id, body, created_at) VALUES (?,?,?,?,?,?)').bind(id, u.org, row.id, u.id, text, now()),
    c.env.DB.prepare('UPDATE tickets SET updated_at = ? WHERE id = ?').bind(now(), row.id),
  ]);
  const saved = await c.env.DB.prepare('SELECT c.*, a.name AS author_name, a.role AS author_role FROM comments c JOIN users a ON a.id = c.author_id WHERE c.id = ?').bind(id).first<Row>();
  return ok(c, mapComment(saved!), undefined, 201);
});

export default m;
