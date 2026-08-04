import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/rbac.enum';
import { ROLES_KEY, IS_PUBLIC_KEY } from '../decorators/rbac.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    const userRole = (
      user?.role ||
      user?.roles?.[0] ||
      user?.userRoles?.[0]?.role?.name ||
      'MEMBER'
    ).toString().toUpperCase();

    if (userRole === 'SUPER_ADMIN') return true;

    const hasRole = requiredRoles.some(
      (role) => role.toString().toUpperCase() === userRole || (Array.isArray(user?.roles) && user.roles.includes(role))
    );
    if (!hasRole) throw new ForbiddenException(`Insufficient role [${userRole}] for this action`);

    return true;
  }
}
