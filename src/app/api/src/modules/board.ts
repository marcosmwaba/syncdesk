import { Hono } from 'hono';
import { requireAuth } from '../core/auth';
import { ok } from '../core/http';
import { TICKET_SELECT, maskedFor } from '../core/domain';
import type { AppEnv, Row } from '../core/types';

const m = new Hono<AppEnv>();

const level = (load: number) => (load < 0.5 ? 'calm' : load < 0.85 ? 'busy' : 'congested');

m.get('/board', requireAuth, async (c) => {
  const u = c.get('user');
  const soon = new Date(Date.now() + 2 * 3600000).toISOString();
  const [deps, counts, feed, risk] = await Promise.all([
    c.env.DB.prepare('SELECT id, name, slug, capacity, visibility FROM departments WHERE organization_id = ? AND active = 1 ORDER BY name').bind(u.org).all<Row>(),
    c.env.DB.prepare('SELECT department_id, status, COUNT(*) AS n FROM tickets WHERE organization_id = ? GROUP BY department_id, status').bind(u.org).all<Row>(),
    c.env.DB.prepare(`${TICKET_SELECT} WHERE t.organization_id = ? AND d.visibility != 'counts_only' ORDER BY t.created_at DESC LIMIT 20`).bind(u.org).all<Row>(),
    c.env.DB.prepare("SELECT COUNT(*) AS n FROM tickets WHERE organization_id = ? AND status IN ('open','in_progress') AND resolve_due_at < ?").bind(u.org, soon).first<Row>(),
  ]);

  const tally: Record<string, Record<string, number>> = {};
  for (const r of counts.results) (tally[r.department_id] ??= {})[r.status] = r.n;

  const totals = { open: 0, inProgress: 0, resolved: 0, closed: 0, slaAtRisk: risk?.n ?? 0 };
  const departments = deps.results.map((d) => {
    const t = tally[d.id] ?? {};
    const n = { open: t.open ?? 0, inProgress: t.in_progress ?? 0, resolved: t.resolved ?? 0, closed: t.closed ?? 0 };
    totals.open += n.open; totals.inProgress += n.inProgress; totals.resolved += n.resolved; totals.closed += n.closed;
    const load = Math.round(((n.open + n.inProgress) / Math.max(d.capacity, 1)) * 100) / 100;
    return { id: d.id, name: d.name, slug: d.slug, visibility: d.visibility, capacity: d.capacity, counts: n, load, level: level(load) };
  });

  const items = feed.results.map((r) => {
    const masked = maskedFor(u, r);
    return {
      id: r.id,
      department: { id: r.department_id, name: r.department_name },
      priority: r.priority,
      status: r.status,
      aiPriority: r.ai_priority,
      aiConfidence: r.ai_confidence,
      title: masked ? null : r.title,
      masked,
      createdAt: r.created_at,
    };
  });

  return ok(c, { totals, departments, feed: items });
});

export default m;
