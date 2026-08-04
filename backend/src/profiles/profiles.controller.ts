import { Controller, Get, Patch, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { BiodataParserService } from './biodata-parser.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public, RequirePermissions, Roles } from '../common/decorators/rbac.decorator';
import { Permission, Role } from '../common/enums/rbac.enum';

@ApiTags('Profiles')
@Controller('profiles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly biodataParserService: BiodataParserService,
  ) {}

  @Public()
  @Post('parse-biodata')
  @ApiOperation({ summary: 'Parse matrimony biodata text/OCR and extract structured JSON' })
  async parseBiodata(@Body() body: { text?: string; imageBase64?: string }) {
    const rawText = body.text || '';
    return this.biodataParserService.parseText(rawText);
  }

  @Post('save-parsed-profile')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @RequirePermissions(Permission.PROFILES_WRITE)
  @ApiOperation({ summary: 'Save/Import parsed AI biodata JSON into PostgreSQL Database' })
  async saveParsedProfile(@Body() body: { extractedData: any }) {
    return this.profilesService.saveParsedProfile(body.extractedData);
  }

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get member dashboard statistics' })
  async getDashboardStats(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.profilesService.getDashboardStats(userId);
  }

  @Get('viewers')
  @ApiOperation({ summary: 'Get list of users who viewed my profile' })
  async getProfileViewers(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.profilesService.getProfileViewers(userId);
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Record a profile view' })
  async recordProfileView(@Req() req: any, @Param('id') ownerId: string) {
    const viewerId = req.user.sub || req.user.id;
    return this.profilesService.recordProfileView(viewerId, ownerId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMyProfile(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.profilesService.getProfileByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get profile by ID' })
  async getProfileById(@Param('id') id: string) {
    return this.profilesService.getProfileById(id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile details' })
  async updateProfile(@Req() req: any, @Body() data: any) {
    const userId = req.user.sub || req.user.id;
    return this.profilesService.updateProfile(userId, data);
  }

  @Post('photos')
  @ApiOperation({ summary: 'Upload a profile photo' })
  async uploadPhoto(@Req() req: any, @Body() body: { url: string; isMain?: boolean }) {
    const userId = req.user.sub || req.user.id;
    return this.profilesService.uploadPhoto(userId, body.url, body.isMain);
  }

  @Delete('photos/:id')
  @ApiOperation({ summary: 'Delete a profile photo' })
  async deletePhoto(@Req() req: any, @Param('id') photoId: string) {
    const userId = req.user.sub || req.user.id;
    return this.profilesService.deletePhoto(userId, photoId);
  }

  @Post(':id/favorite')
  @ApiOperation({ summary: 'Toggle favorite status for a profile' })
  async toggleFavorite(@Req() req: any, @Param('id') profileId: string) {
    const userId = req.user.sub || req.user.id;
    return this.profilesService.toggleFavorite(userId, profileId);
  }

  @Get('favorites/list')
  @ApiOperation({ summary: 'Get list of favorited profiles' })
  async getFavorites(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.profilesService.getFavorites(userId);
  }

  @Post('block/:targetUserId')
  @ApiOperation({ summary: 'Block a user' })
  async blockUser(
    @Req() req: any,
    @Param('targetUserId') targetUserId: string,
    @Body() body: { reason?: string },
  ) {
    const userId = req.user.sub || req.user.id;
    return this.profilesService.blockUser(userId, targetUserId, body.reason);
  }

  @Delete('block/:targetUserId')
  @ApiOperation({ summary: 'Unblock a user' })
  async unblockUser(@Req() req: any, @Param('targetUserId') targetUserId: string) {
    const userId = req.user.sub || req.user.id;
    return this.profilesService.unblockUser(userId, targetUserId);
  }

  @Get('blocks/list')
  @ApiOperation({ summary: 'Get list of blocked users' })
  async getBlockedUsers(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.profilesService.getBlockedUsers(userId);
  }

  @Post(':id/unlock-contact')
  @ApiOperation({ summary: 'Unlock contact information (phone & email) for a profile' })
  async unlockContact(@Req() req: any, @Param('id') profileId: string) {
    const userId = req.user.sub || req.user.id;
    return this.profilesService.unlockContact(userId, profileId);
  }
}
