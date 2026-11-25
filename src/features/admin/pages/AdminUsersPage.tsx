import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiClientError, getErrorMessage, isForbiddenError } from '../../../core/api';
import { useAuth } from '../../../core/auth';
import {
  EmptyState,
  ForbiddenState,
  LoadingSkeleton,
  Modal,
  PageHeader,
  StateGate,
} from '../../../core/ui';
import type { AdminUser } from '../../../types/contract';
import { createAdminUser, listAdminUsers, updateAdminUser } from '../api';
import { AdminSubNav } from '../components/AdminSubNav';

const inputClass =
  'min-h-10 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--brand-emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-emerald-soft)]';

export function AdminUsersPage() {
  const { config } = useAuth();
  const departments = config?.departments ?? [];

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const data = await listAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      if (isForbiddenError(err)) {
        setForbidden(true);
      } else {
        setError(getErrorMessage(err, 'Failed to load users.'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openCreateModal = () => {
    setEditingUser(null);
    setEmail('');
    setName('');
    setRole('requester');
    setDepartmentId('');
    setActive(true);
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setEmail(user.email);
    setName(user.name);
    setRole(user.role);
    setDepartmentId(user.departmentId ?? '');
    setActive(user.active);
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSaving(true);

    try {
      if (editingUser) {
        const updated = await updateAdminUser(editingUser.id, {
          name: name.trim(),
          role: role.trim(),
          departmentId: departmentId || null,
          active,
        });
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? updated : u))
        );
      } else {
        const created = await createAdminUser({
          email: email.trim(),
          name: name.trim(),
          role: role.trim(),
          departmentId: departmentId || null,
          active,
        });
        setUsers((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) {
        setFieldErrors(err.fields);
      }
      setFormError(getErrorMessage(err, 'Failed to save user.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & roles"
        description="Manage service desk accounts, role assignments, and department memberships."
        actions={
          !forbidden ? (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--brand-emerald)] px-4 py-2 text-sm font-medium text-[var(--brand-emerald-fg)] transition-colors hover:bg-[var(--brand-emerald-hover)] whitespace-nowrap"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add user
            </button>
          ) : null
        }
      />

      <AdminSubNav />

      <StateGate
        loading={loading}
        forbidden={forbidden}
        error={error}
        empty={users.length === 0}
        onRetry={() => void loadUsers()}
        skeleton={<LoadingSkeleton variant="table" rows={5} />}
        forbiddenState={
          <ForbiddenState
            title="User management forbidden"
            description="Your account does not have permission to manage workspace users."
          />
        }
        emptyState={
          <EmptyState
            title="No users found"
            description="Add your first service desk user to assign roles and department queues."
            actionLabel="Add first user"
            onAction={openCreateModal}
          />
        }
      >
        <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-subtle)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-muted)]">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--bg-surface)]">
                    <td className="px-4 py-3.5 font-medium text-[var(--text-primary)]">
                      {u.name}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-secondary)]">
                      {u.email}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-[var(--text-primary)]">
                      {u.role}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-secondary)]">
                      {u.departmentName ?? u.departmentId ?? '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs font-medium ${
                          u.active
                            ? 'text-[var(--brand-emerald-text)]'
                            : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        className="rounded px-2.5 py-1 text-xs font-medium text-[var(--brand-emerald-text)] hover:bg-[var(--brand-emerald-soft)]"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </StateGate>

      <Modal
        open={modalOpen}
        title={editingUser ? `Edit ${editingUser.name}` : 'Create user'}
        description={
          editingUser
            ? 'Update role, department, or account status.'
            : 'Provision a new SyncDesk user account.'
        }
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError ? (
            <div
              role="alert"
              className="rounded-md border border-[var(--brand-crimson-border)] bg-[var(--brand-crimson-soft)] px-3.5 py-2.5 text-xs text-[var(--brand-crimson-text)]"
            >
              {formError}
            </div>
          ) : null}

          {!editingUser ? (
            <div>
              <label
                htmlFor="admin-user-email"
                className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
              >
                Email *
              </label>
              <input
                id="admin-user-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
              {fieldErrors.email ? (
                <p className="mt-1 text-xs text-[var(--brand-crimson-text)]">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>
          ) : null}

          <div>
            <label
              htmlFor="admin-user-name"
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Full name *
            </label>
            <input
              id="admin-user-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
            {fieldErrors.name ? (
              <p className="mt-1 text-xs text-[var(--brand-crimson-text)]">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="admin-user-role"
                className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
              >
                Role *
              </label>
              <input
                id="admin-user-role"
                type="text"
                required
                placeholder="requester, agent, admin"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="admin-user-dept"
                className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
              >
                Department
              </label>
              <select
                id="admin-user-dept"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className={inputClass}
              >
                <option value="">None</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--brand-emerald)]"
            />
            Account active
          </label>

          <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="min-h-10 rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-10 rounded-md bg-[var(--brand-emerald)] px-4 py-2 text-sm font-medium text-[var(--brand-emerald-fg)] hover:bg-[var(--brand-emerald-hover)] disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingUser ? 'Save changes' : 'Create user'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
