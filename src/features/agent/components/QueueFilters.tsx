import { formatLabelText } from '../../../core/ui';
import type { DepartmentConfig } from '../../../types/contract';

export interface QueueFiltersProps {
  status: string;
  priority: string;
  department: string;
  statuses: string[];
  priorities: string[];
  departments: DepartmentConfig[];
  onStatusChange: (val: string) => void;
  onPriorityChange: (val: string) => void;
  onDepartmentChange: (val: string) => void;
  onReset: () => void;
}

export function QueueFilters({
  status,
  priority,
  department,
  statuses,
  priorities,
  departments,
  onStatusChange,
  onPriorityChange,
  onDepartmentChange,
  onReset,
}: QueueFiltersProps) {
  const hasFilters = Boolean(status || priority || department);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:flex-row sm:items-end">
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label
            htmlFor="queue-status"
            className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
          >
            Status
          </label>
          <select
            id="queue-status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
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
            htmlFor="queue-priority"
            className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
          >
            Priority
          </label>
          <select
            id="queue-priority"
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value)}
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
            htmlFor="queue-department"
            className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
          >
            Department
          </label>
          <select
            id="queue-department"
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
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

      {hasFilters ? (
        <button
          type="button"
          onClick={onReset}
          className="min-h-10 shrink-0 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] whitespace-nowrap"
        >
          Reset filters
        </button>
      ) : null}
    </div>
  );
}
