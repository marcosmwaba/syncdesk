import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { BoardLoadLevel, TicketPriority, TicketStatus, TicketType } from '../../types/contract';
import { formatTicketTitle, isTicketMasked } from '../capabilities';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-balance text-[26px] leading-tight font-semibold text-[var(--text-primary)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function TicketTitleText({
  title,
  className = '',
}: {
  title: string | null | undefined;
  className?: string;
}) {
  const masked = isTicketMasked(title);
  return (
    <span
      className={`${masked ? 'italic text-[var(--text-muted)]' : 'text-[var(--text-primary)]'} ${className}`}
    >
      {formatTicketTitle(title)}
    </span>
  );
}

export function formatLabelText(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function StatusText({ status }: { status: TicketStatus }) {
  const normalized = status.toLowerCase();
  let colorClass = 'text-[var(--text-secondary)]';
  if (normalized === 'open') {
    colorClass = 'text-[var(--brand-copper-text)] font-medium';
  } else if (normalized === 'in_progress' || normalized === 'in progress') {
    colorClass = 'text-[var(--text-primary)] font-semibold';
  } else if (normalized === 'resolved' || normalized === 'closed') {
    colorClass = 'text-[var(--brand-emerald-text)] font-medium';
  }
  return (
    <span className={`text-xs whitespace-nowrap ${colorClass}`}>
      {formatLabelText(status)}
    </span>
  );
}

export function PriorityText({ priority }: { priority: TicketPriority }) {
  const normalized = priority.toLowerCase();
  let colorClass = 'text-[var(--text-secondary)]';
  if (normalized === 'urgent' || normalized === 'critical') {
    colorClass = 'text-[var(--brand-crimson-text)] font-semibold';
  } else if (normalized === 'high') {
    colorClass = 'text-[var(--brand-copper-text)] font-medium';
  }
  return (
    <span className={`text-xs font-medium whitespace-nowrap ${colorClass}`}>
      {formatLabelText(priority)}
    </span>
  );
}

export function TypeText({ type }: { type: TicketType }) {
  return (
    <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
      {formatLabelText(type)}
    </span>
  );
}

export function LoadLevelIndicator({ level }: { level: BoardLoadLevel }) {
  const styles: Record<BoardLoadLevel, { text: string; bg: string; border: string; label: string }> = {
    calm: {
      text: 'text-[var(--brand-emerald-text)]',
      bg: 'bg-[var(--brand-emerald-soft)]',
      border: 'border-[var(--brand-emerald-border)]',
      label: 'Calm',
    },
    busy: {
      text: 'text-[var(--brand-copper-text)]',
      bg: 'bg-[var(--brand-copper-soft)]',
      border: 'border-[var(--brand-copper-border)]',
      label: 'Busy',
    },
    congested: {
      text: 'text-[var(--brand-crimson-text)]',
      bg: 'bg-[var(--brand-crimson-soft)]',
      border: 'border-[var(--brand-crimson-border)]',
      label: 'Congested',
    },
  };

  const cfg = styles[level] ?? styles.calm;

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${cfg.bg} ${cfg.border} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
}

export function MetricTile({
  label,
  value,
  tone = 'neutral',
  sublabel,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  tone?: 'neutral' | 'emerald' | 'copper' | 'crimson';
  sublabel?: string;
  icon?: LucideIcon;
}) {
  const valueColor =
    tone === 'emerald'
      ? 'text-[var(--brand-emerald-text)]'
      : tone === 'copper'
        ? 'text-[var(--brand-copper-text)]'
        : tone === 'crimson'
          ? 'text-[var(--brand-crimson-text)]'
          : 'text-[var(--text-primary)]';

  const iconTone =
    tone === 'emerald'
      ? 'bg-[var(--brand-emerald-soft)] text-[var(--brand-emerald-text)]'
      : tone === 'copper'
        ? 'bg-[var(--brand-copper-soft)] text-[var(--brand-copper-text)]'
        : tone === 'crimson'
          ? 'bg-[var(--brand-crimson-soft)] text-[var(--brand-crimson-text)]'
          : 'bg-[var(--bg-surface)] text-[var(--text-secondary)]';

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-subtle)] transition-[border-color,box-shadow] duration-150 hover:border-[var(--border-strong)]">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-medium text-[var(--text-muted)]">{label}</div>
        {Icon ? (
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconTone}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        ) : null}
      </div>
      <div className={`mt-2.5 font-mono text-3xl font-semibold tabular-nums ${valueColor}`}>
        {value}
      </div>
      {sublabel ? (
        <div className="mt-1.5 text-xs text-[var(--text-secondary)]">{sublabel}</div>
      ) : null}
    </div>
  );
}

export function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
