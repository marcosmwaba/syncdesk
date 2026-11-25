import type { FeatureDefinition } from '../../core/capabilities';
import { AdminAuditPage } from './pages/AdminAuditPage';
import { AdminDepartmentsPage } from './pages/AdminDepartmentsPage';
import { AdminTicketsPage } from './pages/AdminTicketsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';

export const adminFeature: FeatureDefinition = {
  id: 'admin',
  requires: { module: 'admin' },
  routes: [
    {
      path: '/admin/tickets',
      title: 'Admin Tickets',
      Component: AdminTicketsPage,
      requires: { module: 'admin', permission: 'admin:tickets' },
    },
    {
      path: '/admin/audit',
      title: 'Audit Log',
      Component: AdminAuditPage,
      requires: { module: 'admin', permission: 'admin:audit' },
    },
    {
      path: '/admin/users',
      title: 'Users',
      Component: AdminUsersPage,
      requires: { module: 'admin', permission: 'admin:users' },
    },
    {
      path: '/admin/departments',
      title: 'Departments',
      Component: AdminDepartmentsPage,
      requires: { module: 'admin', permission: 'admin:departments' },
    },
  ],
  nav: [
    {
      id: 'admin-tickets',
      label: 'All Tickets',
      to: '/admin/tickets',
      icon: 'ClipboardList',
      group: 'admin',
      order: 60,
      requires: { module: 'admin', permission: 'admin:tickets' },
    },
    {
      id: 'admin-audit',
      label: 'Audit Log',
      to: '/admin/audit',
      icon: 'FileText',
      group: 'admin',
      order: 70,
      requires: { module: 'admin', permission: 'admin:audit' },
    },
    {
      id: 'admin-users',
      label: 'Users',
      to: '/admin/users',
      icon: 'Users',
      group: 'admin',
      order: 80,
      requires: { module: 'admin', permission: 'admin:users' },
    },
    {
      id: 'admin-departments',
      label: 'Departments',
      to: '/admin/departments',
      icon: 'Building2',
      group: 'admin',
      order: 90,
      requires: { module: 'admin', permission: 'admin:departments' },
    },
  ],
};
