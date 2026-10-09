import { Controller, Get, Patch, Post, Delete, Param, Body, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { BiodataParserService } from './biodata-parser.service';
import { HoroscopeMatchingService } from './horoscope-matching.service';
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
    private readonly horoscopeMatchingService: HoroscopeMatchingService,
  ) {}

  @Public()
  @Post('parse-biodata')
  @ApiOperation({ summary: 'Parse matrimony biodata text/OCR and extract structured JSON' })
  async parseBiodata(@Body() body: { text?: string; imageBase64?: string }) {
    return this.biodataParserService.parseBiodata(body);
  }

  @Post('send-verification-otp')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @RequirePermissions(Permission.PROFILES_WRITE)
  @ApiOperation({ summary: 'Send OTP to verify member mobile number or email for biodata engine' })
  async sendVerificationOtp(@Body() body: { type: 'phone' | 'email'; value: string; name?: string }) {
    return this.profilesService.sendVerificationOtp(body);
  }

  @Post('verify-contact-otp')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @RequirePermissions(Permission.PROFILES_WRITE)
  @ApiOperation({ summary: 'Verify OTP code submitted for member mobile or email' })
  async verifyContactOtp(@Body() body: { type: 'phone' | 'email'; value: string; otp: string }) {
    return this.profilesService.verifyContactOtp(body);
  }

  @Post('save-parsed-profile')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @RequirePermissions(Permission.PROFILES_WRITE)
  @ApiOperation({ summary: 'Save/Import parsed AI biodata JSON into PostgreSQL Database' })
  async saveParsedProfile(@Body() body: any) {
    const extractedData = body?.extractedData !== undefined ? body.extractedData : body;
    return this.profilesService.saveParsedProfile(extractedData);
  }

  @Get('dashboard-stats')
  @RequirePermissions(Permission.MEMBER_DASHBOARD)
  @ApiOperation({ summary: 'Get member dashboard statistics' })
  async getDashboardStats(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.profilesService.getDashboardStats(userId);
  }

  @Get('viewers')
  @RequirePermissions(Permission.MEMBER_VIEWERS)
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
  @RequirePermissions(Permission.MEMBER_PROFILE)
  @ApiOperation({ summary: 'Get current user profile' })
  async getMyProfile(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.profilesService.getProfileByUserId(userId);
  }

  @Get('horoscope-matches')
  @RequirePermissions(Permission.MEMBER_SEARCH)
  @ApiOperation({ summary: 'Get pre-calculated opposite-gender horoscope matches' })
  async getHoroscopeMatches(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.horoscopeMatchingService.getHoroscopeMatches(userId);
  }

  @Post('horoscope-matches/backfill')
  @ApiOperation({ summary: 'Run one-time population backfill of eligible horoscope pairs' })
  async backfillHoroscopeMatches(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    const isElite = await this.horoscopeMatchingService.isUserElite(userId);
    if (!isElite) {
      throw new ForbiddenException('Only Elite members or administrators can trigger horoscope backfill.');
    }
    return this.horoscopeMatchingService.backfillAllEligible();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get profile by ID' })
  async getProfileById(@Req() req: any, @Param('id') id: string) {
    const requesterUserId = req.user?.sub || req.user?.id;
    const roles = req.user?.roles || [];
    const isStaff = roles.some((r: string) => ['ADMIN', 'SUPER_ADMIN'].includes(r));
    return this.profilesService.getProfileById(id, requesterUserId, isStaff);
  }

  @Patch('me')
  @RequirePermissions(Permission.MEMBER_PROFILE)
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

  @Delete('photos')
  @ApiOperation({ summary: 'Delete a profile photo by body or query' })
  async deletePhotoBody(
    @Req() req: any,
    @Body() body: { id?: string; photoId?: string; url?: string },
    @Query('id') queryId?: string,
  ) {
    const userId = req.user.sub || req.user.id;
    const targetId = body?.id || body?.photoId || queryId;
    return this.profilesService.deletePhoto(userId, targetId, body?.url);
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
  @RequirePermissions(Permission.MEMBER_CONTACTS)
  @ApiOperation({ summary: 'Unlock contact information (phone & email) for a profile' })
  async unlockContact(@Req() req: any, @Param('id') profileId: string) {
    const userId = req.user.sub || req.user.id;
    return this.profilesService.unlockContact(userId, profileId);
  }
}
