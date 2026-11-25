import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage, isForbiddenError } from '../../../core/api';
import {
  EmptyState,
  ForbiddenState,
  LoadingSkeleton,
  MetricTile,
  PageHeader,
  StateGate,
} from '../../../core/ui';
import type { AnalyticsSummary } from '../../../types/contract';
import { getAnalyticsSummary } from '../api';
import {
  DepartmentLoadChart,
  PriorityBreakdownCard,
  StatusBreakdownCard,
  VolumeTrendChart,
} from '../components/AnalyticsCharts';

export function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const data = await getAnalyticsSummary();
      setSummary(data);
    } catch (err) {
      if (isForbiddenError(err)) {
        setForbidden(true);
      } else {
        setError(getErrorMessage(err, 'Failed to load analytics summary.'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const isEmpty =
    Boolean(summary) &&
    summary!.totals.total === 0 &&
    summary!.byDepartment.length === 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Service desk analytics"
        description="Cross-department throughput, priority mix, and resolution performance."
        actions={
          <button
            type="button"
            onClick={() => void loadSummary()}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)] disabled:opacity-60 whitespace-nowrap"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
        }
      />

      <StateGate
        loading={loading}
        forbidden={forbidden}
        error={error}
        empty={isEmpty}
        onRetry={() => void loadSummary()}
        skeleton={<LoadingSkeleton variant="board" />}
        forbiddenState={
          <ForbiddenState
            title="Analytics access restricted"
            description="Your account does not have permission to view service desk analytics."
          />
        }
        emptyState={
          <EmptyState
            title="No analytics data yet"
            description="Metrics and charts will populate once tickets are created across departments."
            actionLabel="Refresh analytics"
            onAction={() => void loadSummary()}
          />
        }
      >
        {summary ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricTile
                label="Total tickets"
                value={summary.totals.total}
                tone="neutral"
              />
              <MetricTile
                label="Open"
                value={summary.totals.open}
                tone="copper"
              />
              <MetricTile
                label="Resolved"
                value={summary.totals.resolved}
                tone="emerald"
              />
              <MetricTile
                label={
                  summary.totals.slaComplianceRate !== null &&
                  summary.totals.slaComplianceRate !== undefined
                    ? 'SLA compliance'
                    : 'Avg resolution'
                }
                value={
                  summary.totals.slaComplianceRate !== null &&
                  summary.totals.slaComplianceRate !== undefined
                    ? `${Math.round(
                        summary.totals.slaComplianceRate <= 1
                          ? summary.totals.slaComplianceRate * 100
                          : summary.totals.slaComplianceRate
                      )}%`
                    : summary.totals.avgResolutionHours !== null &&
                        summary.totals.avgResolutionHours !== undefined
                      ? `${summary.totals.avgResolutionHours.toFixed(1)}h`
                      : `${summary.totals.inProgress} active`
                }
                tone="emerald"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <StatusBreakdownCard items={summary.byStatus} />
              <PriorityBreakdownCard items={summary.byPriority} />
            </div>

            <DepartmentLoadChart departments={summary.byDepartment} />

            {summary.trend && summary.trend.length > 0 ? (
              <VolumeTrendChart trend={summary.trend} />
            ) : null}
          </div>
        ) : null}
      </StateGate>
    </div>
  );
}
