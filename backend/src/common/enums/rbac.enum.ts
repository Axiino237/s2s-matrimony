export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN       = 'ADMIN',
  MEMBER      = 'MEMBER',
}

export enum Permission {
  // Users
  USERS_READ    = 'users:read',
  USERS_WRITE   = 'users:write',
  USERS_DELETE  = 'users:delete',
  USERS_BAN     = 'users:ban',
  USERS_VERIFY  = 'users:verify',

  // Profiles
  PROFILES_READ     = 'profiles:read',
  PROFILES_WRITE    = 'profiles:write',
  PROFILES_VERIFY   = 'profiles:verify',
  PROFILES_MODERATE = 'profiles:moderate',
  PROFILES_DELETE   = 'profiles:delete',

  // Payments
  PAYMENTS_VIEW   = 'payments:view',
  PAYMENTS_REFUND = 'payments:refund',
  PAYMENTS_MANAGE = 'payments:manage',

  // Communities
  COMMUNITIES_READ   = 'communities:read',
  COMMUNITIES_WRITE  = 'communities:write',
  COMMUNITIES_DELETE = 'communities:delete',

  // Blogs / CMS
  BLOGS_READ    = 'blogs:read',
  BLOGS_WRITE   = 'blogs:write',
  BLOGS_PUBLISH = 'blogs:publish',
  BLOGS_DELETE  = 'blogs:delete',

  // Reports
  REPORTS_VIEW   = 'reports:view',
  REPORTS_HANDLE = 'reports:handle',
  REPORTS_DELETE = 'reports:delete',

  // Settings
  SETTINGS_READ   = 'settings:read',
  SETTINGS_MANAGE = 'settings:manage',

  // Notifications / Audit
  NOTIFICATIONS_SEND = 'notifications:send',
  AUDIT_VIEW = 'audit:view',

  // System / Super Admin
  ADMINS_MANAGE   = 'admins:manage',
  GLOBAL_SETTINGS = 'global:settings',
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  [Role.ADMIN]: [
    Permission.USERS_READ, Permission.USERS_WRITE, Permission.USERS_BAN,
    Permission.PROFILES_READ, Permission.PROFILES_WRITE, Permission.PROFILES_VERIFY, Permission.PROFILES_MODERATE,
    Permission.PAYMENTS_VIEW, Permission.PAYMENTS_MANAGE,
    Permission.COMMUNITIES_READ, Permission.COMMUNITIES_WRITE,
    Permission.BLOGS_READ, Permission.BLOGS_WRITE, Permission.BLOGS_PUBLISH,
    Permission.REPORTS_VIEW, Permission.REPORTS_HANDLE,
    Permission.SETTINGS_READ, Permission.SETTINGS_MANAGE,
    Permission.NOTIFICATIONS_SEND, Permission.AUDIT_VIEW,
  ],
  [Role.MEMBER]: [],
};

