import { RefreshCw } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage, isForbiddenError } from '../../../core/api';
import { useCapabilities } from '../../../core/capabilities';
import {
  EmptyState,
  ForbiddenState,
  LoadingSkeleton,
  PageHeader,
  StateGate,
  formatDateTime,
} from '../../../core/ui';
import { usePolling } from '../../../core/usePolling';
import type { BoardResponse } from '../../../types/contract';
import { getBoard } from '../api';
import { BoardTotalsStrip } from '../components/BoardTotalsStrip';
import { DepartmentTile } from '../components/DepartmentTile';
import { LiveFeedList } from '../components/LiveFeedList';

const POLL_INTERVAL_MS = 10_000;

export function BoardPage() {
  const { canAccess } = useCapabilities();
  const [board, setBoard] = useState<BoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchBoard = useCallback(async () => {
    if (!hasLoadedRef.current) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const data = await getBoard();
      setBoard(data);
      setError(null);
      setForbidden(false);
      setLastUpdated(data.generatedAt ?? new Date().toISOString());
      hasLoadedRef.current = true;
    } catch (err) {
      if (isForbiddenError(err)) {
        setForbidden(true);
        setError(null);
      } else {
        setError(getErrorMessage(err, 'Failed to load service desk board.'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const { trigger } = usePolling(fetchBoard, {
    intervalMs: POLL_INTERVAL_MS,
    enabled: !forbidden,
    immediate: true,
  });

  const canSubmit = canAccess({ module: 'tickets', permission: 'tickets:create' });
  const canOpenTickets = canAccess({ module: 'tickets', permission: 'tickets:read' });

  const isEmpty =
    Boolean(board) &&
    board!.departments.length === 0 &&
    board!.feed.length === 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Operations board"
        description={
          lastUpdated
            ? `Live multi-department service overview · Refreshed ${formatDateTime(lastUpdated)}`
            : 'Live multi-department service overview · Updates every 10 seconds'
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => void trigger()}
              disabled={refreshing || loading}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-60 whitespace-nowrap"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              Refresh
            </button>
            {canSubmit ? (
              <Link
                to="/submit"
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--brand-emerald)] px-4 py-2 text-sm font-medium text-[var(--brand-emerald-fg)] transition-colors hover:bg-[var(--brand-emerald-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] whitespace-nowrap"
              >
                New request
              </Link>
            ) : null}
          </>
        }
      />

      <StateGate
        loading={loading}
        forbidden={forbidden}
        error={error}
        empty={isEmpty}
        onRetry={() => void trigger()}
        skeleton={<LoadingSkeleton variant="board" />}
        forbiddenState={
          <ForbiddenState
            title="Board access restricted"
            description="Your account does not have permission to view the operations board."
          />
        }
        emptyState={
          <EmptyState
            title="No department activity yet"
            description="Departments and live service tickets will appear here once configured and submitted."
            actionLabel={canSubmit ? 'Submit first request' : 'Refresh board'}
            actionTo={canSubmit ? '/submit' : undefined}
            onAction={canSubmit ? undefined : () => void trigger()}
          />
        }
      >
        {board ? (
          <div className="space-y-8">
            <BoardTotalsStrip totals={board.totals} />

            <section aria-labelledby="board-departments-heading" className="space-y-4">
              <div className="flex items-baseline justify-between gap-4">
                <h2
                  id="board-departments-heading"
                  className="text-base font-semibold text-[var(--text-primary)]"
                >
                  Departments
                </h2>
                <span className="font-mono text-xs text-[var(--text-muted)] tabular-nums">
                  {board.departments.length} active
                </span>
              </div>
              {board.departments.length === 0 ? (
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-8 text-center text-sm text-[var(--text-secondary)]">
                  No departments available on this board.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {board.departments.map((dept) => (
                    <DepartmentTile key={dept.id} department={dept} />
                  ))}
                </div>
              )}
            </section>

            <section aria-labelledby="board-feed-heading" className="space-y-4">
              <div className="flex items-baseline justify-between gap-4">
                <h2
                  id="board-feed-heading"
                  className="text-base font-semibold text-[var(--text-primary)]"
                >
                  Live feed
                </h2>
                <span className="font-mono text-xs text-[var(--text-muted)] tabular-nums">
                  {board.feed.length} recent items
                </span>
              </div>
              <LiveFeedList feed={board.feed} canOpenTickets={canOpenTickets} />
            </section>
          </div>
        ) : null}
      </StateGate>
    </div>
  );
}
