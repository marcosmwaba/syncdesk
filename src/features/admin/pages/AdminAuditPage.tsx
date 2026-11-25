import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage, isForbiddenError } from '../../../core/api';
import {
  EmptyState,
  ForbiddenState,
  LoadingSkeleton,
  PageHeader,
  StateGate,
  formatDateTime,
} from '../../../core/ui';
import type { AuditLogEntry } from '../../../types/contract';
import { listAdminAudit } from '../api';
import { AdminSubNav } from '../components/AdminSubNav';

export function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const fetchAudit = useCallback(async (cursor?: string) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await listAdminAudit(cursor);
      const items = Array.isArray(res.data) ? res.data : [];
      setEntries((prev) => (cursor ? [...prev, ...items] : items));
      setNextCursor(res.meta?.nextCursor ?? null);
      setError(null);
      setForbidden(false);
    } catch (err) {
      if (isForbiddenError(err)) {
        setForbidden(true);
        setError(null);
      } else {
        setError(getErrorMessage(err, 'Failed to load audit log.'));
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void fetchAudit();
  }, [fetchAudit]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="Chronological record of administrative, permission, and ticket actions."
        actions={
          <button
            type="button"
            onClick={() => void fetchAudit()}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)] disabled:opacity-60 whitespace-nowrap"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
        }
      />

      <AdminSubNav />

      <StateGate
        loading={loading}
        forbidden={forbidden}
        error={error}
        empty={entries.length === 0}
        onRetry={() => void fetchAudit()}
        skeleton={<LoadingSkeleton variant="table" rows={6} />}
        forbiddenState={
          <ForbiddenState
            title="Audit log forbidden"
            description="Your account does not have permission to inspect audit records."
          />
        }
        emptyState={
          <EmptyState
            title="No audit events recorded"
            description="Administrative and security events will appear here as actions occur."
            actionLabel="Refresh audit log"
            onAction={() => void fetchAudit()}
          />
        }
      >
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-subtle)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[740px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-muted)]">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-[var(--bg-surface)]">
                      <td className="px-4 py-3.5 font-mono text-xs text-[var(--text-muted)] tabular-nums whitespace-nowrap">
                        {formatDateTime(entry.createdAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-[var(--text-primary)]">
                          {entry.actorName ?? entry.actorEmail ?? 'System'}
                        </div>
                        {entry.actorEmail && entry.actorName ? (
                          <div className="text-xs text-[var(--text-muted)]">
                            {entry.actorEmail}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-medium text-[var(--brand-emerald-text)]">
                        {entry.action}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[var(--text-secondary)]">
                        <span>{entry.entityType}</span>
                        {entry.entityId ? (
                          <>
                            <span aria-hidden="true" className="mx-1.5 text-[var(--text-muted)]">·</span>
                            <span className="font-mono">{entry.entityId}</span>
                          </>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[var(--text-secondary)]">
                        {entry.summary ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {nextCursor ? (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void fetchAudit(nextCursor)}
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
