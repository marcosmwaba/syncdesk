import type { FeatureDefinition } from '../../core/capabilities';
import { AnalyticsPage } from './pages/AnalyticsPage';

export const analyticsFeature: FeatureDefinition = {
  id: 'analytics',
  requires: { module: 'analytics' },
  routes: [
    {
      path: '/analytics',
      title: 'Analytics',
      Component: AnalyticsPage,
      requires: { module: 'analytics', permission: 'analytics:read' },
    },
  ],
  nav: [
    {
      id: 'analytics',
      label: 'Analytics',
      to: '/analytics',
      icon: 'BarChart3',
      group: 'operations',
      order: 50,
      requires: { module: 'analytics', permission: 'analytics:read' },
    },
  ],
};
