import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isTicketMasked } from '../../../core/capabilities';
import {
  formatDateTime,
  PriorityText,
  StatusText,
  TicketTitleText,
  TypeText,
} from '../../../core/ui';
import type { Ticket } from '../../../types/contract';

export interface TicketListTableProps {
  tickets: Ticket[];
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export function TicketListTable({
  tickets,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: TicketListTableProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-subtle)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-muted)]">
                <th className="px-4 py-3">Request</th>
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
                        {ticket.categoryName ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{ticket.categoryName}</span>
                          </>
                        ) : null}
                        {ticket.assigneeName ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Assigned to {ticket.assigneeName}</span>
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

      {hasMore && onLoadMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            disabled={loadingMore}
            onClick={onLoadMore}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-5 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-60 whitespace-nowrap"
          >
            {loadingMore ? 'Loading more...' : 'Load more'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
