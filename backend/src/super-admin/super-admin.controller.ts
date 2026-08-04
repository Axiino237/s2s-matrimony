import { Controller, Get, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
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

  @Get('stats')
  @ApiOperation({ summary: 'Get global platform statistics' })
  async getGlobalStats() {
    return this.superAdminService.getGlobalStats();
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
