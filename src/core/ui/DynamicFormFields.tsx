import type { CustomFieldConfig, CustomFieldsConfig, TicketType } from '../../types/contract';

export function resolveCustomFieldsForContext(
  customFields: CustomFieldsConfig | undefined | null,
  departmentId?: string,
  ticketType?: TicketType,
  categoryId?: string
): CustomFieldConfig[] {
  if (!customFields) return [];

  let allFields: CustomFieldConfig[] = [];
  if (Array.isArray(customFields)) {
    allFields = customFields;
  } else {
    const globalFields = Array.isArray(customFields.global) ? customFields.global : [];
    const deptFields =
      departmentId && Array.isArray(customFields[departmentId])
        ? customFields[departmentId]
        : [];
    const typeFields =
      ticketType && Array.isArray(customFields[ticketType]) ? customFields[ticketType] : [];
    const seen = new Set<string>();
    for (const field of [...globalFields, ...deptFields, ...typeFields]) {
      if (!seen.has(field.key)) {
        seen.add(field.key);
        allFields.push(field);
      }
    }
  }

  return allFields.filter((field) => {
    if (field.departmentId && departmentId && field.departmentId !== departmentId) {
      return false;
    }
    if (field.departmentId && !departmentId) {
      return false;
    }
    if (field.categoryId && categoryId && field.categoryId !== categoryId) {
      return false;
    }
    if (field.categoryId && !categoryId) {
      return false;
    }
    if (field.ticketTypes && field.ticketTypes.length > 0 && ticketType) {
      if (!field.ticketTypes.includes(ticketType)) {
        return false;
      }
    }
    return true;
  });
}

export interface DynamicFormFieldsProps {
  fields: CustomFieldConfig[];
  values: Record<string, unknown>;
  errors?: Record<string, string>;
  onChange: (key: string, value: unknown) => void;
  disabled?: boolean;
}

const inputBaseClass =
  'w-full min-h-10 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--brand-emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-emerald-soft)] disabled:opacity-60';

export function DynamicFormFields({
  fields,
  values,
  errors,
  onChange,
  disabled = false,
}: DynamicFormFieldsProps) {
  if (fields.length === 0) return null;

  return (
    <div className="space-y-4 border-t border-[var(--border-subtle)] pt-5">
      <div className="text-sm font-semibold text-[var(--text-primary)]">
        Additional details
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const id = `cf-${field.key}`;
          const value = values[field.key] ?? field.defaultValue ?? '';
          const fieldError = errors?.[field.key] ?? errors?.[`customFields.${field.key}`];

          if (field.type === 'boolean' || field.type === 'checkbox') {
            return (
              <div key={field.key} className="sm:col-span-2">
                <label
                  htmlFor={id}
                  className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2"
                >
                  <input
                    id={id}
                    type="checkbox"
                    checked={Boolean(value)}
                    disabled={disabled}
                    onChange={(e) => onChange(field.key, e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--brand-emerald)]"
                  />
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {field.label}
                    {field.required ? (
                      <span className="ml-1 text-[var(--brand-crimson-text)]">*</span>
                    ) : null}
                  </span>
                </label>
                {field.helpText ? (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{field.helpText}</p>
                ) : null}
                {fieldError ? (
                  <p className="mt-1 text-xs text-[var(--brand-crimson-text)]">{fieldError}</p>
                ) : null}
              </div>
            );
          }

          if (field.type === 'textarea') {
            return (
              <div key={field.key} className="sm:col-span-2">
                <label
                  htmlFor={id}
                  className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                >
                  {field.label}
                  {field.required ? (
                    <span className="ml-1 text-[var(--brand-crimson-text)]">*</span>
                  ) : null}
                </label>
                <textarea
                  id={id}
                  rows={3}
                  required={field.required}
                  disabled={disabled}
                  placeholder={field.placeholder}
                  value={String(value)}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className={inputBaseClass}
                />
                {field.helpText ? (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{field.helpText}</p>
                ) : null}
                {fieldError ? (
                  <p className="mt-1 text-xs text-[var(--brand-crimson-text)]">{fieldError}</p>
                ) : null}
              </div>
            );
          }

          if (field.type === 'select') {
            const normalizedOptions = (field.options ?? []).map((opt) =>
              typeof opt === 'string' ? { label: opt, value: opt } : opt
            );
            return (
              <div key={field.key}>
                <label
                  htmlFor={id}
                  className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                >
                  {field.label}
                  {field.required ? (
                    <span className="ml-1 text-[var(--brand-crimson-text)]">*</span>
                  ) : null}
                </label>
                <select
                  id={id}
                  required={field.required}
                  disabled={disabled}
                  value={String(value)}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className={inputBaseClass}
                >
                  <option value="">Select {field.label.toLowerCase()}</option>
                  {normalizedOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {field.helpText ? (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{field.helpText}</p>
                ) : null}
                {fieldError ? (
                  <p className="mt-1 text-xs text-[var(--brand-crimson-text)]">{fieldError}</p>
                ) : null}
              </div>
            );
          }

          const inputType =
            field.type === 'number'
              ? 'number'
              : field.type === 'date'
                ? 'date'
                : field.type === 'email'
                  ? 'email'
                  : field.type === 'url'
                    ? 'url'
                    : 'text';

          return (
            <div key={field.key}>
              <label
                htmlFor={id}
                className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
              >
                {field.label}
                {field.required ? (
                  <span className="ml-1 text-[var(--brand-crimson-text)]">*</span>
                ) : null}
              </label>
              <input
                id={id}
                type={inputType}
                required={field.required}
                disabled={disabled}
                placeholder={field.placeholder}
                value={String(value)}
                onChange={(e) =>
                  onChange(
                    field.key,
                    field.type === 'number' && e.target.value !== ''
                      ? Number(e.target.value)
                      : e.target.value
                  )
                }
                className={inputBaseClass}
              />
              {field.helpText ? (
                <p className="mt-1 text-xs text-[var(--text-muted)]">{field.helpText}</p>
              ) : null}
              {fieldError ? (
                <p className="mt-1 text-xs text-[var(--brand-crimson-text)]">{fieldError}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
