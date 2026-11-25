import type { FeatureDefinition } from '../../core/capabilities';
import { BoardPage } from './pages/BoardPage';

export const boardFeature: FeatureDefinition = {
  id: 'board',
  routes: [
    {
      path: '/board',
      title: 'Operations Board',
      Component: BoardPage,
    },
  ],
  nav: [
    {
      id: 'board',
      label: 'Live Board',
      to: '/board',
      icon: 'LayoutGrid',
      group: 'workspace',
      order: 10,
    },
  ],
};
