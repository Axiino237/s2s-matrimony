import api from './api';

export const dashboardService = {
  /** Get member's personal dashboard stats */
  getStats: () =>
    api
      .get('/profiles/dashboard-stats')
      .then((r) => r.data)
      .catch(() => ({
        profileViews: 0,
        interestsReceived: 0,
        interestsSent: 0,
        shortlisted: 0,
        recentMatchesCount: 0,
      })),

  /** Get recommended profiles (latest active) */
  getRecommended: (limit = 6, excludeUserId?: string) =>
    api
      .get('/search', { params: { limit, page: 1, excludeUserId } })
      .then((r) => r.data)
      .catch(() => ({ profiles: [], total: 0 })),
};
