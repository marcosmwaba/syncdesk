import { Lock, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage, isForbiddenError } from '../../../core/api';
import { useAuth } from '../../../core/auth';
import { isTicketMasked } from '../../../core/capabilities';
import {
  EmptyState,
  ForbiddenState,
  LoadingSkeleton,
  PageHeader,
  PriorityText,
  StateGate,
  StatusText,
  TicketTitleText,
  TypeText,
  formatDateTime,
  formatLabelText,
} from '../../../core/ui';
import type { Ticket } from '../../../types/contract';
import { listAdminTickets } from '../api';
import { AdminSubNav } from '../components/AdminSubNav';

const DEFAULT_STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];
const DEFAULT_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export function AdminTicketsPage() {
  const { config } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const statuses = config?.visibility?.statuses ?? DEFAULT_STATUSES;
  const priorities = config?.visibility?.priorities ?? DEFAULT_PRIORITIES;
  const departments = config?.departments ?? [];

  const fetchTickets = useCallback(
    async (cursor?: string) => {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      try {
        const res = await listAdminTickets({
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          department: departmentFilter || undefined,
          cursor,
        });
        const items = Array.isArray(res.data) ? res.data : [];
        setTickets((prev) => (cursor ? [...prev, ...items] : items));
        setNextCursor(res.meta?.nextCursor ?? null);
        setError(null);
        setForbidden(false);
      } catch (err) {
        if (isForbiddenError(err)) {
          setForbidden(true);
          setError(null);
        } else {
          setError(getErrorMessage(err, 'Failed to load admin tickets.'));
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [statusFilter, priorityFilter, departmentFilter]
  );

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin tickets"
        description="Organization-wide oversight of all service desk requests, incidents, and changes."
        actions={
          <button
            type="button"
            onClick={() => void fetchTickets()}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)] disabled:opacity-60 whitespace-nowrap"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
        }
      />

      <AdminSubNav />

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="admin-ticket-status"
            className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
          >
            Status
          </label>
          <select
            id="admin-ticket-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-10 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {formatLabelText(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="admin-ticket-priority"
            className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
          >
            Priority
          </label>
          <select
            id="admin-ticket-priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="min-h-10 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="">All priorities</option>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {formatLabelText(p)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="admin-ticket-department"
            className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
          >
            Department
          </label>
          <select
            id="admin-ticket-department"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="min-h-10 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <StateGate
        loading={loading}
        forbidden={forbidden}
        error={error}
        empty={tickets.length === 0}
        onRetry={() => void fetchTickets()}
        skeleton={<LoadingSkeleton variant="table" rows={6} />}
        forbiddenState={
          <ForbiddenState
            title="Admin ticket console forbidden"
            description="Administrator privileges are required to view all organization tickets."
          />
        }
        emptyState={
          <EmptyState
            title="No tickets found"
            description="No tickets match your current administrative filters."
            actionLabel="Reset filters"
            onAction={() => {
              setStatusFilter('');
              setPriorityFilter('');
              setDepartmentFilter('');
            }}
          />
        }
      >
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-subtle)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-muted)]">
                    <th className="px-4 py-3">Ticket</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Requester</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
                  {tickets.map((ticket) => {
                    const masked = isTicketMasked(ticket.title);
                    return (
                      <tr key={ticket.id} className="hover:bg-[var(--bg-surface)]">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {masked ? (
                              <Lock
                                className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]"
                                aria-hidden="true"
                              />
                            ) : null}
                            <Link
                              to={`/tickets/${ticket.id}`}
                              className="font-medium text-[var(--text-primary)] hover:text-[var(--brand-emerald-text)] hover:underline"
                            >
                              <TicketTitleText title={ticket.title} />
                            </Link>
                          </div>
                          <div className="mt-0.5 font-mono text-xs text-[var(--text-muted)] tabular-nums">
                            {ticket.reference ?? ticket.id}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <TypeText type={ticket.type} />
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[var(--text-secondary)]">
                          {ticket.departmentName ?? ticket.departmentId}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[var(--text-secondary)]">
                          {ticket.requesterName ?? ticket.requesterEmail ?? '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          <PriorityText priority={ticket.priority} />
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusText status={ticket.status} />
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-[var(--text-muted)] tabular-nums whitespace-nowrap">
                          {formatDateTime(ticket.updatedAt || ticket.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {nextCursor ? (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void fetchTickets(nextCursor)}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-5 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)] disabled:opacity-60 whitespace-nowrap"
              >
                {loadingMore ? 'Loading more...' : 'Load more'}
              </button>
            </div>
          ) : null}
        </div>
      </StateGate>
    </div>
  );
}
