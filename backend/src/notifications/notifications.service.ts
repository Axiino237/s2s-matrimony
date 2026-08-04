import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyNotifications(userId: string) {
    try {
      const [notifications, unreadCount] = await Promise.all([
        this.prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        this.prisma.notification.count({
          where: { userId, isRead: false },
        }),
      ]);
      return {
        notifications: notifications || [],
        unreadCount: unreadCount || 0,
      };
    } catch {
      return {
        notifications: [],
        unreadCount: 0,
      };
    }
  }

  async markAsRead(userId: string, notificationId?: string) {
    try {
      if (notificationId) {
        return await this.prisma.notification.updateMany({
          where: { id: notificationId, userId },
          data: { isRead: true, readAt: new Date() },
        });
      }

      return await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
    } catch {
      return { count: 0 };
    }
  }
}
