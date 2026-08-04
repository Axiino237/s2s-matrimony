import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommunitiesService } from './communities.service';
import { Public, Roles, RequirePermissions } from '../common/decorators/rbac.decorator';
import { Role, Permission } from '../common/enums/rbac.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@ApiTags('Communities')
@Controller('communities')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all communities' })
  async findAll(@Query('search') search?: string) {
    return this.communitiesService.findAll(search);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get community by ID' })
  async findOne(@Param('id') id: string) {
    return this.communitiesService.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermissions(Permission.COMMUNITIES_WRITE)
  @ApiOperation({ summary: 'Create a new community (Admin only)' })
  async create(@Body() body: { name: string; description?: string }) {
    return this.communitiesService.create(body);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermissions(Permission.COMMUNITIES_WRITE)
  @ApiOperation({ summary: 'Update a community (Admin only)' })
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; isActive?: boolean }
  ) {
    return this.communitiesService.update(id, body);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @RequirePermissions(Permission.COMMUNITIES_DELETE)
  @ApiOperation({ summary: 'Delete a community (Admin only)' })
  async remove(@Param('id') id: string) {
    return this.communitiesService.remove(id);
  }
}
