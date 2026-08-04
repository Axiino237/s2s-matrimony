import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications & unread count' })
  async getMyNotifications(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.notificationsService.getMyNotifications(userId);
  }

  @Patch('mark-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.notificationsService.markAsRead(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark specific notification as read' })
  async markOneAsRead(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub || req.user.id;
    return this.notificationsService.markAsRead(userId, id);
  }
}
