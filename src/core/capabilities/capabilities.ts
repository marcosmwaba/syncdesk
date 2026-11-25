import type { ComponentType } from 'react';

export interface FeatureRequirement {
  module?: string;
  permission?: string;
  authenticatedOnly?: boolean;
}

export interface FeatureRoute {
  path: string;
  title: string;
  Component: ComponentType;
  requires?: FeatureRequirement;
}

export interface FeatureNavItem {
  id: string;
  label: string;
  to: string;
  icon?: string;
  group?: 'workspace' | 'operations' | 'admin';
  order?: number;
  requires?: FeatureRequirement;
}

export interface FeatureDefinition {
  id: string;
  requires?: FeatureRequirement;
  routes: FeatureRoute[];
  nav: FeatureNavItem[];
}

export interface CapabilityContext {
  isAuthenticated: boolean;
  permissions: string[];
  modules: string[];
}

export function hasModule(modules: string[], requiredModule?: string): boolean {
  if (!requiredModule) return true;
  if (modules.includes('*')) return true;
  return modules.includes(requiredModule);
}

export function hasPermission(permissions: string[], requiredPermission?: string): boolean {
  if (!requiredPermission) return true;
  if (permissions.includes('*')) return true;
  return permissions.includes(requiredPermission);
}

export function matchesRequirement(
  ctx: CapabilityContext,
  requirement?: FeatureRequirement
): boolean {
  if (!requirement) return true;
  if (requirement.authenticatedOnly && !ctx.isAuthenticated) {
    return false;
  }
  if ((requirement.module || requirement.permission) && !ctx.isAuthenticated) {
    return false;
  }
  return (
    hasModule(ctx.modules, requirement.module) &&
    hasPermission(ctx.permissions, requirement.permission)
  );
}

export function isRouteAccessible(
  ctx: CapabilityContext,
  featureReq?: FeatureRequirement,
  routeReq?: FeatureRequirement
): boolean {
  return matchesRequirement(ctx, featureReq) && matchesRequirement(ctx, routeReq);
}

export function filterFeatureNav(
  features: FeatureDefinition[],
  ctx: CapabilityContext
): FeatureNavItem[] {
  const items: FeatureNavItem[] = [];
  for (const feature of features) {
    if (!matchesRequirement(ctx, feature.requires)) {
      continue;
    }
    for (const navItem of feature.nav) {
      if (matchesRequirement(ctx, navItem.requires)) {
        items.push(navItem);
      }
    }
  }
  return items.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

export function formatTicketTitle(title: string | null | undefined): string {
  if (title === null || title === undefined) {
    return 'Confidential request';
  }
  return title;
}

export function isTicketMasked(title: string | null | undefined): boolean {
  return title === null;
}
