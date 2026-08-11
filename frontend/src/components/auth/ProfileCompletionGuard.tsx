import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

/**
 * ProfileCompletionGuard
 *
 * Wraps member routes that require a 100% completed profile.
 * If the logged-in member's profileCompletionPercent < 100,
 * they are redirected to /complete-profile until they finish.
 *
 * Usage in App.tsx — wrap member routes that require full profile:
 *   <Route element={<ProfileCompletionGuard />}>
 *     <Route path="/dashboard" element={<DashboardPage />} />
 *     ...
 *   </Route>
 */
const ProfileCompletionGuard = () => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  // If not authenticated, let ProtectedRoute handle it
  if (!isAuthenticated || !user) {
    return <Outlet />;
  }

  // Admins and Super Admins bypass profile completion check
  const adminRoles = ['ADMIN', 'SUPER_ADMIN'];
  if (user.roles?.some((r) => adminRoles.includes(r))) {
    return <Outlet />;
  }

  // Check profile completion percentage
  const completion = (user as any).profileCompletionPercent ?? 0;

  // If profile is not 100% complete, redirect to the wizard
  if (completion < 100) {
    return (
      <Navigate
        to="/complete-profile"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProfileCompletionGuard;
