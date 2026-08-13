export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN       = 'ADMIN',
  MEMBER      = 'MEMBER',
}

export enum Permission {
  // Executive
  DASHBOARD_VIEW = 'dashboard:view',
  REVENUE_VIEW   = 'revenue:view',

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

  // Plans & Payments
  PLANS_READ      = 'plans:read',
  PLANS_MANAGE    = 'plans:manage',
  PAYMENTS_VIEW   = 'payments:view',
  PAYMENTS_REFUND = 'payments:refund',
  PAYMENTS_MANAGE = 'payments:manage',

  // Communities
  COMMUNITIES_READ   = 'communities:read',
  COMMUNITIES_WRITE  = 'communities:write',
  COMMUNITIES_DELETE = 'communities:delete',

  // Content
  BANNERS_READ       = 'banners:read',
  BANNERS_WRITE      = 'banners:write',
  STORIES_READ       = 'stories:read',
  STORIES_APPROVE    = 'stories:approve',
  STORIES_DELETE     = 'stories:delete',
  BLOGS_READ         = 'blogs:read',
  BLOGS_WRITE        = 'blogs:write',
  BLOGS_PUBLISH      = 'blogs:publish',
  BLOGS_DELETE       = 'blogs:delete',
  FAQ_READ           = 'faq:read',
  FAQ_WRITE          = 'faq:write',
  TESTIMONIALS_READ  = 'testimonials:read',
  TESTIMONIALS_WRITE = 'testimonials:write',
  STATIC_PAGES_READ  = 'static_pages:read',
  STATIC_PAGES_WRITE = 'static_pages:write',

  // AI & Biodata
  AI_BIODATA_READ       = 'ai_biodata:read',
  AI_BIODATA_PARSE      = 'ai_biodata:parse',
  BIODATA_ENTRY_CREATE  = 'biodata_entry:create',
  BIODATA_RECORDS_READ  = 'biodata_records:read',

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
    Permission.DASHBOARD_VIEW, Permission.REVENUE_VIEW,
    Permission.USERS_READ, Permission.USERS_WRITE, Permission.USERS_BAN, Permission.USERS_VERIFY,
    Permission.PROFILES_READ, Permission.PROFILES_WRITE, Permission.PROFILES_VERIFY, Permission.PROFILES_MODERATE,
    Permission.PLANS_READ, Permission.PLANS_MANAGE,
    Permission.PAYMENTS_VIEW, Permission.PAYMENTS_MANAGE,
    Permission.COMMUNITIES_READ, Permission.COMMUNITIES_WRITE,
    Permission.BANNERS_READ, Permission.BANNERS_WRITE,
    Permission.STORIES_READ, Permission.STORIES_APPROVE,
    Permission.BLOGS_READ, Permission.BLOGS_WRITE, Permission.BLOGS_PUBLISH,
    Permission.FAQ_READ, Permission.FAQ_WRITE,
    Permission.TESTIMONIALS_READ, Permission.TESTIMONIALS_WRITE,
    Permission.STATIC_PAGES_READ, Permission.STATIC_PAGES_WRITE,
    Permission.AI_BIODATA_READ, Permission.AI_BIODATA_PARSE,
    Permission.BIODATA_ENTRY_CREATE, Permission.BIODATA_RECORDS_READ,
    Permission.REPORTS_VIEW, Permission.REPORTS_HANDLE,
    Permission.SETTINGS_READ, Permission.SETTINGS_MANAGE,
    Permission.NOTIFICATIONS_SEND, Permission.AUDIT_VIEW,
  ],
  [Role.MEMBER]: [],
};

