import { Controller, Get, Put, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/rbac.decorator';
import { Role } from '../common/enums/rbac.enum';

@ApiTags('Super Admin')
@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@ApiBearerAuth()
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Get all database roles' })
  async getAllRoles() {
    return this.superAdminService.getAllRoles();
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create a new custom role in database' })
  async createRole(@Body() body: { name: string; displayName?: string; description?: string }) {
    return this.superAdminService.createRole(body);
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: 'Delete a custom role from database' })
  async deleteRole(@Param('id') id: string) {
    return this.superAdminService.deleteRole(id);
  }

  @Get('modules-permissions')
  @ApiOperation({ summary: 'Get all database screen modules and linked permissions' })
  async getModulesWithPermissions() {
    return this.superAdminService.getModulesWithPermissions();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get global platform statistics' })
  async getGlobalStats() {
    return this.superAdminService.getGlobalStats();
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get live platform reports & analytics metrics' })
  async getReportsAnalytics() {
    return this.superAdminService.getReportsAnalytics();
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get global system settings' })
  async getSystemSettings() {
    return this.superAdminService.getSystemSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update global system settings' })
  async updateSystemSettings(@Body() body: any) {
    return this.superAdminService.updateSystemSettings(body);
  }

  @Get('admins')
  @ApiOperation({ summary: 'Get list of all admin users' })
  async getAdmins(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.superAdminService.getAdmins(search, page, limit);
  }

  @Post('admins')
  @ApiOperation({ summary: 'Create new admin staff user in DB' })
  async createAdminStaff(@Body() body: { name: string; email: string; role: string; community?: string; password?: string }) {
    return this.superAdminService.createAdminStaff(body);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get system and UAM audit logs' })
  async getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('search') search?: string,
  ) {
    return this.superAdminService.getAuditLogs(page, limit, type, action, entity, search);
  }

  @Get('audit-logs/export')
  @ApiOperation({ summary: 'Export audit logs' })
  async exportAuditLogs(
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('search') search?: string,
  ) {
    const logs = await this.superAdminService.getAuditLogsForExport(action, entity, search);
    return { data: logs, total: logs.length };
  }

  @Get('reports/data')
  @ApiOperation({ summary: 'Get dataset for report exports' })
  async getReportData(
    @Query('type') type: string,
    @Query('days') days?: number,
  ) {
    const data = await this.superAdminService.getReportExportData(type || 'registrations', days ? +days : 30);
    return { data, total: data.length };
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get monthly revenue trend' })
  async getRevenueTrend(@Query('months') months?: number) {
    return this.superAdminService.getRevenueTrend(months);
  }

  @Get('community-breakdown')
  @ApiOperation({ summary: 'Get member count by community' })
  async getCommunityBreakdown() {
    return this.superAdminService.getCommunityBreakdown();
  }

  @Get('role-permissions')
  @ApiOperation({ summary: 'Get all system role permissions matrix from DB' })
  async getRolePermissions() {
    return this.superAdminService.getRolePermissions();
  }

  @Put('role-permissions/:roleName')
  @ApiOperation({ summary: 'Update permissions for a specific role in DB' })
  async updateRolePermissions(@Param('roleName') roleName: string, @Body() body: { permissions: string[] }) {
    return this.superAdminService.updateRolePermissions(roleName, body.permissions || []);
  }

  @Put('admins/:userId/role')
  @ApiOperation({ summary: 'Update staff user role in DB' })
  async updateUserRole(@Param('userId') userId: string, @Body() body: { role: string }) {
    return this.superAdminService.updateUserRole(userId, body.role);
  }
}
