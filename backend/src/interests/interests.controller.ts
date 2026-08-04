import { Controller, Post, Patch, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InterestsService } from './interests.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Interests')
@Controller('interests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InterestsController {
  constructor(private readonly interestsService: InterestsService) {}

  @Post()
  @ApiOperation({ summary: 'Send interest to a profile' })
  async sendInterestBase(@Req() req: any, @Body() body: { receiverUserId: string; message?: string }) {
    const userId = req.user.sub || req.user.id;
    return this.interestsService.sendInterest(userId, body.receiverUserId, body.message);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send interest to a profile' })
  async sendInterest(@Req() req: any, @Body() body: { receiverUserId: string; message?: string }) {
    const userId = req.user.sub || req.user.id;
    return this.interestsService.sendInterest(userId, body.receiverUserId, body.message);
  }

  @Patch(':id/respond')
  @ApiOperation({ summary: 'Accept or reject an interest request' })
  async respond(
    @Req() req: any,
    @Param('id') interestId: string,
    @Body() body: { status: 'ACCEPTED' | 'REJECTED' },
  ) {
    const userId = req.user.sub || req.user.id;
    return this.interestsService.respondToInterest(userId, interestId, body.status);
  }

  @Get('received')
  @ApiOperation({ summary: 'List interests received by current user' })
  async getReceived(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.interestsService.getReceivedInterests(userId);
  }

  @Get('sent')
  @ApiOperation({ summary: 'List interests sent by current user' })
  async getSent(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.interestsService.getSentInterests(userId);
  }
}

