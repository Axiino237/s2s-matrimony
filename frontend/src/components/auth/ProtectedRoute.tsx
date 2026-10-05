import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import type { Role } from '../../types';

interface ProtectedRouteProps {
  roles?: (Role | string)[];
  permissions?: string[];
}

const ProtectedRoute = ({ roles, permissions }: ProtectedRouteProps) => {
  const { isAuthenticated, user, hasAnyRole, hasPermission } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = (
    user.role ||
    user.roles?.[0] ||
    (user as any).userRoles?.[0]?.role?.name ||
    'MEMBER'
  ).toString().toUpperCase();

  const isStaff = !['MEMBER', 'GUEST'].includes(userRole);
  const allowsAdmin = roles?.some((r) => ['ADMIN'].includes(r));

  if (roles && !hasAnyRole(...(roles as Role[])) && !(allowsAdmin && isStaff)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (permissions && !permissions.every(hasPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
