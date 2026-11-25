import { formatLabelText } from '../../../core/ui';
import type {
  AnalyticsDepartmentBreakdown,
  AnalyticsPriorityBreakdown,
  AnalyticsStatusBreakdown,
  AnalyticsTrendPoint,
} from '../../../types/contract';

export function StatusBreakdownCard({
  items,
}: {
  items: AnalyticsStatusBreakdown[];
}) {
  const total = items.reduce((sum, i) => sum + i.count, 0);
  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-subtle)]">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          By status
        </h2>
        <span className="font-mono text-xs text-[var(--text-muted)] tabular-nums">
          {total} total
        </span>
      </div>
      <div className="mt-5 space-y-4">
        {items.map((item) => {
          const widthPct = Math.round((item.count / max) * 100);
          const sharePct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const norm = item.status.toLowerCase();
          const barColor =
            norm === 'resolved' || norm === 'closed'
              ? 'bg-[var(--brand-emerald)]'
              : norm === 'open'
                ? 'bg-[var(--brand-copper)]'
                : 'bg-[var(--bar-in-progress)]';

          return (
            <div key={item.status} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--text-secondary)]">
                  {formatLabelText(item.status)}
                </span>
                <span className="font-mono text-[var(--text-primary)] tabular-nums">
                  <span className="font-semibold">{item.count}</span>
                  <span className="ml-1.5 text-[var(--text-muted)]">({sharePct}%)</span>
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-alt)]">
                <div
                  style={{ width: `${widthPct}%` }}
                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PriorityBreakdownCard({
  items,
}: {
  items: AnalyticsPriorityBreakdown[];
}) {
  const total = items.reduce((sum, i) => sum + i.count, 0);
  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-subtle)]">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          By priority
        </h2>
        <span className="font-mono text-xs text-[var(--text-muted)] tabular-nums">
          {items.length} levels
        </span>
      </div>
      <div className="mt-5 space-y-4">
        {items.map((item) => {
          const widthPct = Math.round((item.count / max) * 100);
          const sharePct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const norm = item.priority.toLowerCase();
          const barColor =
            norm === 'urgent' || norm === 'critical'
              ? 'bg-[var(--brand-crimson)]'
              : norm === 'high'
                ? 'bg-[var(--brand-copper)]'
                : 'bg-[var(--brand-emerald)]';

          return (
            <div key={item.priority} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--text-secondary)]">
                  {formatLabelText(item.priority)}
                </span>
                <span className="font-mono text-[var(--text-primary)] tabular-nums">
                  <span className="font-semibold">{item.count}</span>
                  <span className="ml-1.5 text-[var(--text-muted)]">({sharePct}%)</span>
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-alt)]">
                <div
                  style={{ width: `${widthPct}%` }}
                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function DepartmentLoadChart({
  departments,
}: {
  departments: AnalyticsDepartmentBreakdown[];
}) {
  const maxTotal = Math.max(1, ...departments.map((d) => d.total));

  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-subtle)]">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Department workload distribution
        </h2>
        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-copper)]" />
            Open
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--bar-in-progress)]" />
            In progress
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-emerald)]" />
            Resolved
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {departments.map((dept) => {
          const openW = (dept.open / maxTotal) * 100;
          const progW = (dept.inProgress / maxTotal) * 100;
          const resW = (dept.resolved / maxTotal) * 100;

          return (
            <div key={dept.departmentId} className="space-y-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                <span className="font-medium text-[var(--text-primary)]">
                  {dept.departmentName}
                </span>
                <div className="flex items-center gap-3 font-mono text-[var(--text-secondary)] tabular-nums">
                  <span>{dept.open} open</span>
                  <span>{dept.inProgress} active</span>
                  <span>{dept.resolved} resolved</span>
                  {dept.avgResolutionHours !== null && dept.avgResolutionHours !== undefined ? (
                    <span className="text-[var(--text-muted)]">
                      {dept.avgResolutionHours.toFixed(1)}h avg
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--bg-surface-alt)]">
                {openW > 0 ? (
                  <div style={{ width: `${openW}%` }} className="bg-[var(--brand-copper)]" />
                ) : null}
                {progW > 0 ? (
                  <div
                    style={{ width: `${progW}%` }}
                    className="bg-[var(--bar-in-progress)]"
                  />
                ) : null}
                {resW > 0 ? (
                  <div style={{ width: `${resW}%` }} className="bg-[var(--brand-emerald)]" />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function VolumeTrendChart({ trend }: { trend: AnalyticsTrendPoint[] }) {
  if (trend.length === 0) return null;
  const maxVal = Math.max(1, ...trend.flatMap((p) => [p.created, p.resolved]));

  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-subtle)]">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Ticket volume vs resolution trend
        </h2>
        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-copper)]" />
            Created
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-emerald)]" />
            Resolved
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
        {trend.map((point) => {
          const createdH = Math.max(6, Math.round((point.created / maxVal) * 100));
          const resolvedH = Math.max(6, Math.round((point.resolved / maxVal) * 100));
          return (
            <div
              key={point.date}
              className="flex flex-col items-center rounded-lg bg-[var(--bg-surface)] p-3"
            >
              <div className="flex h-28 w-full items-end justify-center gap-2">
                <div
                  style={{ height: `${createdH}%` }}
                  className="w-4 rounded-t bg-[var(--brand-copper)] transition-all duration-300"
                  title={`Created: ${point.created}`}
                />
                <div
                  style={{ height: `${resolvedH}%` }}
                  className="w-4 rounded-t bg-[var(--brand-emerald)] transition-all duration-300"
                  title={`Resolved: ${point.resolved}`}
                />
              </div>
              <div className="mt-2.5 font-mono text-[11px] text-[var(--text-muted)] tabular-nums">
                {point.date}
              </div>
              <div className="mt-0.5 font-mono text-xs font-medium text-[var(--text-secondary)] tabular-nums">
                {point.created}/{point.resolved}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
