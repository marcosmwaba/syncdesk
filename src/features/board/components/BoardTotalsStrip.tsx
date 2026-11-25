import { Activity, CheckCircle2, Clock, Layers } from 'lucide-react';
import { MetricTile } from '../../../core/ui';
import type { BoardTotals } from '../../../types/contract';

export function BoardTotalsStrip({ totals }: { totals: BoardTotals }) {
  const totalCount =
    totals.total ?? totals.open + totals.inProgress + totals.resolved;
  const resolutionRate =
    totalCount > 0 ? Math.round((totals.resolved / totalCount) * 100) : null;

  return (
    <section
      aria-label="Service desk totals"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <MetricTile
        label="Total active & resolved"
        value={totalCount}
        tone="neutral"
        icon={Layers}
        sublabel="Across all departments"
      />
      <MetricTile
        label="Open queue"
        value={totals.open}
        tone="copper"
        icon={Clock}
        sublabel="Awaiting assignment or triage"
      />
      <MetricTile
        label="In progress"
        value={totals.inProgress}
        tone="neutral"
        icon={Activity}
        sublabel="Actively being worked"
      />
      <MetricTile
        label="Resolved"
        value={totals.resolved}
        tone="emerald"
        icon={CheckCircle2}
        sublabel={
          resolutionRate !== null
            ? `${resolutionRate}% completion rate`
            : 'Completed requests'
        }
      />
    </section>
  );
}
