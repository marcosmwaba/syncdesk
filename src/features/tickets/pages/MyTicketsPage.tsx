import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage, isForbiddenError } from '../../../core/api';
import { useAuth } from '../../../core/auth';
import { useCapabilities } from '../../../core/capabilities';
import {
  EmptyState,
  ForbiddenState,
  LoadingSkeleton,
  PageHeader,
  StateGate,
  formatLabelText,
} from '../../../core/ui';
import type { Ticket } from '../../../types/contract';
import { listTickets } from '../api';
import { TicketListTable } from '../components/TicketListTable';

const DEFAULT_STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];
const DEFAULT_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export function MyTicketsPage() {
  const { config } = useAuth();
  const { canAccess } = useCapabilities();

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
        const res = await listTickets({
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
          setError(getErrorMessage(err, 'Failed to load your tickets.'));
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

  const canCreate = canAccess({ module: 'tickets', permission: 'tickets:create' });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My tickets"
        description="Track submitted requests, incidents, and changes across departments."
        actions={
          canCreate ? (
            <Link
              to="/submit"
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--brand-emerald)] px-4 py-2 text-sm font-medium text-[var(--brand-emerald-fg)] transition-colors hover:bg-[var(--brand-emerald-hover)] whitespace-nowrap"
            >
              Submit ticket
            </Link>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="my-filter-status"
            className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
          >
            Status
          </label>
          <select
            id="my-filter-status"
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
            htmlFor="my-filter-priority"
            className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
          >
            Priority
          </label>
          <select
            id="my-filter-priority"
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
            htmlFor="my-filter-department"
            className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
          >
            Department
          </label>
          <select
            id="my-filter-department"
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
        skeleton={<LoadingSkeleton variant="table" rows={5} />}
        forbiddenState={
          <ForbiddenState
            title="Tickets access restricted"
            description="Your account does not have permission to view tickets."
          />
        }
        emptyState={
          <EmptyState
            title="No tickets found"
            description={
              statusFilter || priorityFilter || departmentFilter
                ? 'No tickets match your selected filters.'
                : 'You have not submitted any requests, incidents, or changes yet.'
            }
            actionLabel={
              statusFilter || priorityFilter || departmentFilter
                ? 'Clear filters'
                : canCreate
                  ? 'Submit your first ticket'
                  : 'Refresh'
            }
            actionTo={
              !statusFilter && !priorityFilter && !departmentFilter && canCreate
                ? '/submit'
                : undefined
            }
            onAction={
              statusFilter || priorityFilter || departmentFilter
                ? () => {
                    setStatusFilter('');
                    setPriorityFilter('');
                    setDepartmentFilter('');
                  }
                : canCreate
                  ? undefined
                  : () => void fetchTickets()
            }
          />
        }
      >
        <TicketListTable
          tickets={tickets}
          hasMore={Boolean(nextCursor)}
          loadingMore={loadingMore}
          onLoadMore={() => {
            if (nextCursor) void fetchTickets(nextCursor);
          }}
        />
      </StateGate>
    </div>
  );
}
