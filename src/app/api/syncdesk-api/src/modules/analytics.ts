import { Hono } from 'hono';
import { requireAuth, requireRole } from '../core/auth';
import { ok } from '../core/http';
import type { AppEnv, Row } from '../core/types';

const m = new Hono<AppEnv>();
const round = (n: number | null, d = 1) => (n === null || n === undefined ? null : Math.round(n * 10 ** d) / 10 ** d);

m.get('/analytics/summary', requireAuth, requireRole('agent', 'approver', 'admin'), async (c) => {
  const org = c.get('user').org;
  const [s, byDept] = await Promise.all([
    c.env.DB.prepare(`SELECT COUNT(*) AS total,
      SUM(CASE WHEN status IN ('resolved','closed') THEN 1 ELSE 0 END) AS resolved,
      SUM(CASE WHEN resolved_at IS NOT NULL THEN 1 ELSE 0 END) AS done,
      SUM(CASE WHEN resolved_at IS NOT NULL AND resolved_at <= resolve_due_at THEN 1 ELSE 0 END) AS on_time,
      AVG(CASE WHEN resolved_at IS NOT NULL THEN (julianday(resolved_at) - julianday(created_at)) * 24 END) AS avg_hours
      FROM tickets WHERE organization_id = ?`).bind(org).first<Row>(),
    c.env.DB.prepare(`SELECT d.id, d.name, COUNT(t.id) AS total
      FROM departments d LEFT JOIN tickets t ON t.department_id = d.id
      WHERE d.organization_id = ? GROUP BY d.id ORDER BY d.name`).bind(org).all<Row>(),
  ]);
  const done = s?.done ?? 0;
  return ok(c, {
    totalTickets: s?.total ?? 0,
    resolvedTickets: s?.resolved ?? 0,
    avgResolutionHours: round(s?.avg_hours ?? null),
    slaCompliancePct: done > 0 ? round(((s?.on_time ?? 0) / done) * 100) : null,
    byDepartment: byDept.results.map((d) => ({ departmentId: d.id, name: d.name, total: d.total })),
  });
});

export default m;
