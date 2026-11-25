import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  Inbox,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  Moon,
  PlusCircle,
  Sun,
  Ticket,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../core/auth';
import { useCapabilities, type FeatureNavItem } from '../core/capabilities';
import { useTheme } from '../core/theme';
import { FEATURE_REGISTRY } from '../features/registry';

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutGrid,
  PlusCircle,
  Ticket,
  Inbox,
  BarChart3,
  ClipboardList,
  FileText,
  Users,
  Building2,
};

const GROUP_LABELS: Record<NonNullable<FeatureNavItem['group']>, string> = {
  workspace: 'Workspace',
  operations: 'Operations',
  admin: 'Administration',
};

function BrandMark() {
  return (
    <Link
      to="/board"
      className="inline-flex items-center whitespace-nowrap shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
    >
      <span className="font-display text-[19px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
        SyncDesk
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { getNavItems } = useCapabilities();
  const { resolvedTheme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = getNavItems(FEATURE_REGISTRY);

  const groupedNav = (['workspace', 'operations', 'admin'] as const)
    .map((group) => ({
      group,
      label: GROUP_LABELS[group],
      items: navItems.filter((item) => (item.group ?? 'workspace') === group),
    }))
    .filter((section) => section.items.length > 0);

  const isLoginRoute = location.pathname === '/login';

  const renderSidebarBody = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col justify-between gap-6 px-3.5 py-5">
      <div className="space-y-6">
        <div className="hidden px-2.5 lg:block">
          <BrandMark />
        </div>

        <nav aria-label="Workspace navigation" className="space-y-5">
          {groupedNav.map((section) => (
            <div key={section.group}>
              <div className="px-2.5 text-xs font-medium text-[var(--text-muted)]">
                {section.label}
              </div>
              <ul className="mt-1.5 space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon ? ICON_MAP[item.icon] : undefined;
                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.to}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          `flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                            isActive
                              ? 'bg-[var(--bg-elevated)] text-[var(--brand-emerald-text)] shadow-[var(--shadow-subtle)] dark:bg-[var(--brand-emerald-soft)] dark:shadow-none'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)]/70 hover:text-[var(--text-primary)]'
                          }`
                        }
                      >
                        {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="pt-2">
        {isAuthenticated && user ? (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-[var(--bg-elevated)] px-3 py-2.5 shadow-[var(--shadow-subtle)] dark:bg-[var(--bg-surface-alt)]/70 dark:shadow-none">
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--brand-emerald-soft)] font-display text-xs font-semibold text-[var(--brand-emerald-text)]"
              >
                {user.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase() ?? '')
                  .join('')}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {user.name}
                </div>
                <div className="truncate text-xs text-[var(--text-muted)]">
                  {user.email}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onNavigate?.();
                void logout();
              }}
              aria-label="Sign out"
              title="Sign out"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-alt)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            onClick={onNavigate}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-emerald)] px-3 py-2 text-sm font-medium text-[var(--brand-emerald-fg)] shadow-[var(--shadow-subtle)] transition-colors hover:bg-[var(--brand-emerald-hover)]"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Sign in
          </Link>
        )}
      </div>
    </div>
  );

  const themeToggleButton = (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      }
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] shadow-[var(--shadow-subtle)] transition-[border-color,color] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] whitespace-nowrap"
    >
      {resolvedTheme === 'dark' ? (
        <>
          <Sun className="h-3.5 w-3.5 text-[var(--brand-copper)]" aria-hidden="true" />
          <span>Light</span>
        </>
      ) : (
        <>
          <Moon className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Dark</span>
        </>
      )}
    </button>
  );

  if (isLoginRoute) {
    return (
      <div
        className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]"
        style={{ backgroundImage: 'var(--ambient-glow)' }}
      >
        <div className="zambia-accent-bar h-[3px] w-full" aria-hidden="true" />
        <header className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandMark />
          <div className="flex items-center gap-2 shrink-0">{themeToggleButton}</div>
        </header>
        <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <div className="zambia-accent-bar sticky top-0 z-40 h-[3px] w-full shrink-0" aria-hidden="true" />
      <div className="flex min-h-[calc(100vh-3px)] flex-1">
        {/* Full-height Desktop Sidebar */}
        <aside
          aria-label="Primary navigation"
          className="hidden w-64 shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] lg:block"
        >
          <div className="sticky top-[3px] h-[calc(100vh-3px)] overflow-y-auto">
            {renderSidebarBody()}
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileOpen ? (
          <div
            className="fixed inset-0 z-50 flex lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div
              className="fixed inset-0 bg-black/45"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <div className="relative z-10 flex w-72 max-w-[85vw] flex-col bg-[var(--bg-surface)] shadow-xl">
              <div className="flex h-14 items-center justify-between px-4">
                <BrandMark />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation menu"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)]"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {renderSidebarBody(() => setMobileOpen(false))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Main Content Area */}
        <div
          className="flex min-w-0 flex-1 flex-col"
          style={{ backgroundImage: 'var(--ambient-glow)' }}
        >
          <header className="sticky top-[3px] z-30 flex h-14 items-center justify-between gap-4 bg-[var(--bg-canvas)]/80 px-4 backdrop-blur-sm sm:px-6 lg:justify-end lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={mobileOpen}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <BrandMark />
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {themeToggleButton}
              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="inline-flex min-h-9 items-center justify-center rounded-lg bg-[var(--brand-emerald)] px-3.5 py-1.5 text-xs font-medium text-[var(--brand-emerald-fg)] shadow-[var(--shadow-subtle)] transition-colors hover:bg-[var(--brand-emerald-hover)] whitespace-nowrap"
                >
                  Sign in
                </Link>
              ) : null}
            </div>
          </header>

          <main className="min-w-0 flex-1">
            <div className="mx-auto max-w-[1200px] px-4 pt-2 pb-12 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
