---
name: matrimony-rbac
description: Role-Based Access Control and User Access Management patterns for S2S Community Matrimony platform. Use this skill when implementing guards, roles, permissions, decorators, or any access-control logic.
---

# S2S Matrimony — RBAC + UAM Skill

## Roles (7 Roles)

```typescript
export enum Role {
  SUPER_ADMIN   = 'SUPER_ADMIN',
  ADMIN         = 'ADMIN',
  MODERATOR     = 'MODERATOR',
  SUPPORT_AGENT = 'SUPPORT_AGENT',
  PREMIUM       = 'PREMIUM',
  MEMBER        = 'MEMBER',
  GUEST         = 'GUEST',
}
```

## Permissions (Fine-Grained)

```typescript
export enum Permission {
  // User Permissions
  USERS_READ    = 'users:read',
  USERS_WRITE   = 'users:write',
  USERS_DELETE  = 'users:delete',
  USERS_BAN     = 'users:ban',
  USERS_VERIFY  = 'users:verify',

  // Profile Permissions
  PROFILES_READ     = 'profiles:read',
  PROFILES_WRITE    = 'profiles:write',
  PROFILES_VERIFY   = 'profiles:verify',
  PROFILES_MODERATE = 'profiles:moderate',
  PROFILES_DELETE   = 'profiles:delete',

  // Payment Permissions
  PAYMENTS_VIEW   = 'payments:view',
  PAYMENTS_REFUND = 'payments:refund',
  PAYMENTS_MANAGE = 'payments:manage',

  // Community Permissions
  COMMUNITIES_READ   = 'communities:read',
  COMMUNITIES_WRITE  = 'communities:write',
  COMMUNITIES_DELETE = 'communities:delete',

  // Blog/CMS Permissions
  BLOGS_READ    = 'blogs:read',
  BLOGS_WRITE   = 'blogs:write',
  BLOGS_PUBLISH = 'blogs:publish',
  BLOGS_DELETE  = 'blogs:delete',

  // Reports Permissions
  REPORTS_VIEW   = 'reports:view',
  REPORTS_HANDLE = 'reports:handle',
  REPORTS_DELETE = 'reports:delete',

  // Settings Permissions
  SETTINGS_READ   = 'settings:read',
  SETTINGS_MANAGE = 'settings:manage',

  // Notifications
  NOTIFICATIONS_SEND = 'notifications:send',

  // Audit
  AUDIT_VIEW = 'audit:view',

  // Super Admin Only
  ADMINS_MANAGE     = 'admins:manage',
  FRANCHISES_MANAGE = 'franchises:manage',
  GLOBAL_SETTINGS   = 'global:settings',
}
```

## Role → Default Permissions Map

```typescript
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission), // All permissions
  [Role.ADMIN]: [
    Permission.USERS_READ, Permission.USERS_WRITE, Permission.USERS_BAN,
    Permission.PROFILES_READ, Permission.PROFILES_VERIFY, Permission.PROFILES_MODERATE,
    Permission.PAYMENTS_VIEW, Permission.PAYMENTS_MANAGE,
    Permission.COMMUNITIES_READ, Permission.COMMUNITIES_WRITE,
    Permission.BLOGS_READ, Permission.BLOGS_WRITE, Permission.BLOGS_PUBLISH,
    Permission.REPORTS_VIEW, Permission.REPORTS_HANDLE,
    Permission.SETTINGS_READ, Permission.SETTINGS_MANAGE,
    Permission.NOTIFICATIONS_SEND,
  ],
  [Role.MODERATOR]: [
    Permission.PROFILES_READ, Permission.PROFILES_VERIFY, Permission.PROFILES_MODERATE,
    Permission.REPORTS_VIEW, Permission.REPORTS_HANDLE,
    Permission.USERS_READ,
    Permission.BLOGS_READ,
  ],
  [Role.SUPPORT_AGENT]: [
    Permission.USERS_READ,
    Permission.PROFILES_READ,
    Permission.PAYMENTS_VIEW,
    Permission.REPORTS_VIEW, Permission.REPORTS_HANDLE,
  ],
  [Role.PREMIUM]: [],   // Premium member - controlled via membership checks
  [Role.MEMBER]: [],    // Basic member
  [Role.GUEST]: [],     // No permissions
};
```

## NestJS Guard Implementation

### `roles.guard.ts`
```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    const hasRole = requiredRoles.some((role) => user?.roles?.includes(role));
    if (!hasRole) throw new ForbiddenException('Insufficient role');
    return true;
  }
}
```

### `permissions.guard.ts`
```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY, [context.getHandler(), context.getClass()]
    );
    if (!requiredPermissions) return true;

    const { user } = context.switchToHttp().getRequest();
    const hasPermission = requiredPermissions.every(
      (perm) => user?.permissions?.includes(perm)
    );
    if (!hasPermission) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
```

## Decorators

```typescript
// roles.decorator.ts
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// permissions.decorator.ts
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// public.decorator.ts
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

## Controller Usage Pattern

```typescript
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminUsersController {

  @Get()
  @RequirePermissions(Permission.USERS_READ)
  findAll() { ... }

  @Delete(':id')
  @RequirePermissions(Permission.USERS_DELETE)
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) { ... }
}
```

## Frontend RBAC Hook

```typescript
// hooks/usePermission.ts
export const usePermission = () => {
  const { user } = useAuthStore();

  const hasRole = (role: Role): boolean =>
    user?.roles?.includes(role) ?? false;

  const hasPermission = (permission: Permission): boolean =>
    user?.permissions?.includes(permission) ?? false;

  const hasAnyRole = (...roles: Role[]): boolean =>
    roles.some(hasRole);

  return { hasRole, hasPermission, hasAnyRole };
};
```

## Frontend Route Guard Component

```tsx
// components/auth/ProtectedRoute.tsx
export const ProtectedRoute = ({
  children,
  roles,
  permissions,
  fallback = <Navigate to="/login" />,
}: ProtectedRouteProps) => {
  const { user } = useAuthStore();
  const { hasAnyRole, hasPermission } = usePermission();

  if (!user) return fallback;
  if (roles && !hasAnyRole(...roles)) return <Navigate to="/unauthorized" />;
  if (permissions && !permissions.every(hasPermission)) return <Navigate to="/unauthorized" />;

  return <>{children}</>;
};
```

## UAM — Audit Logging Pattern

```typescript
// Every admin action must be logged
@Injectable()
export class AuditService {
  async log(data: {
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValue?: object;
    newValue?: object;
    ipAddress?: string;
  }) {
    await this.prisma.auditLog.create({ data });
  }
}
```

## JWT Token Payload Structure

```typescript
interface JwtPayload {
  sub: string;           // userId
  email: string;
  roles: Role[];
  permissions: Permission[];
  membershipStatus: 'FREE' | 'PREMIUM';
  communityId?: string;
  iat: number;
  exp: number;
}
```
