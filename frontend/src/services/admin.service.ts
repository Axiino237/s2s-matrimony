import api from './api';

export const adminApi = {
  getDashboardStats: () =>
    api
      .get('/admin/dashboard-stats')
      .then((r) => r.data.data || r.data),

  getUsers: (page = 1, limit = 10, search = '') =>
    api
      .get('/admin/users', { params: { page, limit, search } })
      .then((r) => r.data.data || r.data),

  getPendingProfiles: (page = 1, limit = 10, search = '') =>
    api
      .get('/admin/profiles', { params: { page, limit, search } })
      .then((r) => r.data.data || r.data),

  verifyProfile: (profileId: string, status: 'VERIFIED' | 'REJECTED') =>
    api
      .patch(`/admin/verify-profile/${profileId}`, { status })
      .then((r) => r.data.data || r.data),

  banUser: (userId: string) =>
    api
      .patch(`/admin/ban-user/${userId}`)
      .then((r) => r.data.data || r.data),

  deleteUser: (userId: string) =>
    api
      .delete(`/admin/users/${userId}`)
      .then((r) => r.data.data || r.data),

  getPayments: (page = 1, limit = 10, search = '') =>
    api
      .get('/admin/payments', { params: { page, limit, search } })
      .then((r) => r.data.data || r.data),

  getReports: (page = 1, limit = 10, search = '') =>
    api
      .get('/admin/reports', { params: { page, limit, search } })
      .then((r) => r.data.data || r.data),

  updateReport: (id: string, status: string, reviewNote?: string) =>
    api
      .patch(`/admin/reports/${id}`, { status, reviewNote })
      .then((r) => r.data.data || r.data),

  getBlogs: (page = 1, limit = 10, search = '') =>
    api
      .get('/admin/blogs', { params: { page, limit, search } })
      .then((r) => r.data.data || r.data),

  createBlog: (data: { title: string; content?: string; coverImage?: string; tags?: string[] }) =>
    api.post('/admin/blogs', data).then((r) => r.data.data || r.data),

  deleteBlog: (id: string) =>
    api.delete(`/admin/blogs/${id}`).then((r) => r.data.data || r.data),

  getBanners: (page = 1, limit = 20) =>
    api
      .get('/admin/banners', { params: { page, limit } })
      .then((r) => r.data.data || r.data),

  createBanner: (data: { title: string; imageUrl: string; page?: string; linkUrl?: string }) =>
    api.post('/admin/banners', data).then((r) => r.data.data || r.data),

  deleteBanner: (id: string) =>
    api.delete(`/admin/banners/${id}`).then((r) => r.data.data || r.data),

  getSuccessStories: (page = 1, limit = 10, publishedOnly?: boolean, search = '') =>
    api
      .get('/admin/success-stories', { params: { page, limit, publishedOnly, search } })
      .then((r) => r.data.data || r.data),

  getPublicSuccessStories: (page = 1, limit = 10, search = '') =>
    api
      .get('/admin/public/success-stories', { params: { page, limit, search } })
      .then((r) => r.data.data || r.data),

  createSuccessStory: (data: { groomName: string; brideName: string; story: string; photo?: string; marriageDate?: string }) =>
    api.post('/admin/success-stories', data).then((r) => r.data.data || r.data),

  publishSuccessStory: (id: string, isPublished = true) =>
    api.patch(`/admin/success-stories/${id}/publish`, { isPublished }).then((r) => r.data.data || r.data),

  deleteSuccessStory: (id: string) =>
    api.delete(`/admin/success-stories/${id}`).then((r) => r.data.data || r.data),

  getPlans: () =>
    api
      .get('/payments/plans')
      .then((r) => r.data.data || r.data),
};

// Also export as adminService for consistent naming
export const adminService = adminApi;
