import type { AuthUser, Row } from './types';

export const STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
export const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;
export const TYPES = ['request', 'incident', 'change'] as const;
export const VISIBILITY = ['full', 'masked', 'counts_only'] as const;
export const ROLES = ['requester', 'agent', 'approver', 'admin'] as const;

const NEXT: Record<string, string[]> = {
  open: ['in_progress'],
  in_progress: ['resolved'],
  resolved: ['closed', 'in_progress'],
  closed: [],
};
export const canTransition = (from: string, to: string) => (NEXT[from] ?? []).includes(to);

const SLA_HOURS: Record<string, [number, number]> = {
  critical: [1, 4],
  high: [2, 8],
  medium: [8, 24],
  low: [24, 72],
};
export function slaDue(priority: string, from = new Date()) {
  const [r, s] = SLA_HOURS[priority] ?? SLA_HOURS.medium;
  const at = (h: number) => new Date(from.getTime() + h * 3600000).toISOString();
  return { response: at(r), resolve: at(s) };
}

export const uid = (p: string) => `${p}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
export const now = () => new Date().toISOString();

export function auditStmt(
  db: D1Database, org: string, actor: string | null,
  action: string, entity: string, entityId: string, meta: unknown = {},
) {
  return db
    .prepare('INSERT INTO audit_logs (id, organization_id, actor_id, action, entity, entity_id, meta, created_at) VALUES (?,?,?,?,?,?,?,?)')
    .bind(uid('aud'), org, actor, action, entity, entityId, JSON.stringify(meta), now());
}

export const TICKET_SELECT = `SELECT t.*, u.name AS requester_name, u.email AS requester_email,
  d.name AS department_name, d.visibility AS dept_visibility
  FROM tickets t JOIN users u ON u.id = t.requester_id JOIN departments d ON d.id = t.department_id`;

export const getTicket = (db: D1Database, org: string, id: string) =>
  db.prepare(`${TICKET_SELECT} WHERE t.id = ? AND t.organization_id = ?`).bind(id, org).first<Row>();

export const isRestricted = (r: Row) => r.dept_visibility !== 'full' || r.confidential === 1;

export function maskedFor(u: AuthUser, r: Row): boolean {
  if (!isRestricted(r)) return false;
  if (r.requester_id === u.id) return false;
  if ((u.role === 'agent' || u.role === 'approver') && u.dept === r.department_id) return false;
  return true;
}

export function mapTicket(r: Row, masked: boolean, opts: { requester?: boolean } = {}) {
  const showReq = !masked || opts.requester;
  return {
    id: r.id,
    type: r.type,
    departmentId: r.department_id,
    departmentName: r.department_name,
    categoryId: r.category_id,
    priority: r.priority,
    status: r.status,
    confidential: !!r.confidential,
    needsTriage: !!r.needs_triage,
    aiPriority: r.ai_priority,
    aiConfidence: r.ai_confidence,
    title: masked ? null : r.title,
    description: masked ? null : r.description,
    requester: showReq ? { id: r.requester_id, name: r.requester_name, email: opts.requester ? r.requester_email : undefined } : null,
    assigneeId: r.assignee_id,
    customFields: masked ? null : JSON.parse(r.custom_fields || '{}'),
    responseDueAt: r.response_due_at,
    resolveDueAt: r.resolve_due_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    resolvedAt: r.resolved_at,
    masked,
  };
}
