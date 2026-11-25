import { Hono } from 'hono';
import { requireAuth } from '../core/auth';
import { ApiError, ok } from '../core/http';
import { PRIORITIES, STATUSES, TYPES, VISIBILITY } from '../core/domain';
import type { AppEnv, Role, Row } from '../core/types';

const m = new Hono<AppEnv>();

const BASE = ['board:view', 'tickets:create', 'tickets:read_own'];
const AGENT = [...BASE, 'tickets:read_all', 'tickets:update', 'analytics:view'];
const PERMISSIONS: Record<Role, string[]> = {
  requester: BASE,
  agent: AGENT,
  approver: [...AGENT, 'changes:approve'],
  admin: [...AGENT, 'changes:approve', 'admin:access'],
};
const MODULES: Record<Role, string[]> = {
  requester: ['auth', 'tickets', 'board', 'comments'],
  agent: ['auth', 'tickets', 'board', 'comments', 'analytics'],
  approver: ['auth', 'tickets', 'board', 'comments', 'analytics'],
  admin: ['auth', 'tickets', 'board', 'comments', 'analytics', 'admin'],
};

m.get('/me', requireAuth, async (c) => {
  const a = c.get('user');
  const u = await c.env.DB.prepare("SELECT * FROM users WHERE id = ? AND status = 'active'").bind(a.id).first<Row>();
  if (!u) throw new ApiError(401, 'INVALID_TOKEN', 'Your session expired. Sign in again.');
  return ok(c, {
    user: { id: u.id, name: u.name, email: u.email, role: u.role, departmentId: u.department_id ?? null, organizationId: u.organization_id },
    permissions: PERMISSIONS[u.role as Role],
    modules: MODULES[u.role as Role],
  });
});

m.get('/config', requireAuth, async (c) => {
  const org = c.get('user').org;
  const [deps, cats] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM departments WHERE organization_id = ? AND active = 1 ORDER BY name').bind(org).all<Row>(),
    c.env.DB.prepare('SELECT * FROM categories WHERE organization_id = ? AND active = 1 ORDER BY name').bind(org).all<Row>(),
  ]);
  const customFields: Record<string, unknown> = {};
  for (const k of cats.results) customFields[k.id] = JSON.parse(k.custom_fields || '[]');
  return ok(c, {
    departments: deps.results.map((d) => ({ id: d.id, name: d.name, slug: d.slug, capacity: d.capacity, visibility: d.visibility })),
    categories: cats.results.map((k) => ({
      id: k.id, departmentId: k.department_id, name: k.name,
      defaultPriority: k.default_priority, customFields: JSON.parse(k.custom_fields || '[]'),
    })),
    customFields,
    visibility: Object.fromEntries(deps.results.map((d) => [d.id, d.visibility])),
    enums: { priorities: PRIORITIES, statuses: STATUSES, types: TYPES, visibility: VISIBILITY },
  });
});

export default m;
