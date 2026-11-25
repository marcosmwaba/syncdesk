import { AlertTriangle, Inbox, Lock, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface LoadingSkeletonProps {
  variant?: 'board' | 'table' | 'detail' | 'form' | 'cards';
  rows?: number;
}

export function LoadingSkeleton({
  variant = 'table',
  rows = 5,
}: LoadingSkeletonProps) {
  if (variant === 'board') {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"
            >
              <div className="h-3 w-24 rounded bg-[var(--bg-surface-alt)]" />
              <div className="mt-4 h-7 w-16 rounded bg-[var(--bg-surface-alt)]" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 rounded bg-[var(--bg-surface-alt)]" />
                <div className="h-4 w-16 rounded bg-[var(--bg-surface-alt)]" />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="h-10 rounded bg-[var(--bg-surface-alt)]" />
                <div className="h-10 rounded bg-[var(--bg-surface-alt)]" />
                <div className="h-10 rounded bg-[var(--bg-surface-alt)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        aria-busy="true"
        aria-label="Loading items"
      >
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"
          >
            <div className="h-4 w-40 rounded bg-[var(--bg-surface-alt)]" />
            <div className="mt-3 h-3 w-28 rounded bg-[var(--bg-surface-alt)]" />
            <div className="mt-6 h-3 w-full rounded bg-[var(--bg-surface-alt)]" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading details">
        <div className="animate-pulse rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
          <div className="h-4 w-32 rounded bg-[var(--bg-surface-alt)]" />
          <div className="mt-3 h-7 w-2/3 rounded bg-[var(--bg-surface-alt)]" />
          <div className="mt-6 space-y-2">
            <div className="h-3 w-full rounded bg-[var(--bg-surface-alt)]" />
            <div className="h-3 w-5/6 rounded bg-[var(--bg-surface-alt)]" />
            <div className="h-3 w-4/6 rounded bg-[var(--bg-surface-alt)]" />
          </div>
        </div>
        <div className="animate-pulse rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
          <div className="h-4 w-28 rounded bg-[var(--bg-surface-alt)]" />
          <div className="mt-4 space-y-3">
            <div className="h-12 rounded bg-[var(--bg-surface-alt)]" />
            <div className="h-12 rounded bg-[var(--bg-surface-alt)]" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div
        className="animate-pulse space-y-5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6"
        aria-busy="true"
        aria-label="Loading form"
      >
        <div className="h-5 w-44 rounded bg-[var(--bg-surface-alt)]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-10 rounded bg-[var(--bg-surface-alt)]" />
          <div className="h-10 rounded bg-[var(--bg-surface-alt)]" />
        </div>
        <div className="h-10 rounded bg-[var(--bg-surface-alt)]" />
        <div className="h-28 rounded bg-[var(--bg-surface-alt)]" />
        <div className="h-10 w-36 rounded bg-[var(--bg-surface-alt)]" />
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
      aria-busy="true"
      aria-label="Loading table"
    >
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
        <div className="h-4 w-48 animate-pulse rounded bg-[var(--bg-surface-alt)]" />
      </div>
      <div className="divide-y divide-[var(--border-subtle)]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/5 animate-pulse rounded bg-[var(--bg-surface-alt)]" />
              <div className="h-3 w-2/5 animate-pulse rounded bg-[var(--bg-surface-alt)]" />
            </div>
            <div className="h-4 w-20 animate-pulse rounded bg-[var(--bg-surface-alt)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)]">
        <Inbox className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-[var(--text-primary)]">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm text-[var(--text-secondary)]">{description}</p>
      {actionLabel && actionTo ? (
        <Link
          to={actionTo}
          className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--brand-emerald)] px-4 py-2 text-sm font-medium text-[var(--brand-emerald-fg)] transition-colors hover:bg-[var(--brand-emerald-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] whitespace-nowrap"
        >
          {actionLabel}
        </Link>
      ) : actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--brand-emerald)] px-4 py-2 text-sm font-medium text-[var(--brand-emerald-fg)] transition-colors hover:bg-[var(--brand-emerald-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] whitespace-nowrap"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Unable to load data',
  message,
  onRetry,
  retryLabel = 'Try again',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-lg border border-[var(--brand-crimson-border)] bg-[var(--brand-crimson-soft)] px-6 py-10 text-center"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--brand-crimson-border)] bg-[var(--bg-elevated)] text-[var(--brand-crimson-text)]">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-[var(--text-primary)]">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm text-[var(--brand-crimson-text)]">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] whitespace-nowrap"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

export interface ForbiddenStateProps {
  title?: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
}

export function ForbiddenState({
  title = 'Access forbidden',
  description = 'Your account does not have permission to view this resource. Contact an administrator if you require access.',
  backTo = '/board',
  backLabel = 'Return to live board',
}: ForbiddenStateProps) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--brand-crimson-border)] bg-[var(--brand-crimson-soft)] text-[var(--brand-crimson-text)]">
        <Lock className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-4 font-mono text-xs font-semibold tracking-wide text-[var(--brand-crimson-text)] tabular-nums">
        403 · FORBIDDEN
      </p>
      <h1 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{title}</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          to={backTo}
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--brand-emerald)] px-4 py-2 text-sm font-medium text-[var(--brand-emerald-fg)] transition-colors hover:bg-[var(--brand-emerald-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] whitespace-nowrap"
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
}

export interface StateGateProps {
  loading: boolean;
  forbidden?: boolean;
  error: string | null;
  empty?: boolean;
  skeleton?: ReactNode;
  emptyState?: ReactNode;
  forbiddenState?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}

export function StateGate({
  loading,
  forbidden = false,
  error,
  empty = false,
  skeleton,
  emptyState,
  forbiddenState,
  onRetry,
  children,
}: StateGateProps) {
  if (loading) {
    return <>{skeleton ?? <LoadingSkeleton />}</>;
  }
  if (forbidden) {
    return <>{forbiddenState ?? <ForbiddenState />}</>;
  }
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }
  if (empty) {
    return (
      <>
        {emptyState ?? (
          <EmptyState
            title="Nothing here yet"
            description="No records matched your current view."
          />
        )}
      </>
    );
  }
  return <>{children}</>;
}
