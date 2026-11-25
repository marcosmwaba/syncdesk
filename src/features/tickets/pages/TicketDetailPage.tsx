import { ArrowLeft, Edit3, Lock } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getErrorMessage, isForbiddenError } from '../../../core/api';
import { useAuth } from '../../../core/auth';
import { isTicketMasked, useCapabilities } from '../../../core/capabilities';
import {
  EmptyState,
  ForbiddenState,
  LoadingSkeleton,
  PriorityText,
  StateGate,
  StatusText,
  TicketTitleText,
  TypeText,
  formatDateTime,
  formatLabelText,
} from '../../../core/ui';
import type { TicketComment, TicketDetail } from '../../../types/contract';
import {
  addTicketComment,
  getTicket,
  listTicketComments,
  updateTicket,
  updateTicketStatus,
} from '../api';
import { CommentThread } from '../components/CommentThread';

const DEFAULT_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { config } = useAuth();
  const { canAccess } = useCapabilities();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const [statusBusy, setStatusBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editPriority, setEditPriority] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadTicket = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const data = await getTicket(id);
      setTicket(data);
      setEditPriority(data.priority);
      setEditDepartmentId(data.departmentId);
      if (Array.isArray(data.comments)) {
        setComments(data.comments);
      }
    } catch (err) {
      if (isForbiddenError(err)) {
        setForbidden(true);
      } else {
        setError(getErrorMessage(err, 'Failed to load ticket details.'));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadComments = useCallback(async () => {
    if (!id) return;
    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const list = await listTicketComments(id);
      setComments(list);
    } catch (err) {
      if (!isForbiddenError(err)) {
        setCommentsError(getErrorMessage(err, 'Failed to load comments.'));
      }
    } finally {
      setCommentsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadTicket();
    void loadComments();
  }, [loadTicket, loadComments]);

  const handleStatusChange = async (nextStatus: string) => {
    if (!id || !ticket || nextStatus === ticket.status) return;
    setStatusBusy(true);
    setActionError(null);
    try {
      const updated = await updateTicketStatus(id, { status: nextStatus });
      setTicket(updated);
    } catch (err) {
      if (isForbiddenError(err)) {
        setActionError('You do not have permission to change this ticket status.');
      } else {
        setActionError(getErrorMessage(err, 'Failed to update status.'));
      }
    } finally {
      setStatusBusy(false);
    }
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingEdit(true);
    setActionError(null);
    try {
      const updated = await updateTicket(id, {
        priority: editPriority,
        departmentId: editDepartmentId,
      });
      setTicket(updated);
      setEditing(false);
    } catch (err) {
      if (isForbiddenError(err)) {
        setActionError('You do not have permission to edit this ticket.');
      } else {
        setActionError(getErrorMessage(err, 'Failed to update ticket.'));
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAddComment = async (body: string, internal: boolean) => {
    if (!id) return;
    const created = await addTicketComment(id, { body, internal });
    setComments((prev) => [...prev, created]);
  };

  const canEdit = canAccess({ module: 'tickets', permission: 'tickets:update' });
  const canComment = canAccess({ module: 'tickets', permission: 'tickets:comment' }) ||
    canAccess({ module: 'tickets', permission: 'tickets:read' });
  const transitions = ticket?.availableTransitions ?? [];
  const priorities = config?.visibility?.priorities ?? DEFAULT_PRIORITIES;
  const departments = config?.departments ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          to="/my-tickets"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to tickets
        </Link>
      </div>

      <StateGate
        loading={loading}
        forbidden={forbidden}
        error={error}
        empty={!ticket}
        onRetry={() => void loadTicket()}
        skeleton={<LoadingSkeleton variant="detail" />}
        forbiddenState={
          <ForbiddenState
            title="Ticket access forbidden"
            description="You do not have permission to view this ticket."
          />
        }
        emptyState={
          <EmptyState
            title="Ticket not found"
            description="The requested ticket could not be located."
            actionLabel="Return to my tickets"
            actionTo="/my-tickets"
          />
        }
      >
        {ticket ? (
          <div className="space-y-6">
            <article className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-subtle)]">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span className="font-mono tabular-nums">
                      {ticket.reference ?? ticket.id}
                    </span>
                    <span aria-hidden="true">·</span>
                    <TypeText type={ticket.type} />
                    <span aria-hidden="true">·</span>
                    <StatusText status={ticket.status} />
                    <span aria-hidden="true">·</span>
                    <PriorityText priority={ticket.priority} />
                  </div>
                  <h1 className="mt-2 flex items-center gap-2 text-balance text-2xl font-semibold text-[var(--text-primary)]">
                    {isTicketMasked(ticket.title) ? (
                      <Lock className="h-5 w-5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                    ) : null}
                    <TicketTitleText title={ticket.title} />
                  </h1>
                </div>

                {canEdit && !isTicketMasked(ticket.title) ? (
                  <button
                    type="button"
                    onClick={() => setEditing((v) => !v)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] whitespace-nowrap"
                  >
                    <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                    {editing ? 'Close edit' : 'Edit details'}
                  </button>
                ) : null}
              </div>

              {actionError ? (
                <div
                  role="alert"
                  className="mt-4 rounded-md border border-[var(--brand-crimson-border)] bg-[var(--brand-crimson-soft)] px-3.5 py-2.5 text-xs text-[var(--brand-crimson-text)]"
                >
                  {actionError}
                </div>
              ) : null}

              {editing ? (
                <form
                  onSubmit={handleSaveEdit}
                  className="mt-5 grid grid-cols-1 gap-4 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:grid-cols-3"
                >
                  <div>
                    <label
                      htmlFor="edit-priority"
                      className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
                    >
                      Priority
                    </label>
                    <select
                      id="edit-priority"
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      className="min-h-10 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
                    >
                      {priorities.map((p) => (
                        <option key={p} value={p}>
                          {formatLabelText(p)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-department"
                      className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
                    >
                      Department
                    </label>
                    <select
                      id="edit-department"
                      value={editDepartmentId}
                      onChange={(e) => setEditDepartmentId(e.target.value)}
                      className="min-h-10 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="min-h-10 w-full rounded-md bg-[var(--brand-emerald)] px-4 py-2 text-sm font-medium text-[var(--brand-emerald-fg)] hover:bg-[var(--brand-emerald-hover)] disabled:opacity-60"
                    >
                      {savingEdit ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <div className="text-xs text-[var(--text-muted)]">Department</div>
                  <div className="mt-1 font-medium text-[var(--text-primary)]">
                    {ticket.departmentName ?? ticket.departmentId}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)]">Category</div>
                  <div className="mt-1 font-medium text-[var(--text-primary)]">
                    {ticket.categoryName ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)]">Requester</div>
                  <div className="mt-1 font-medium text-[var(--text-primary)]">
                    {ticket.requesterName ?? ticket.requesterEmail ?? 'Confidential'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)]">Created</div>
                  <div className="mt-1 font-mono text-xs text-[var(--text-primary)] tabular-nums">
                    {formatDateTime(ticket.createdAt)}
                  </div>
                </div>
              </div>

              {ticket.description ? (
                <div className="mt-6 border-t border-[var(--border-subtle)] pt-5">
                  <h2 className="text-xs font-medium text-[var(--text-muted)]">
                    Description
                  </h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                    {ticket.description}
                  </p>
                </div>
              ) : null}

              {ticket.customFields && Object.keys(ticket.customFields).length > 0 ? (
                <div className="mt-6 border-t border-[var(--border-subtle)] pt-5">
                  <h2 className="text-xs font-medium text-[var(--text-muted)]">
                    Additional fields
                  </h2>
                  <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {Object.entries(ticket.customFields).map(([key, val]) => (
                      <div
                        key={key}
                        className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5"
                      >
                        <dt className="text-xs text-[var(--text-muted)]">
                          {formatLabelText(key)}
                        </dt>
                        <dd className="mt-0.5 text-sm font-medium text-[var(--text-primary)]">
                          {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val ?? '—')}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}

              {transitions.length > 0 ? (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-5">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    Transition status
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {transitions.map((next) => (
                      <button
                        key={next}
                        type="button"
                        disabled={statusBusy || next === ticket.status}
                        onClick={() => void handleStatusChange(next)}
                        className={`min-h-9 rounded-md border px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                          next === ticket.status
                            ? 'border-[var(--brand-emerald)] bg-[var(--brand-emerald-soft)] text-[var(--brand-emerald-text)]'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                        }`}
                      >
                        {formatLabelText(next)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>

            <CommentThread
              comments={comments}
              loading={commentsLoading}
              error={commentsError}
              canComment={canComment}
              onRetry={() => void loadComments()}
              onAddComment={handleAddComment}
            />
          </div>
        ) : null}
      </StateGate>
    </div>
  );
}
