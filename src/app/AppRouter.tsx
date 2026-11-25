import { useEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../core/auth';
import { useCapabilities, type FeatureRequirement } from '../core/capabilities';
import { EmptyState, ErrorState, ForbiddenState, LoadingSkeleton } from '../core/ui';
import { FEATURE_REGISTRY } from '../features/registry';

function RouteGate({
  title,
  featureReq,
  routeReq,
  children,
}: {
  title: string;
  featureReq?: FeatureRequirement;
  routeReq?: FeatureRequirement;
  children: ReactNode;
}) {
  const { status, error, reloadBootstrap, isAuthenticated } = useAuth();
  const { canAccessRoute } = useCapabilities();
  const location = useLocation();

  useEffect(() => {
    document.title = `${title} — SyncDesk`;
  }, [title]);

  const requiresAuth = Boolean(
    featureReq?.authenticatedOnly ||
      featureReq?.module ||
      featureReq?.permission ||
      routeReq?.authenticatedOnly ||
      routeReq?.module ||
      routeReq?.permission
  );

  if (!requiresAuth) {
    return <>{children}</>;
  }

  if (status === 'loading') {
    return <LoadingSkeleton variant="board" />;
  }

  if (status === 'forbidden') {
    return <ForbiddenState />;
  }

  if (status === 'error') {
    return (
      <ErrorState
        title="Workspace unavailable"
        message={error ?? 'Failed to verify your capabilities.'}
        onRetry={() => void reloadBootstrap()}
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!canAccessRoute(featureReq, routeReq)) {
    return (
      <ForbiddenState
        title="Access forbidden"
        description="Your account lacks the module or permission required for this screen."
      />
    );
  }

  return <>{children}</>;
}

export function AppRouter() {
  const routes = FEATURE_REGISTRY.flatMap((feature) =>
    feature.routes.map((route) => ({
      feature,
      route,
    }))
  );

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/board" replace />} />
      {routes.map(({ feature, route }) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <RouteGate
              title={route.title}
              featureReq={feature.requires}
              routeReq={route.requires}
            >
              <route.Component />
            </RouteGate>
          }
        />
      ))}
      <Route
        path="*"
        element={
          <EmptyState
            title="Page not found"
            description="The page you requested does not exist in this SyncDesk workspace."
            actionLabel="Open operations board"
            actionTo="/board"
          />
        }
      />
    </Routes>
  );
}
