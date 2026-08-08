import api from './api';

export const superAdminService = {
  getGlobalStats: () =>
    api
      .get('/super-admin/stats')
      .then((r) => r.data.data || r.data),

  getStats: () =>
    api
      .get('/super-admin/stats')
      .then((r) => r.data.data || r.data),

  getAdmins: (page = 1, limit = 10, search = '') =>
    api
      .get('/super-admin/admins', { params: { page, limit, search } })
      .then((r) => r.data.data || r.data),

  getRevenueTrend: (months = 6) =>
    api
      .get('/super-admin/revenue', { params: { months } })
      .then((r) => r.data.data || r.data),

  getCommunityBreakdown: () =>
    api
      .get('/super-admin/community-breakdown')
      .then((r) => r.data.data || r.data),

  getRolePermissions: () =>
    api
      .get('/super-admin/role-permissions')
      .then((r) => r.data.data || r.data),

  getAllRoles: () =>
    api
      .get('/super-admin/roles')
      .then((r) => r.data.data || r.data),

  getModulesWithPermissions: () =>
    api
      .get('/super-admin/modules-permissions')
      .then((r) => r.data.data || r.data),

  createRole: (data: { name: string; displayName?: string; description?: string }) =>
    api
      .post('/super-admin/roles', data)
      .then((r) => r.data.data || r.data),

  deleteRole: (id: string) =>
    api
      .delete(`/super-admin/roles/${id}`)
      .then((r) => r.data.data || r.data),

  updateRolePermissions: (roleName: string, permissions: string[]) =>
    api
      .put(`/super-admin/role-permissions/${roleName}`, { permissions })
      .then((r) => r.data.data || r.data),

  updateUserRole: (userId: string, role: string) =>
    api
      .put(`/super-admin/admins/${userId}/role`, { role })
      .then((r) => r.data.data || r.data),

  getReportsAnalytics: () =>
    api
      .get('/super-admin/reports')
      .then((r) => r.data.data || r.data),
};
