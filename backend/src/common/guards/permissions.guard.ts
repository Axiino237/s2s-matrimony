import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../enums/rbac.enum';
import { PERMISSIONS_KEY, IS_PUBLIC_KEY } from '../decorators/rbac.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    // Fetch real-time active permissions directly from database
    const userId = user.sub || user.id;
    let effectivePermissions: string[] = [];

    if (userId) {
      try {
        const userRoles = await this.prisma.userRole.findMany({
          where: { userId },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        });

        const permSet = new Set<string>();
        if (userRoles.length > 0) {
          userRoles.forEach((ur) => {
            ur.role?.rolePermissions?.forEach((rp) => {
              if (rp.permission?.name) permSet.add(rp.permission.name);
            });
          });
          effectivePermissions = Array.from(permSet);
        } else {
          // If user has no userRole join rows, resolve by role names
          const roles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [userRole];
          const dbRoles = await this.prisma.role.findMany({
            where: { name: { in: roles } },
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          });
          dbRoles.forEach((r) => {
            r.rolePermissions?.forEach((rp) => {
              if (rp.permission?.name) permSet.add(rp.permission.name);
            });
          });
          effectivePermissions = Array.from(permSet);
        }
      } catch {
        effectivePermissions = user.permissions || [];
      }
    } else {
      effectivePermissions = user.permissions || [];
    }

    const hasAllPermissions = requiredPermissions.every((perm) =>
      effectivePermissions.includes(perm),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions for this action');
    }

    return true;
  }
}
