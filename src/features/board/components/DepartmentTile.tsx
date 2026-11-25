import { LoadLevelIndicator } from '../../../core/ui';
import type { BoardDepartmentTile } from '../../../types/contract';

function getInitials(name: string, code?: string): string {
  if (code) return code.slice(0, 3).toUpperCase();
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function DepartmentTile({
  department,
}: {
  department: BoardDepartmentTile;
}) {
  const total = department.open + department.inProgress + department.resolved;
  const openPct = total > 0 ? (department.open / total) * 100 : 0;
  const progressPct = total > 0 ? (department.inProgress / total) * 100 : 0;
  const resolvedPct = total > 0 ? (department.resolved / total) * 100 : 0;

  const badgeTone =
    department.loadLevel === 'congested'
      ? 'bg-[var(--brand-crimson-soft)] text-[var(--brand-crimson-text)]'
      : department.loadLevel === 'busy'
        ? 'bg-[var(--brand-copper-soft)] text-[var(--brand-copper-text)]'
        : 'bg-[var(--brand-emerald-soft)] text-[var(--brand-emerald-text)]';

  return (
    <article className="flex flex-col justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-subtle)] transition-[border-color,box-shadow] duration-150 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-card-hover)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-semibold ${badgeTone}`}
          >
            {getInitials(department.name, department.code)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-[var(--text-primary)]">
              {department.name}
            </h3>
            <p className="mt-0.5 font-mono text-xs text-[var(--text-muted)] tabular-nums">
              {department.code ? `${department.code} · ` : ''}
              {total} total
            </p>
          </div>
        </div>
        <LoadLevelIndicator level={department.loadLevel} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 rounded-lg bg-[var(--bg-surface)] px-3.5 py-3">
        <div>
          <div className="text-[11px] font-medium text-[var(--text-muted)]">Open</div>
          <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-[var(--brand-copper-text)]">
            {department.open}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-medium text-[var(--text-muted)]">In progress</div>
          <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-[var(--text-primary)]">
            {department.inProgress}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-medium text-[var(--text-muted)]">Resolved</div>
          <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-[var(--brand-emerald-text)]">
            {department.resolved}
          </div>
        </div>
      </div>

      <div
        className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface-alt)]"
        aria-label={`${department.name} workload distribution`}
      >
        {openPct > 0 ? (
          <div
            style={{ width: `${openPct}%` }}
            className="bg-[var(--brand-copper)] transition-all duration-300"
            title={`Open: ${department.open}`}
          />
        ) : null}
        {progressPct > 0 ? (
          <div
            style={{ width: `${progressPct}%` }}
            className="bg-[var(--bar-in-progress)] transition-all duration-300"
            title={`In progress: ${department.inProgress}`}
          />
        ) : null}
        {resolvedPct > 0 ? (
          <div
            style={{ width: `${resolvedPct}%` }}
            className="bg-[var(--brand-emerald)] transition-all duration-300"
            title={`Resolved: ${department.resolved}`}
          />
        ) : null}
      </div>
    </article>
  );
}
