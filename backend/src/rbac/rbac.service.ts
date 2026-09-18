import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScreenDto } from './dto/create-screen.dto';
import { AssignScreenPermissionDto } from './dto/screen-permission.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  // ── SCREENS ─────────────────────────────────────────────

  async getAllScreens() {
    return this.prisma.screen.findMany({
      include: {
        module: true,
        screenPermissions: {
          include: { permission: { include: { action: true } } },
        },
      },
      orderBy: [{ moduleId: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async getScreenBySlug(slugOrId: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    const screen = await this.prisma.screen.findFirst({
      where: isUuid ? { OR: [{ id: slugOrId }, { slug: slugOrId }] } : { slug: slugOrId },
      include: {
        module: true,
        screenPermissions: { include: { permission: true } },
      },
    });
    if (!screen) throw new NotFoundException(`Screen "${slugOrId}" not found`);
    return screen;
  }

  async createScreen(dto: CreateScreenDto) {
    const existing = await this.prisma.screen.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`Screen slug "${dto.slug}" already exists`);
    return this.prisma.screen.create({ data: dto });
  }

  async updateScreen(id: string, dto: Partial<CreateScreenDto>) {
    return this.prisma.screen.update({ where: { id }, data: dto });
  }

  async deleteScreen(id: string) {
    return this.prisma.screen.delete({ where: { id } });
  }

  async assignPermissionToScreen(screenId: string, dto: AssignScreenPermissionDto) {
    return this.prisma.screenPermission.upsert({
      where: { screenId_permissionId: { screenId, permissionId: dto.permissionId } },
      create: { screenId, permissionId: dto.permissionId },
      update: {},
    });
  }

  async removePermissionFromScreen(screenId: string, permissionId: string) {
    return this.prisma.screenPermission.deleteMany({ where: { screenId, permissionId } });
  }

  // ── ROLES ────────────────────────────────────────────────

  async getAllRoles() {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: { include: { permission: { include: { module: true, action: true } } } },
        _count: { select: { userAssignments: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: { include: { permission: true } },
        userAssignments: { include: { user: { select: { id: true, email: true, phone: true } } } },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  // ── USER ASSIGNMENTS ──────────────────────────────────────

  async getUserAssignments(userId: string) {
    return this.prisma.userAssignment.findMany({
      where: { userId, isActive: true },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: { include: { module: true, action: true } } },
            },
          },
        },
      },
    });
  }

  async assignRoleToUser(userId: string, grantedBy: string, dto: AssignRoleDto) {
    const { roleId, communityId, expiresAt, isActive } = dto;

    const existing = await this.prisma.userAssignment.findFirst({
      where: { userId, roleId, communityId: communityId ?? null },
    });

    const data = {
      communityId: communityId ?? null,
      grantedBy,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: isActive ?? true,
    };

    if (existing) {
      return this.prisma.userAssignment.update({
        where: { id: existing.id },
        data,
        include: { role: true },
      });
    }

    return this.prisma.userAssignment.create({
      data: { userId, roleId, ...data },
      include: { role: true },
    });
  }


  async revokeRoleFromUser(userId: string, roleId: string) {
    return this.prisma.userAssignment.updateMany({
      where: { userId, roleId },
      data: { isActive: false },
    });
  }

  async revokeAssignmentById(assignmentId: string) {
    return this.prisma.userAssignment.delete({
      where: { id: assignmentId },
    });
  }

  // ── SCREEN ACCESS CHECK ───────────────────────────────────

  /**
   * Returns list of screens a user can access based on their role permissions.
   * Super-admin bypass: sees everything.
   */
  async getUserAccessibleScreens(userId: string): Promise<{ slug: string; route: string; name: string }[]> {
    // Get user's active role assignments
    const assignments = await this.prisma.userAssignment.findMany({
      where: {
        userId,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        role: {
          include: {
            rolePermissions: { select: { permissionId: true } },
          },
        },
      },
    });

    // Check if super admin
    const isSuperAdmin = assignments.some((a) => a.role.name === 'SUPER_ADMIN');
    if (isSuperAdmin) {
      return this.prisma.screen.findMany({
        where: { isActive: true },
        select: { slug: true, route: true, name: true },
        orderBy: { sortOrder: 'asc' },
      });
    }

    // Collect all permission IDs this user has
    const permissionIds = new Set<string>();
    for (const a of assignments) {
      for (const rp of a.role.rolePermissions) {
        permissionIds.add(rp.permissionId);
      }
    }

    // Get screens whose required permissions are ALL held by the user
    const allScreens = await this.prisma.screen.findMany({
      where: { isActive: true },
      include: { screenPermissions: { select: { permissionId: true } } },
      orderBy: { sortOrder: 'asc' },
    });

    return allScreens
      .filter((screen) => {
        // Screen with no permission requirements = accessible to all authenticated users
        if (screen.screenPermissions.length === 0) return true;
        // Screen is accessible if user has AT LEAST ONE matching permission
        return screen.screenPermissions.some((sp) => permissionIds.has(sp.permissionId));
      })
      .map(({ slug, route, name }) => ({ slug, route, name }));
  }

  /**
   * Check if a user can access a specific screen by slug.
   */
  async canUserAccessScreen(userId: string, screenSlug: string): Promise<boolean> {
    const accessible = await this.getUserAccessibleScreens(userId);
    return accessible.some((s) => s.slug === screenSlug);
  }
}
