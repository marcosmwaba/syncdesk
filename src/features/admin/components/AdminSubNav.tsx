import { NavLink } from 'react-router-dom';
import { useCapabilities } from '../../../core/capabilities';

const ADMIN_TABS = [
  { label: 'All Tickets', to: '/admin/tickets', permission: 'admin:tickets' },
  { label: 'Audit Log', to: '/admin/audit', permission: 'admin:audit' },
  { label: 'Users', to: '/admin/users', permission: 'admin:users' },
  { label: 'Departments & Categories', to: '/admin/departments', permission: 'admin:departments' },
];

export function AdminSubNav() {
  const { canAccess } = useCapabilities();

  const visibleTabs = ADMIN_TABS.filter((tab) =>
    canAccess({ module: 'admin', permission: tab.permission })
  );

  if (visibleTabs.length <= 1) return null;

  return (
    <div>
      <nav
        aria-label="Administration sections"
        className="inline-flex flex-wrap gap-1 rounded-md bg-[var(--bg-surface)] p-1"
      >
        {visibleTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[var(--bg-elevated)] text-[var(--brand-emerald-text)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
