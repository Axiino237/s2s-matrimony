import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import type { Role } from '../../types';

interface ProtectedRouteProps {
  roles?: Role[];
  permissions?: string[];
}

const ProtectedRoute = ({ roles, permissions }: ProtectedRouteProps) => {
  const { isAuthenticated, user, hasAnyRole, hasPermission } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !hasAnyRole(...roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (permissions && !permissions.every(hasPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
