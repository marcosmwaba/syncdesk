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
  TicketTitleText,
  TypeText,
  formatDateTime,
  formatLabelText,
} from '../../../core/ui';
import type { Ticket } from '../../../types/contract';
import { getAgentQueue, updateQueueTicketStatus } from '../api';
import { QueueFilters } from '../components/QueueFilters';

const DEFAULT_STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];
const DEFAULT_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export function AgentQueuePage() {
  const { config } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const statuses = config?.visibility?.statuses ?? DEFAULT_STATUSES;
  const priorities = config?.visibility?.priorities ?? DEFAULT_PRIORITIES;
  const departments = config?.departments ?? [];

  const fetchQueue = useCallback(
    async (cursor?: string) => {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setActionError(null);

      try {
        const res = await getAgentQueue({
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
          setError(getErrorMessage(err, 'Failed to load agent queue.'));
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [statusFilter, priorityFilter, departmentFilter]
  );

  useEffect(() => {
    void fetchQueue();
  }, [fetchQueue]);

  const handleQuickStatus = async (ticketId: string, nextStatus: string) => {
    setUpdatingId(ticketId);
    setActionError(null);
    try {
      const updated = await updateQueueTicketStatus(ticketId, { status: nextStatus });
      setTickets((prev) =>
        prev.map((item) => (item.id === ticketId ? { ...item, ...updated } : item))
      );
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to update ticket status.'));
    } finally {
      setUpdatingId(null);
    }
  };

  const resetFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setDepartmentFilter('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent queue"
        description="Triage incoming requests, incidents, and changes across departments."
        actions={
          <button
            type="button"
            onClick={() => void fetchQueue()}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)] disabled:opacity-60 whitespace-nowrap"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
        }
      />

      <QueueFilters
        status={statusFilter}
        priority={priorityFilter}
        department={departmentFilter}
        statuses={statuses}
        priorities={priorities}
        departments={departments}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onDepartmentChange={setDepartmentFilter}
        onReset={resetFilters}
      />

      {actionError ? (
        <div
          role="alert"
          className="rounded-md border border-[var(--brand-crimson-border)] bg-[var(--brand-crimson-soft)] px-4 py-3 text-sm text-[var(--brand-crimson-text)]"
        >
          {actionError}
        </div>
      ) : null}

      <StateGate
        loading={loading}
        forbidden={forbidden}
        error={error}
        empty={tickets.length === 0}
        onRetry={() => void fetchQueue()}
        skeleton={<LoadingSkeleton variant="table" rows={6} />}
        forbiddenState={
          <ForbiddenState
            title="Agent queue forbidden"
            description="Your account does not have permission to operate the agent queue."
          />
        }
        emptyState={
          <EmptyState
            title="Queue is clear"
            description={
              statusFilter || priorityFilter || departmentFilter
                ? 'No tickets match your current queue filters.'
                : 'There are currently no tickets awaiting triage in your queue.'
            }
            actionLabel={
              statusFilter || priorityFilter || departmentFilter
                ? 'Reset filters'
                : 'Refresh queue'
            }
            onAction={
              statusFilter || priorityFilter || departmentFilter
                ? resetFilters
                : () => void fetchQueue()
            }
          />
        }
      >
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-subtle)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-muted)]">
                    <th className="px-4 py-3">Ticket</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
                  {tickets.map((ticket) => {
                    const masked = isTicketMasked(ticket.title);
                    return (
                      <tr
                        key={ticket.id}
                        className="transition-colors hover:bg-[var(--bg-surface)]"
                      >
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
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                            <span className="font-mono tabular-nums">
                              {ticket.reference ?? ticket.id}
                            </span>
                            {ticket.requesterName ? (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{ticket.requesterName}</span>
                              </>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <TypeText type={ticket.type} />
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[var(--text-secondary)]">
                          {ticket.departmentName ?? ticket.departmentId}
                        </td>
                        <td className="px-4 py-3.5">
                          <PriorityText priority={ticket.priority} />
                        </td>
                        <td className="px-4 py-3.5">
                          <select
                            aria-label={`Status for ${ticket.reference ?? ticket.id}`}
                            value={ticket.status}
                            disabled={updatingId === ticket.id}
                            onChange={(e) => void handleQuickStatus(ticket.id, e.target.value)}
                            className="min-h-8 rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] focus:border-[var(--brand-emerald)] focus:outline-none"
                          >
                            {statuses.map((s) => (
                              <option key={s} value={s}>
                                {formatLabelText(s)}
                              </option>
                            ))}
                          </select>
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
                onClick={() => void fetchQueue(nextCursor)}
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
