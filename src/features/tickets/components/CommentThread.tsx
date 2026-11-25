import { MessageSquare, Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { getErrorMessage } from '../../../core/api';
import { formatDateTime } from '../../../core/ui';
import type { TicketComment } from '../../../types/contract';

export interface CommentThreadProps {
  comments: TicketComment[];
  loading: boolean;
  error: string | null;
  canComment: boolean;
  onRetry: () => void;
  onAddComment: (body: string, internal: boolean) => Promise<void>;
}

export function CommentThread({
  comments,
  loading,
  error,
  canComment,
  onRetry,
  onAddComment,
}: CommentThreadProps) {
  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onAddComment(trimmed, internal);
      setBody('');
      setInternal(false);
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Unable to post comment.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      aria-labelledby="comments-heading"
      className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-subtle)]"
    >
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
          <h2 id="comments-heading" className="text-base font-semibold text-[var(--text-primary)]">
            Activity & comments
          </h2>
        </div>
        <span className="font-mono text-xs text-[var(--text-muted)] tabular-nums">
          {comments.length}
        </span>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3" aria-busy="true">
          <div className="h-16 animate-pulse rounded-md bg-[var(--bg-surface)]" />
          <div className="h-16 animate-pulse rounded-md bg-[var(--bg-surface)]" />
        </div>
      ) : error ? (
        <div className="mt-4 rounded-md border border-[var(--brand-crimson-border)] bg-[var(--brand-crimson-soft)] p-4 text-sm text-[var(--brand-crimson-text)]">
          <p>{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-xs font-medium underline"
          >
            Retry loading comments
          </button>
        </div>
      ) : comments.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          No comments posted yet. Add an update below to start the conversation.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--border-subtle)]">
          {comments.map((comment) => (
            <li key={comment.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--text-primary)]">
                    {comment.authorName ?? 'Restricted user'}
                  </span>
                  {comment.authorRole ? (
                    <>
                      <span aria-hidden="true" className="text-[var(--text-muted)]">·</span>
                      <span className="text-[var(--text-muted)]">{comment.authorRole}</span>
                    </>
                  ) : null}
                  {comment.internal ? (
                    <>
                      <span aria-hidden="true" className="text-[var(--text-muted)]">·</span>
                      <span className="font-medium text-[var(--brand-copper-text)]">
                        Internal note
                      </span>
                    </>
                  ) : null}
                </div>
                <time className="font-mono text-[var(--text-muted)] tabular-nums">
                  {formatDateTime(comment.createdAt)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                {comment.body}
              </p>
            </li>
          ))}
        </ul>
      )}

      {canComment ? (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-3 border-t border-[var(--border-subtle)] pt-5"
        >
          <label
            htmlFor="new-comment"
            className="block text-xs font-medium text-[var(--text-secondary)]"
          >
            Add a comment
          </label>
          <textarea
            id="new-comment"
            rows={3}
            required
            placeholder="Write an update or question..."
            value={body}
            disabled={submitting}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-emerald-soft)]"
          />
          {submitError ? (
            <p className="text-xs text-[var(--brand-crimson-text)]">{submitError}</p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={internal}
                disabled={submitting}
                onChange={(e) => setInternal(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--brand-emerald)]"
              />
              Mark as internal note
            </label>
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--brand-emerald)] px-4 py-2 text-sm font-medium text-[var(--brand-emerald-fg)] transition-colors hover:bg-[var(--brand-emerald-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-60 whitespace-nowrap"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              {submitting ? 'Posting...' : 'Post comment'}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
