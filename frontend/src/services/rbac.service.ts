import api from './api';

export interface ScreenItem {
  id: string;
  name: string;
  slug: string;
  route: string;
  icon?: string;
  category?: string;
  moduleId?: string;
  sortOrder: number;
  isActive: boolean;
  isPublic: boolean;
  isCustom: boolean;
  description?: string;
  module?: {
    id: string;
    name: string;
    code: string;
  };
  permissions?: Array<{
    id: string;
    permission: {
      id: string;
      name: string;
      code: string;
      category?: string;
    };
    isMandatory: boolean;
  }>;
}

export interface RoleItem {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  rolePermissions?: Array<{
    id: string;
    permission: {
      id: string;
      name: string;
      code: string;
    };
  }>;
}

export interface UserAssignmentItem {
  id: string;
  userId: string;
  roleId: string;
  communityId?: string | null;
  assignedBy?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
  role: RoleItem;
  community?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface CreateScreenDto {
  name: string;
  slug: string;
  route: string;
  icon?: string;
  category?: string;
  moduleId?: string;
  sortOrder?: number;
  isActive?: boolean;
  isPublic?: boolean;
  isCustom?: boolean;
  description?: string;
}

export interface AssignRoleDto {
  roleId: string;
  communityId?: string;
  expiresAt?: string;
  isActive?: boolean;
}

export const rbacService = {
  // Screens
  getAllScreens: async (): Promise<ScreenItem[]> => {
    const res = await api.get<ScreenItem[]>('/rbac/screens');
    return res.data;
  },

  getScreenBySlug: async (slug: string): Promise<ScreenItem> => {
    const res = await api.get<ScreenItem>(`/rbac/screens/${slug}`);
    return res.data;
  },

  createScreen: async (dto: CreateScreenDto): Promise<ScreenItem> => {
    const res = await api.post<ScreenItem>('/rbac/screens', dto);
    return res.data;
  },

  updateScreen: async (id: string, dto: Partial<CreateScreenDto>): Promise<ScreenItem> => {
    const res = await api.put<ScreenItem>(`/rbac/screens/${id}`, dto);
    return res.data;
  },

  deleteScreen: async (id: string): Promise<void> => {
    await api.delete(`/rbac/screens/${id}`);
  },

  // Roles
  getAllRoles: async (): Promise<RoleItem[]> => {
    const res = await api.get<RoleItem[]>('/rbac/roles');
    return res.data;
  },

  getRoleById: async (id: string): Promise<RoleItem> => {
    const res = await api.get<RoleItem>(`/rbac/roles/${id}`);
    return res.data;
  },

  // User Role Assignments
  getUserAssignments: async (userId: string): Promise<UserAssignmentItem[]> => {
    const res = await api.get<UserAssignmentItem[]>(`/rbac/users/${userId}/assignments`);
    return res.data;
  },

  assignRoleToUser: async (userId: string, dto: AssignRoleDto): Promise<UserAssignmentItem> => {
    const res = await api.post<UserAssignmentItem>(`/rbac/users/${userId}/assign-role`, dto);
    return res.data;
  },

  revokeRoleFromUser: async (userId: string, roleId: string): Promise<UserAssignmentItem> => {
    const res = await api.patch<UserAssignmentItem>(`/rbac/users/${userId}/revoke-role/${roleId}`);
    return res.data;
  },

  // Access check
  getMyScreens: async (): Promise<ScreenItem[]> => {
    const res = await api.get<ScreenItem[]>('/rbac/my-screens');
    return res.data;
  },

  checkScreenAccess: async (screenSlug: string): Promise<boolean> => {
    const res = await api.get<{ canAccess: boolean; screen: string }>('/rbac/check-access', {
      params: { screen: screenSlug },
    });
    return res.data?.canAccess ?? false;
  },
};

export default rbacService;
