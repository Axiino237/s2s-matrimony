export enum Role {
  SUPER_ADMIN   = 'SUPER_ADMIN',
  ADMIN         = 'ADMIN',
  MEMBER        = 'MEMBER',
}

export enum Permission {
  // Executive
  DASHBOARD_VIEW = 'dashboard:view',
  REVENUE_VIEW   = 'revenue:view',

  // Communities
  COMMUNITIES_READ   = 'communities:read',
  COMMUNITIES_WRITE  = 'communities:write',
  COMMUNITIES_DELETE = 'communities:delete',

  // Users
  USERS_READ    = 'users:read',
  USERS_WRITE   = 'users:write',
  USERS_VERIFY  = 'users:verify',
  USERS_BAN     = 'users:ban',
  USERS_DELETE  = 'users:delete',

  // Profiles
  PROFILES_READ     = 'profiles:read',
  PROFILES_WRITE    = 'profiles:write',
  PROFILES_VERIFY   = 'profiles:verify',
  PROFILES_MODERATE = 'profiles:moderate',
  PROFILES_DELETE   = 'profiles:delete',

  // Membership Plans & Payments
  PLANS_READ      = 'plans:read',
  PLANS_MANAGE    = 'plans:manage',
  PAYMENTS_VIEW   = 'payments:view',
  PAYMENTS_REFUND = 'payments:refund',
  PAYMENTS_MANAGE = 'payments:manage',

  // Content & AI
  STORIES_READ    = 'stories:read',
  STORIES_APPROVE = 'stories:approve',
  STORIES_DELETE  = 'stories:delete',
  BLOGS_READ      = 'blogs:read',
  BLOGS_WRITE     = 'blogs:write',
  BLOGS_PUBLISH   = 'blogs:publish',
  BLOGS_DELETE    = 'blogs:delete',
  FAQ_READ        = 'faq:read',
  FAQ_WRITE       = 'faq:write',
  TESTIMONIALS_READ  = 'testimonials:read',
  TESTIMONIALS_WRITE = 'testimonials:write',
  STATIC_PAGES_READ  = 'static_pages:read',
  STATIC_PAGES_WRITE = 'static_pages:write',
  AI_BIODATA_READ    = 'ai_biodata:read',
  AI_BIODATA_PARSE   = 'ai_biodata:parse',
  BIODATA_ENTRY_CREATE = 'biodata_entry:create',
  BIODATA_ENTRY_VIEW   = 'biodata_entry:view',
  BIODATA_RECORDS_READ   = 'biodata_records:read',
  BIODATA_RECORDS_MANAGE = 'biodata_records:manage',

  // Administration & System
  ADMINS_MANAGE      = 'admins:manage',
  AUDIT_VIEW         = 'audit:view',
  REPORTS_VIEW       = 'reports:view',
  REPORTS_HANDLE     = 'reports:handle',
  REPORTS_DELETE     = 'reports:delete',
  SETTINGS_READ      = 'settings:read',
  SETTINGS_MANAGE    = 'settings:manage',
  NOTIFICATIONS_SEND = 'notifications:send',
  GENERAL_SETTINGS_READ  = 'general_settings:read',
  GENERAL_SETTINGS_WRITE = 'general_settings:write',
  LEGACY_LOGS_VIEW       = 'legacy_logs:view',
  GLOBAL_SETTINGS        = 'global:settings',

  // Member Portal
  MEMBER_DASHBOARD = 'member:dashboard',
  MEMBER_PROFILE   = 'member:profile',
  MEMBER_SEARCH    = 'member:search',
  MEMBER_INTERESTS = 'member:interests',
  MEMBER_MESSAGES  = 'member:messages',
  MEMBER_UPGRADE   = 'member:upgrade',
  MEMBER_PAYMENTS  = 'member:payments',
  MEMBER_CONTACTS  = 'member:contacts',
  MEMBER_VIEWERS   = 'member:viewers',
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  [Role.ADMIN]: [
    Permission.DASHBOARD_VIEW, Permission.REVENUE_VIEW,
    Permission.COMMUNITIES_READ, Permission.COMMUNITIES_WRITE,
    Permission.USERS_READ, Permission.USERS_WRITE, Permission.USERS_VERIFY, Permission.USERS_BAN,
    Permission.PROFILES_READ, Permission.PROFILES_WRITE, Permission.PROFILES_VERIFY, Permission.PROFILES_MODERATE,
    Permission.PLANS_READ, Permission.PLANS_MANAGE,
    Permission.PAYMENTS_VIEW, Permission.PAYMENTS_REFUND,
    Permission.STORIES_READ, Permission.STORIES_APPROVE,
    Permission.BLOGS_READ, Permission.BLOGS_WRITE, Permission.BLOGS_PUBLISH,
    Permission.FAQ_READ, Permission.FAQ_WRITE,
    Permission.TESTIMONIALS_READ, Permission.TESTIMONIALS_WRITE,
    Permission.STATIC_PAGES_READ, Permission.STATIC_PAGES_WRITE,
    Permission.AI_BIODATA_READ, Permission.AI_BIODATA_PARSE,
    Permission.BIODATA_ENTRY_CREATE, Permission.BIODATA_ENTRY_VIEW,
    Permission.BIODATA_RECORDS_READ, Permission.BIODATA_RECORDS_MANAGE,
    Permission.AUDIT_VIEW,
    Permission.REPORTS_VIEW, Permission.REPORTS_HANDLE,
    Permission.SETTINGS_READ, Permission.SETTINGS_MANAGE, Permission.NOTIFICATIONS_SEND,
    Permission.GENERAL_SETTINGS_READ, Permission.GENERAL_SETTINGS_WRITE,
    Permission.LEGACY_LOGS_VIEW,
  ],
  [Role.MEMBER]: [
    Permission.MEMBER_DASHBOARD,
    Permission.MEMBER_PROFILE,
    Permission.MEMBER_SEARCH,
    Permission.MEMBER_INTERESTS,
    Permission.MEMBER_MESSAGES,
    Permission.MEMBER_UPGRADE,
    Permission.MEMBER_PAYMENTS,
    Permission.MEMBER_CONTACTS,
    Permission.MEMBER_VIEWERS,
    Permission.BLOGS_READ,
    Permission.STORIES_READ,
  ],
};

