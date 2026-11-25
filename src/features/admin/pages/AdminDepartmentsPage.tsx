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
import type { AdminCategory, AdminDepartment } from '../../../types/contract';
import {
  createAdminCategory,
  createAdminDepartment,
  listAdminCategories,
  listAdminDepartments,
  updateAdminCategory,
  updateAdminDepartment,
} from '../api';
import { AdminSubNav } from '../components/AdminSubNav';

const inputClass =
  'min-h-10 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--brand-emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-emerald-soft)]';

export function AdminDepartmentsPage() {
  const { reloadConfig } = useAuth();

  const [tab, setTab] = useState<'departments' | 'categories'>('departments');
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  // Department modal state
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<AdminDepartment | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptActive, setDeptActive] = useState(true);

  // Category modal state
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<AdminCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catDeptId, setCatDeptId] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catActive, setCatActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const [depts, cats] = await Promise.all([
        listAdminDepartments(),
        listAdminCategories(),
      ]);
      setDepartments(Array.isArray(depts) ? depts : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err) {
      if (isForbiddenError(err)) {
        setForbidden(true);
      } else {
        setError(getErrorMessage(err, 'Failed to load departments and categories.'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const openCreateDept = () => {
    setEditingDept(null);
    setDeptName('');
    setDeptCode('');
    setDeptDesc('');
    setDeptActive(true);
    setFormError(null);
    setDeptModalOpen(true);
  };

  const openEditDept = (dept: AdminDepartment) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptCode(dept.code);
    setDeptDesc(dept.description ?? '');
    setDeptActive(dept.active);
    setFormError(null);
    setDeptModalOpen(true);
  };

  const openCreateCat = () => {
    setEditingCat(null);
    setCatName('');
    setCatDeptId('');
    setCatDesc('');
    setCatActive(true);
    setFormError(null);
    setCatModalOpen(true);
  };

  const openEditCat = (cat: AdminCategory) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatDeptId(cat.departmentId ?? '');
    setCatDesc(cat.description ?? '');
    setCatActive(cat.active);
    setFormError(null);
    setCatModalOpen(true);
  };

  const handleSaveDept = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editingDept) {
        const updated = await updateAdminDepartment(editingDept.id, {
          name: deptName.trim(),
          code: deptCode.trim(),
          description: deptDesc.trim() || null,
          active: deptActive,
        });
        setDepartments((prev) =>
          prev.map((d) => (d.id === editingDept.id ? updated : d))
        );
      } else {
        const created = await createAdminDepartment({
          name: deptName.trim(),
          code: deptCode.trim(),
          description: deptDesc.trim() || undefined,
          active: deptActive,
        });
        setDepartments((prev) => [...prev, created]);
      }
      setDeptModalOpen(false);
      await reloadConfig();
    } catch (err) {
      setFormError(
        err instanceof ApiClientError
          ? err.message
          : getErrorMessage(err, 'Failed to save department.')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCat = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editingCat) {
        const updated = await updateAdminCategory(editingCat.id, {
          name: catName.trim(),
          departmentId: catDeptId || null,
          description: catDesc.trim() || null,
          active: catActive,
        });
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCat.id ? updated : c))
        );
      } else {
        const created = await createAdminCategory({
          name: catName.trim(),
          departmentId: catDeptId || null,
          description: catDesc.trim() || undefined,
          active: catActive,
        });
        setCategories((prev) => [...prev, created]);
      }
      setCatModalOpen(false);
      await reloadConfig();
    } catch (err) {
      setFormError(
        err instanceof ApiClientError
          ? err.message
          : getErrorMessage(err, 'Failed to save category.')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments & categories"
        description="Configure routing departments and request categories reflected across all forms."
        actions={
          !forbidden ? (
            <button
              type="button"
              onClick={tab === 'departments' ? openCreateDept : openCreateCat}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--brand-emerald)] px-4 py-2 text-sm font-medium text-[var(--brand-emerald-fg)] transition-colors hover:bg-[var(--brand-emerald-hover)] whitespace-nowrap"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {tab === 'departments' ? 'Add department' : 'Add category'}
            </button>
          ) : null
        }
      />

      <AdminSubNav />

      <div className="inline-flex gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1">
        <button
          type="button"
          onClick={() => setTab('departments')}
          className={`min-h-9 rounded px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
            tab === 'departments'
              ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Departments ({departments.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('categories')}
          className={`min-h-9 rounded px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
            tab === 'categories'
              ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Categories ({categories.length})
        </button>
      </div>

      <StateGate
        loading={loading}
        forbidden={forbidden}
        error={error}
        empty={tab === 'departments' ? departments.length === 0 : categories.length === 0}
        onRetry={() => void loadAll()}
        skeleton={<LoadingSkeleton variant="table" rows={5} />}
        forbiddenState={
          <ForbiddenState
            title="Department administration forbidden"
            description="Your account does not have permission to manage departments or categories."
          />
        }
        emptyState={
          <EmptyState
            title={
              tab === 'departments' ? 'No departments configured' : 'No categories configured'
            }
            description={
              tab === 'departments'
                ? 'Create a department so users can route requests, incidents, and changes.'
                : 'Create categories to organize requests within departments.'
            }
            actionLabel={tab === 'departments' ? 'Add department' : 'Add category'}
            onAction={tab === 'departments' ? openCreateDept : openCreateCat}
          />
        }
      >
        {tab === 'departments' ? (
          <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-subtle)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-muted)]">
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
                  {departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-[var(--bg-surface)]">
                      <td className="px-4 py-3.5 font-medium text-[var(--text-primary)]">
                        {dept.name}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-[var(--text-secondary)]">
                        {dept.code}
                      </td>
                      <td className="px-4 py-3.5 text-[var(--text-secondary)]">
                        {dept.description ?? '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-xs font-medium ${
                            dept.active
                              ? 'text-[var(--brand-emerald-text)]'
                              : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {dept.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => openEditDept(dept)}
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
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-subtle)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-muted)]">
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-[var(--bg-surface)]">
                      <td className="px-4 py-3.5 font-medium text-[var(--text-primary)]">
                        {cat.name}
                      </td>
                      <td className="px-4 py-3.5 text-[var(--text-secondary)]">
                        {cat.departmentName ??
                          departments.find((d) => d.id === cat.departmentId)?.name ??
                          'Global'}
                      </td>
                      <td className="px-4 py-3.5 text-[var(--text-secondary)]">
                        {cat.description ?? '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-xs font-medium ${
                            cat.active
                              ? 'text-[var(--brand-emerald-text)]'
                              : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {cat.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => openEditCat(cat)}
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
        )}
      </StateGate>

      <Modal
        open={deptModalOpen}
        title={editingDept ? `Edit ${editingDept.name}` : 'Create department'}
        onClose={() => setDeptModalOpen(false)}
      >
        <form onSubmit={handleSaveDept} className="space-y-4">
          {formError ? (
            <div className="rounded-md border border-[var(--brand-crimson-border)] bg-[var(--brand-crimson-soft)] px-3.5 py-2.5 text-xs text-[var(--brand-crimson-text)]">
              {formError}
            </div>
          ) : null}
          <div>
            <label
              htmlFor="dept-name"
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Department name *
            </label>
            <input
              id="dept-name"
              type="text"
              required
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="dept-code"
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Code *
            </label>
            <input
              id="dept-code"
              type="text"
              required
              placeholder="e.g. IT, FIN, OPS"
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="dept-desc"
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Description
            </label>
            <textarea
              id="dept-desc"
              rows={2}
              value={deptDesc}
              onChange={(e) => setDeptDesc(e.target.value)}
              className={inputClass}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={deptActive}
              onChange={(e) => setDeptActive(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--brand-emerald)]"
            />
            Department active
          </label>
          <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
            <button
              type="button"
              onClick={() => setDeptModalOpen(false)}
              className="min-h-10 rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-10 rounded-md bg-[var(--brand-emerald)] px-4 py-2 text-sm font-medium text-[var(--brand-emerald-fg)] hover:bg-[var(--brand-emerald-hover)] disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingDept ? 'Save changes' : 'Create department'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={catModalOpen}
        title={editingCat ? `Edit ${editingCat.name}` : 'Create category'}
        onClose={() => setCatModalOpen(false)}
      >
        <form onSubmit={handleSaveCat} className="space-y-4">
          {formError ? (
            <div className="rounded-md border border-[var(--brand-crimson-border)] bg-[var(--brand-crimson-soft)] px-3.5 py-2.5 text-xs text-[var(--brand-crimson-text)]">
              {formError}
            </div>
          ) : null}
          <div>
            <label
              htmlFor="cat-name"
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Category name *
            </label>
            <input
              id="cat-name"
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="cat-dept"
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Department (optional)
            </label>
            <select
              id="cat-dept"
              value={catDeptId}
              onChange={(e) => setCatDeptId(e.target.value)}
              className={inputClass}
            >
              <option value="">All departments (global)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="cat-desc"
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Description
            </label>
            <textarea
              id="cat-desc"
              rows={2}
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              className={inputClass}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={catActive}
              onChange={(e) => setCatActive(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--brand-emerald)]"
            />
            Category active
          </label>
          <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
            <button
              type="button"
              onClick={() => setCatModalOpen(false)}
              className="min-h-10 rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-10 rounded-md bg-[var(--brand-emerald)] px-4 py-2 text-sm font-medium text-[var(--brand-emerald-fg)] hover:bg-[var(--brand-emerald-hover)] disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingCat ? 'Save changes' : 'Create category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
