import { useMemo } from 'react';
import { useAuth } from '../auth';
import {
  type CapabilityContext,
  type FeatureDefinition,
  type FeatureNavItem,
  type FeatureRequirement,
  filterFeatureNav,
  hasModule,
  hasPermission,
  isRouteAccessible,
  matchesRequirement,
} from './capabilities';

export function useCapabilities() {
  const { isAuthenticated, permissions, modules, user } = useAuth();

  const context = useMemo<CapabilityContext>(
    () => ({
      isAuthenticated,
      permissions,
      modules,
    }),
    [isAuthenticated, permissions, modules]
  );

  return useMemo(
    () => ({
      context,
      user,
      isAuthenticated,
      permissions,
      modules,
      hasModule: (mod?: string) => hasModule(modules, mod),
      hasPermission: (perm?: string) => hasPermission(permissions, perm),
      canAccess: (req?: FeatureRequirement) => matchesRequirement(context, req),
      canAccessRoute: (
        featureReq?: FeatureRequirement,
        routeReq?: FeatureRequirement
      ) => isRouteAccessible(context, featureReq, routeReq),
      getNavItems: (features: FeatureDefinition[]): FeatureNavItem[] =>
        filterFeatureNav(features, context),
    }),
    [context, user, isAuthenticated, permissions, modules]
  );
}
