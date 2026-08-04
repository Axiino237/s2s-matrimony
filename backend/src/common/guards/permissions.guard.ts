import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../enums/rbac.enum';
import { PERMISSIONS_KEY, IS_PUBLIC_KEY } from '../decorators/rbac.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('User context missing');

    const userRole = (
      user?.role ||
      user?.roles?.[0] ||
      user?.userRoles?.[0]?.role?.name ||
      'MEMBER'
    ).toString().toUpperCase();

    if (userRole === 'SUPER_ADMIN') return true;

    const userPermissions: string[] = user.permissions || [];
    const hasAllPermissions = requiredPermissions.every((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasAllPermissions) {
      if (userRole === 'ADMIN') return true;
      throw new ForbiddenException('Insufficient permissions for this action');
    }

    return true;
  }
}
