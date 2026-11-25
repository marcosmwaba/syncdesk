import type { FeatureDefinition } from '../../core/capabilities';
import { LoginPage } from './pages/LoginPage';

export const authFeature: FeatureDefinition = {
  id: 'auth',
  routes: [
    {
      path: '/login',
      title: 'Sign in',
      Component: LoginPage,
    },
  ],
  nav: [],
};
