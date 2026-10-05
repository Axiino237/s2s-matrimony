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

  createAdminStaff: (data: { name: string; email: string; role: string; community?: string; password?: string }) =>
    api
      .post('/super-admin/admins', data)
      .then((r) => r.data.data || r.data),

  getAuditLogs: (page = 1, limit = 20, type = '') =>
    api
      .get('/super-admin/audit-logs', { params: { page, limit, type } })
      .then((r) => r.data.data || r.data),

  getReportsAnalytics: () =>
    api
      .get('/super-admin/reports')
      .then((r) => r.data.data || r.data),

  getAuditLogsForExport: (params?: { action?: string; entity?: string; search?: string }) =>
    api
      .get('/super-admin/audit-logs/export', { params })
      .then((r) => r.data.data || r.data),

  getReportExportData: (type: string, days = 30) =>
    api
      .get('/super-admin/reports/data', { params: { type, days } })
      .then((r) => r.data.data || r.data),
};
