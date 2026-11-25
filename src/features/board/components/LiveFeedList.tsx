import { ArrowUpRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isTicketMasked } from '../../../core/capabilities';
import {
  formatDateTime,
  PriorityText,
  StatusText,
  TicketTitleText,
} from '../../../core/ui';
import type { BoardFeedItem } from '../../../types/contract';

function normalizeConfidence(value: number | null): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  return Math.max(0, Math.min(100, value <= 1 ? Math.round(value * 100) : Math.round(value)));
}

export function LiveFeedList({
  feed,
  canOpenTickets,
}: {
  feed: BoardFeedItem[];
  canOpenTickets: boolean;
}) {
  if (feed.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-8 text-center text-sm text-[var(--text-secondary)]">
        No recent activity in the live feed yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-subtle)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[660px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-muted)]">
              <th className="px-5 py-3">Item</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3 text-right">AI confidence</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-5 py-3 text-right">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
            {feed.map((item) => {
              const masked = isTicketMasked(item.title);
              const showLink = canOpenTickets && !masked;
              const confidencePct = normalizeConfidence(item.aiConfidence);

              return (
                <tr
                  key={item.id}
                  className="group transition-colors hover:bg-[var(--bg-surface)]/70"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {masked ? (
                        <Lock
                          className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]"
                          aria-hidden="true"
                        />
                      ) : null}
                      {showLink ? (
                        <Link
                          to={`/tickets/${item.id}`}
                          className="inline-flex items-center gap-1 font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--brand-emerald-text)]"
                        >
                          <TicketTitleText title={item.title} />
                          <ArrowUpRight
                            className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                            aria-hidden="true"
                          />
                        </Link>
                      ) : (
                        <span className="font-medium">
                          <TicketTitleText title={item.title} />
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      {item.reference ? (
                        <>
                          <span className="font-mono tabular-nums">{item.reference}</span>
                          <span aria-hidden="true">·</span>
                        </>
                      ) : null}
                      {item.type ? <span>{item.type}</span> : null}
                      {item.categoryName ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{item.categoryName}</span>
                        </>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[var(--text-secondary)]">
                    {item.departmentName ?? '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <PriorityText priority={item.priority} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {confidencePct !== null ? (
                      <div className="inline-flex items-center justify-end gap-2">
                        <div
                          aria-hidden="true"
                          className="h-1.5 w-12 overflow-hidden rounded-full bg-[var(--bg-surface-alt)]"
                        >
                          <div
                            style={{ width: `${confidencePct}%` }}
                            className="h-full rounded-full bg-[var(--brand-emerald)]"
                          />
                        </div>
                        <span className="font-mono text-xs text-[var(--text-secondary)] tabular-nums">
                          {confidencePct}%
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusText status={item.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs text-[var(--text-muted)] tabular-nums whitespace-nowrap">
                    {formatDateTime(item.updatedAt ?? item.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
