import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiClientError, getErrorMessage, isForbiddenError } from '../../../core/api';
import { useAuth } from '../../../core/auth';
import {
  DynamicFormFields,
  EmptyState,
  ErrorState,
  ForbiddenState,
  LoadingSkeleton,
  PageHeader,
  formatLabelText,
  resolveCustomFieldsForContext,
} from '../../../core/ui';
import type { TicketPriority, TicketType } from '../../../types/contract';
import { createTicket } from '../api';

const DEFAULT_TYPES: TicketType[] = ['request', 'incident', 'change'];
const DEFAULT_PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

const inputClass =
  'min-h-10 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--brand-emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-emerald-soft)] disabled:opacity-60';

export function SubmitTicketPage() {
  const { status, config, configError, reloadBootstrap, reloadConfig } = useAuth();
  const navigate = useNavigate();

  const departments = useMemo(
    () => (config?.departments ?? []).filter((d) => d.active !== false),
    [config]
  );

  const allowedTypes = useMemo<TicketType[]>(() => {
    const fromCfg = config?.visibility?.allowedTicketTypes;
    return Array.isArray(fromCfg) && fromCfg.length > 0 ? fromCfg : DEFAULT_TYPES;
  }, [config]);

  const priorities = useMemo<string[]>(() => {
    const fromCfg = config?.visibility?.priorities;
    return Array.isArray(fromCfg) && fromCfg.length > 0 ? fromCfg : DEFAULT_PRIORITIES;
  }, [config]);

  const [type, setType] = useState<TicketType>(allowedTypes[0] ?? 'request');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customValues, setCustomValues] = useState<Record<string, unknown>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!departmentId && departments.length > 0) {
      setDepartmentId(departments[0].id);
    }
  }, [departments, departmentId]);

  useEffect(() => {
    if (!allowedTypes.includes(type) && allowedTypes.length > 0) {
      setType(allowedTypes[0]);
    }
  }, [allowedTypes, type]);

  const availableCategories = useMemo(() => {
    const all = (config?.categories ?? []).filter((c) => c.active !== false);
    if (!departmentId) return all;
    return all.filter((c) => !c.departmentId || c.departmentId === departmentId);
  }, [config, departmentId]);

  useEffect(() => {
    if (
      categoryId &&
      !availableCategories.some((c) => c.id === categoryId)
    ) {
      setCategoryId('');
    }
  }, [availableCategories, categoryId]);

  const customFields = useMemo(
    () =>
      resolveCustomFieldsForContext(
        config?.customFields,
        departmentId,
        type,
        categoryId || undefined
      ),
    [config, departmentId, type, categoryId]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    const nextFieldErrors: Record<string, string> = {};
    if (!departmentId) {
      nextFieldErrors.departmentId = 'Select a department.';
    }
    if (!title.trim()) {
      nextFieldErrors.title = 'Enter a short summary title.';
    }
    if (!description.trim()) {
      nextFieldErrors.description = 'Describe your request, incident, or change.';
    }
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const created = await createTicket({
        type,
        title: title.trim(),
        description: description.trim(),
        departmentId,
        categoryId: categoryId || undefined,
        priority,
        customFields: Object.keys(customValues).length > 0 ? customValues : undefined,
      });
      navigate(`/tickets/${created.id}`);
    } catch (err) {
      if (isForbiddenError(err)) {
        setForbidden(true);
        return;
      }
      if (err instanceof ApiClientError && err.fields) {
        setFieldErrors(err.fields);
      }
      setSubmitError(getErrorMessage(err, 'Unable to submit ticket.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Submit a ticket" />
        <LoadingSkeleton variant="form" />
      </div>
    );
  }

  if (status === 'forbidden' || forbidden) {
    return (
      <div className="py-6">
        <ForbiddenState
          title="Ticket submission forbidden"
          description="Your account does not have permission to submit tickets."
        />
      </div>
    );
  }

  if (configError || !config) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Submit a ticket" />
        <ErrorState
          title="Workspace configuration unavailable"
          message={configError ?? 'Could not load departments and form fields.'}
          onRetry={() => void (configError ? reloadConfig() : reloadBootstrap())}
        />
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Submit a ticket" />
        <EmptyState
          title="No departments available"
          description="Ask an administrator to configure at least one active department before submitting requests."
          actionLabel="View operations board"
          actionTo="/board"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Submit a ticket"
        description="Route a service request, incident report, or change proposal to the appropriate department."
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-subtle)]"
      >
        {submitError ? (
          <div
            role="alert"
            className="rounded-md border border-[var(--brand-crimson-border)] bg-[var(--brand-crimson-soft)] px-4 py-3 text-sm text-[var(--brand-crimson-text)]"
          >
            {submitError}
          </div>
        ) : null}

        <div>
          <span className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
            Ticket type
          </span>
          <div className="inline-flex flex-wrap gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1">
            {allowedTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`min-h-9 rounded px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  type === t
                    ? 'bg-[var(--brand-emerald)] text-[var(--brand-emerald-fg)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {formatLabelText(t)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="ticket-department"
              className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Department *
            </label>
            <select
              id="ticket-department"
              value={departmentId}
              disabled={submitting}
              onChange={(e) => setDepartmentId(e.target.value)}
              className={inputClass}
            >
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {fieldErrors.departmentId ? (
              <p className="mt-1 text-xs text-[var(--brand-crimson-text)]">
                {fieldErrors.departmentId}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="ticket-category"
              className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Category
            </label>
            <select
              id="ticket-category"
              value={categoryId}
              disabled={submitting || availableCategories.length === 0}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
            >
              <option value="">
                {availableCategories.length === 0 ? 'None configured' : 'Select category'}
              </option>
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="ticket-priority"
              className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Priority *
            </label>
            <select
              id="ticket-priority"
              value={priority}
              disabled={submitting}
              onChange={(e) => setPriority(e.target.value)}
              className={inputClass}
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {formatLabelText(p)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="ticket-title"
            className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
          >
            Subject *
          </label>
          <input
            id="ticket-title"
            type="text"
            required
            placeholder="Brief summary of the request, incident, or change"
            value={title}
            disabled={submitting}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
          {fieldErrors.title ? (
            <p className="mt-1 text-xs text-[var(--brand-crimson-text)]">
              {fieldErrors.title}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="ticket-description"
            className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
          >
            Description *
          </label>
          <textarea
            id="ticket-description"
            rows={5}
            required
            placeholder="Include relevant context, affected systems, timelines, or impact."
            value={description}
            disabled={submitting}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
          {fieldErrors.description ? (
            <p className="mt-1 text-xs text-[var(--brand-crimson-text)]">
              {fieldErrors.description}
            </p>
          ) : null}
        </div>

        <DynamicFormFields
          fields={customFields}
          values={customValues}
          errors={fieldErrors}
          disabled={submitting}
          onChange={(key, value) =>
            setCustomValues((prev) => ({ ...prev, [key]: value }))
          }
        />

        <div className="flex items-center justify-end gap-3 border-t border-[var(--border-subtle)] pt-5">
          <button
            type="button"
            disabled={submitting}
            onClick={() => navigate(-1)}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--brand-emerald)] px-5 py-2 text-sm font-medium text-[var(--brand-emerald-fg)] transition-colors hover:bg-[var(--brand-emerald-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-60 whitespace-nowrap"
          >
            {submitting ? 'Submitting...' : 'Submit ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}
