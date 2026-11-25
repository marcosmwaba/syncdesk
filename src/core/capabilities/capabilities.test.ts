import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterFeatureNav,
  formatTicketTitle,
  hasModule,
  hasPermission,
  isRouteAccessible,
  isTicketMasked,
  type FeatureDefinition,
} from './capabilities';

test('formatTicketTitle returns Confidential request when title is null', () => {
  assert.equal(formatTicketTitle(null), 'Confidential request');
  assert.equal(formatTicketTitle(undefined), 'Confidential request');
  assert.equal(formatTicketTitle('VPN outage in Lusaka'), 'VPN outage in Lusaka');
  assert.equal(isTicketMasked(null), true);
  assert.equal(isTicketMasked('Printer jam'), false);
});

test('hasModule and hasPermission support exact matches and wildcard', () => {
  assert.equal(hasModule(['tickets', 'board'], 'tickets'), true);
  assert.equal(hasModule(['tickets'], 'analytics'), false);
  assert.equal(hasModule(['*'], 'analytics'), true);
  assert.equal(hasPermission(['tickets:read', 'tickets:create'], 'tickets:create'), true);
  assert.equal(hasPermission(['tickets:read'], 'admin:users'), false);
  assert.equal(hasPermission(['*'], 'admin:users'), true);
});

test('isRouteAccessible requires authentication when module or permission is specified', () => {
  const unauth = { isAuthenticated: false, permissions: [], modules: [] };
  assert.equal(isRouteAccessible(unauth, undefined, undefined), true);
  assert.equal(
    isRouteAccessible(unauth, { module: 'tickets' }, { permission: 'tickets:create' }),
    false
  );

  const requester = {
    isAuthenticated: true,
    modules: ['tickets'],
    permissions: ['tickets:create', 'tickets:read'],
  };
  assert.equal(
    isRouteAccessible(requester, { module: 'tickets' }, { permission: 'tickets:create' }),
    true
  );
  assert.equal(
    isRouteAccessible(requester, { module: 'admin' }, { permission: 'admin:users' }),
    false
  );
});

test('filterFeatureNav builds sorted navigation items matching user capabilities', () => {
  const features: FeatureDefinition[] = [
    {
      id: 'board',
      routes: [],
      nav: [{ id: 'board', label: 'Board', to: '/board', order: 10 }],
    },
    {
      id: 'admin',
      requires: { module: 'admin' },
      routes: [],
      nav: [
        {
          id: 'users',
          label: 'Users',
          to: '/admin/users',
          order: 80,
          requires: { module: 'admin', permission: 'admin:users' },
        },
        {
          id: 'audit',
          label: 'Audit',
          to: '/admin/audit',
          order: 70,
          requires: { module: 'admin', permission: 'admin:audit' },
        },
      ],
    },
  ];

  const userNav = filterFeatureNav(features, {
    isAuthenticated: true,
    modules: ['admin'],
    permissions: ['admin:audit'],
  });

  assert.deepEqual(
    userNav.map((item) => item.id),
    ['board', 'audit']
  );
});
