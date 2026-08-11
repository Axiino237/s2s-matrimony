import { Controller, Get, Post, Put, Delete, Patch, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { PaymentsService } from '../payments/payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles, RequirePermissions, Public } from '../common/decorators/rbac.decorator';
import { Role, Permission } from '../common/enums/rbac.enum';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get('plans')
  @RequirePermissions(Permission.PAYMENTS_VIEW)
  @ApiOperation({ summary: 'Get all membership plans for admin' })
  async getPlans() {
    return this.paymentsService.getPlans();
  }

  @Post('plans')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new membership plan' })
  async createPlan(@Body() body: any) {
    return this.paymentsService.createPlan(body);
  }

  @Put('plans/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a membership plan' })
  async updatePlan(@Param('id') id: string, @Body() body: any) {
    return this.paymentsService.updatePlan(id, body);
  }

  @Patch('plans/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Toggle membership plan active status' })
  async togglePlanActive(@Param('id') id: string, @Body() body: { isActive?: boolean }) {
    return this.paymentsService.togglePlanActive(id, body.isActive);
  }

  @Delete('plans/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a membership plan' })
  async deletePlan(@Param('id') id: string) {
    return this.paymentsService.deletePlan(id);
  }

  @Get('dashboard-stats')
  @RequirePermissions(Permission.USERS_READ)
  @ApiOperation({ summary: 'Get high-level admin dashboard statistics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @RequirePermissions(Permission.USERS_READ)
  @ApiOperation({ summary: 'Get paginated list of system users' })
  async getUsers(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getUsers(search, req.user, page, limit);
  }

  @Get('profiles')
  @RequirePermissions(Permission.PROFILES_READ)
  @ApiOperation({ summary: 'Get pending verification profiles' })
  async getPendingProfiles(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getPendingProfiles(search, page, limit, status);
  }

  @Get('payments')
  @RequirePermissions(Permission.PAYMENTS_VIEW)
  @ApiOperation({ summary: 'Get paginated list of payments' })
  async getPayments(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getPayments(search, page, limit);
  }

  @Get('reports')
  @RequirePermissions(Permission.REPORTS_VIEW)
  @ApiOperation({ summary: 'Get user abuse reports' })
  async getReports(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getReports(search, page, limit);
  }

  @Patch('reports/:id')
  @RequirePermissions(Permission.REPORTS_HANDLE)
  @ApiOperation({ summary: 'Update report status' })
  async updateReport(@Param('id') id: string, @Body() body: { status: string; reviewNote?: string }) {
    return this.adminService.updateReportStatus(id, body.status, body.reviewNote);
  }

  @Public()
  @Get('public/blogs')
  @ApiOperation({ summary: 'Get public blog posts list' })
  async getPublicBlogs(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getBlogs(search, page, limit);
  }

  @Public()
  @Get('public/success-stories')
  @ApiOperation({ summary: 'Get public success stories list' })
  async getPublicSuccessStories(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getSuccessStories(search, page, limit, true);
  }

  @Get('blogs')
  @RequirePermissions(Permission.BLOGS_READ)
  @ApiOperation({ summary: 'Get blog posts list' })
  async getBlogs(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getBlogs(search, page, limit);
  }

  @Post('blogs')
  @RequirePermissions(Permission.BLOGS_WRITE)
  @ApiOperation({ summary: 'Create a new blog post' })
  async createBlog(@Body() body: { title: string; content?: string; coverImage?: string; tags?: string[] }) {
    return this.adminService.createBlog(body);
  }

  @Delete('blogs/:id')
  @RequirePermissions(Permission.BLOGS_DELETE)
  @ApiOperation({ summary: 'Delete a blog post' })
  async deleteBlog(@Param('id') id: string) {
    return this.adminService.deleteBlog(id);
  }

  @Get('banners')
  @RequirePermissions(Permission.BLOGS_READ)
  @ApiOperation({ summary: 'Get banners list' })
  async getBanners(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getBanners(page, limit);
  }

  @Post('banners')
  @RequirePermissions(Permission.BLOGS_WRITE)
  @ApiOperation({ summary: 'Create a new banner' })
  async createBanner(@Body() body: { title: string; imageUrl: string; page?: string; linkUrl?: string }) {
    return this.adminService.createBanner(body);
  }

  @Delete('banners/:id')
  @RequirePermissions(Permission.BLOGS_DELETE)
  @ApiOperation({ summary: 'Delete a banner' })
  async deleteBanner(@Param('id') id: string) {
    return this.adminService.deleteBanner(id);
  }

  @Get('success-stories')
  @RequirePermissions(Permission.BLOGS_READ)
  @ApiOperation({ summary: 'Get success stories list' })
  async getSuccessStories(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('publishedOnly') publishedOnly?: boolean | string,
  ) {
    const isPub = publishedOnly === true || publishedOnly === 'true';
    return this.adminService.getSuccessStories(search, page, limit, isPub);
  }

  @Post('success-stories')
  @RequirePermissions(Permission.BLOGS_WRITE)
  @ApiOperation({ summary: 'Create a new success story' })
  async createSuccessStory(@Body() body: { groomName: string; brideName: string; story: string; photo?: string; marriageDate?: string }) {
    return this.adminService.createSuccessStory(body);
  }

  @Patch('success-stories/:id/publish')
  @RequirePermissions(Permission.BLOGS_PUBLISH)
  @ApiOperation({ summary: 'Approve & publish a success story' })
  async publishSuccessStory(@Param('id') id: string, @Body('isPublished') isPublished?: boolean) {
    return this.adminService.updateSuccessStoryStatus(id, isPublished ?? true);
  }

  @Delete('success-stories/:id')
  @RequirePermissions(Permission.BLOGS_DELETE)
  @ApiOperation({ summary: 'Delete a success story' })
  async deleteSuccessStory(@Param('id') id: string) {
    return this.adminService.deleteSuccessStory(id);
  }

  @Patch('verify-profile/:id')
  @RequirePermissions(Permission.PROFILES_VERIFY)
  @ApiOperation({ summary: 'Approve or reject profile verification request' })
  async verifyProfile(@Param('id') profileId: string, @Body() body: { status: 'VERIFIED' | 'REJECTED' }) {
    return this.adminService.verifyProfile(profileId, body.status);
  }

  @Patch('ban-user/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @RequirePermissions(Permission.USERS_BAN)
  @ApiOperation({ summary: 'Deactivate / Ban a user' })
  async banUser(@Req() req: any, @Param('id') userId: string) {
    return this.adminService.banUser(req.user, userId);
  }

  @Delete('users/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @RequirePermissions(Permission.USERS_BAN)
  @ApiOperation({ summary: 'Permanently delete a user from database' })
  async deleteUser(@Req() req: any, @Param('id') userId: string) {
    return this.adminService.deleteUser(req.user, userId);
  }

  @Get('logs')
  @RequirePermissions(Permission.AUDIT_VIEW)
  @ApiOperation({ summary: 'Get audit and system activity logs' })
  async getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
  ) {
    return this.adminService.getAuditLogs(page, limit, type);
  }
}
