import { useState, useEffect, useCallback } from "react";
import { useAuthStore, getUserMainRole } from "../store/auth.store";
import rbacService, { ScreenItem } from "../services/rbac.service";

interface ScreenAccess {
  id?: string;
  slug: string;
  route: string;
  name: string;
  category?: string;
  icon?: string;
}

interface UseScreenAccessReturn {
  accessibleScreens: ScreenAccess[];
  isLoading: boolean;
  canAccess: (screenSlug: string) => boolean;
  refetch: () => void;
}

/**
 * Hook to fetch and check which screens the current logged-in user can access.
 * Uses backend GET /rbac/my-screens endpoint.
 *
 * Usage:
 *   const { canAccess, isLoading } = useScreenAccess();
 *   if (!canAccess("admin-users")) return <Unauthorized />;
 */
export function useScreenAccess(): UseScreenAccessReturn {
  const { user, isAuthenticated } = useAuthStore();
  const [accessibleScreens, setAccessibleScreens] = useState<ScreenAccess[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchScreens = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setAccessibleScreens([]);
      setIsLoading(false);
      return;
    }

    // Super Admin has universal access
    const mainRole = getUserMainRole(user);
    if (mainRole === 'SUPER_ADMIN') {
      try {
        setIsLoading(true);
        // Super admin can see all screens
        const allScreens = await rbacService.getAllScreens();
        setAccessibleScreens(
          allScreens.map((s) => ({
            id: s.id,
            slug: s.slug,
            route: s.route,
            name: s.name,
            category: s.category,
            icon: s.icon,
          }))
        );
      } catch (err) {
        console.warn("Failed to fetch all screens for super admin, fallback:", err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      setIsLoading(true);
      const screens = await rbacService.getMyScreens();
      setAccessibleScreens(
        screens.map((s) => ({
          id: s.id,
          slug: s.slug,
          route: s.route,
          name: s.name,
          category: s.category,
          icon: s.icon,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch screen access:", err);
      setAccessibleScreens([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchScreens();
  }, [fetchScreens]);

  const canAccess = useCallback(
    (screenSlug: string): boolean => {
      if (!user) return false;
      const mainRole = getUserMainRole(user);
      if (mainRole === 'SUPER_ADMIN') return true;
      return accessibleScreens.some((s) => s.slug === screenSlug);
    },
    [user, accessibleScreens]
  );

  return {
    accessibleScreens,
    isLoading,
    canAccess,
    refetch: fetchScreens,
  };
}

export default useScreenAccess;
