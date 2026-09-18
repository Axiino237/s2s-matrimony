import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus, BadRequestException,
} from '@nestjs/common';
import { RbacService } from './rbac.service';
import { CreateScreenDto } from './dto/create-screen.dto';
import { AssignScreenPermissionDto } from './dto/screen-permission.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('rbac')
@UseGuards(JwtAuthGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // ── SCREENS ─────────────────────────────────────────────

  /** GET /rbac/screens — List all screens */
  @Get('screens')
  getAllScreens() {
    return this.rbacService.getAllScreens();
  }

  /** GET /rbac/screens/:slug — Get screen by slug */
  @Get('screens/:slug')
  getScreen(@Param('slug') slug: string) {
    return this.rbacService.getScreenBySlug(slug);
  }

  /** POST /rbac/screens — Create screen */
  @Post('screens')
  createScreen(@Body() dto: CreateScreenDto) {
    return this.rbacService.createScreen(dto);
  }

  /** PUT /rbac/screens/:id — Update screen */
  @Put('screens/:id')
  updateScreen(@Param('id') id: string, @Body() dto: Partial<CreateScreenDto>) {
    return this.rbacService.updateScreen(id, dto);
  }

  /** DELETE /rbac/screens/:id — Delete screen */
  @Delete('screens/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteScreen(@Param('id') id: string) {
    return this.rbacService.deleteScreen(id);
  }

  /** POST /rbac/screens/:id/permissions — Assign permission to screen */
  @Post('screens/:id/permissions')
  assignPermission(@Param('id') screenId: string, @Body() dto: AssignScreenPermissionDto) {
    return this.rbacService.assignPermissionToScreen(screenId, dto);
  }

  /** DELETE /rbac/screens/:id/permissions/:permId — Remove permission from screen */
  @Delete('screens/:id/permissions/:permId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removePermission(@Param('id') screenId: string, @Param('permId') permissionId: string) {
    return this.rbacService.removePermissionFromScreen(screenId, permissionId);
  }

  // ── ROLES ────────────────────────────────────────────────

  /** GET /rbac/roles — List all roles */
  @Get('roles')
  getAllRoles() {
    return this.rbacService.getAllRoles();
  }

  /** GET /rbac/roles/:id — Get role details */
  @Get('roles/:id')
  getRole(@Param('id') id: string) {
    return this.rbacService.getRoleById(id);
  }

  // ── USER ASSIGNMENTS ──────────────────────────────────────

  /** GET /rbac/users/:userId/assignments — Get user role assignments */
  @Get('users/:userId/assignments')
  getUserAssignments(@Param('userId') userId: string) {
    return this.rbacService.getUserAssignments(userId);
  }

  /** POST /rbac/users/:userId/assign-role or POST /rbac/users/assign-role */
  @Post(['users/:userId/assign-role', 'users/assign-role'])
  assignRole(
    @Param('userId') paramUserId: string,
    @Req() req: any,
    @Body() dto: AssignRoleDto & { userId?: string },
  ) {
    const targetUserId = paramUserId || dto.userId;
    if (!targetUserId) {
      throw new BadRequestException('userId is required');
    }
    return this.rbacService.assignRoleToUser(targetUserId, req.user.id, dto);
  }

  /** PATCH /rbac/users/:userId/revoke-role/:roleId — Revoke role from user */
  @Patch('users/:userId/revoke-role/:roleId')
  revokeRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.rbacService.revokeRoleFromUser(userId, roleId);
  }

  /** DELETE /rbac/users/revoke-role/:assignmentId — Delete assignment directly */
  @Delete('users/revoke-role/:assignmentId')
  deleteAssignment(@Param('assignmentId') assignmentId: string) {
    return this.rbacService.revokeAssignmentById(assignmentId);
  }

  // ── SCREEN ACCESS ─────────────────────────────────────────

  /** GET /rbac/users/:userId/screen-access — Get all screens user can access with roles */
  @Get('users/:userId/screen-access')
  async getScreenAccess(@Param('userId') userId: string) {
    const [accessibleScreens, assignments] = await Promise.all([
      this.rbacService.getUserAccessibleScreens(userId),
      this.rbacService.getUserAssignments(userId),
    ]);
    const roles = assignments.map((a) => a.role.name);
    return {
      roles,
      accessibleScreens,
      totalAccessible: accessibleScreens.length,
    };
  }

  /** GET /rbac/check-access?screen=slug OR ?screenSlug=slug — Check access to a screen */
  @Get('check-access')
  checkAccess(
    @Query('screen') screen: string,
    @Query('screenSlug') screenSlug: string,
    @Req() req: any,
  ) {
    const targetScreen = screen || screenSlug;
    return this.rbacService
      .canUserAccessScreen(req.user.id, targetScreen)
      .then((can) => ({ canAccess: can, hasAccess: can, screen: targetScreen }));
  }

  /** GET /rbac/my-screens — Current logged-in user's accessible screens */
  @Get('my-screens')
  myScreens(@Req() req: any) {
    return this.rbacService.getUserAccessibleScreens(req.user.id);
  }
}
