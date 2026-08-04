import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { devInterestsStore } from '../common/dev-store';

@Injectable()
export class InterestsService {
  constructor(private readonly prisma: PrismaService) {}

  async sendInterest(senderUserId: string, receiverUserId: string, message?: string) {
    if (senderUserId === receiverUserId) {
      throw new BadRequestException('You cannot send interest to yourself');
    }

    let targetUserId = receiverUserId;
    try {
      let receiver = await this.prisma.user.findUnique({ where: { id: targetUserId } }).catch(() => null);
      if (!receiver) {
        const targetProf = await this.prisma.profile.findFirst({
          where: { OR: [{ id: targetUserId }, { userId: targetUserId }] },
        }).catch(() => null);
        if (targetProf) {
          targetUserId = targetProf.userId;
          receiver = await this.prisma.user.findUnique({ where: { id: targetUserId } }).catch(() => null);
        }
      }

      if (receiver) {
        const senderProfile = await this.prisma.profile.findFirst({ where: { userId: senderUserId } }).catch(() => null);
        const senderName = senderProfile ? `${senderProfile.firstName} ${senderProfile.lastName}`.trim() : 'A member';

        const interest = await this.prisma.interest.upsert({
          where: {
            senderId_receiverId: {
              senderId: senderUserId,
              receiverId: targetUserId,
            },
          },
          update: { status: 'PENDING', message },
          create: {
            senderId: senderUserId,
            receiverId: targetUserId,
            message,
          },
        });

        await this.prisma.notification.create({
          data: {
            userId: targetUserId,
            type: 'INTEREST',
            title: 'New Interest Expressed',
            message: `${senderName} expressed interest in your profile!`,
            data: { senderUserId, interestId: interest.id },
          },
        }).catch(() => null);

        return interest;
      }
    } catch {
      // Fallthrough to dev fallback
    }

    // Dev/Demo Fallback
    const newDevInterest = {
      id: `dev-int-${Date.now()}`,
      senderId: senderUserId,
      receiverId: targetUserId,
      status: 'PENDING',
      message: message || 'Expressed interest in your profile.',
      createdAt: new Date().toISOString(),
    };

    const existingIdx = devInterestsStore.findIndex(
      (i) => i.senderId === senderUserId && i.receiverId === targetUserId,
    );
    if (existingIdx >= 0) devInterestsStore.splice(existingIdx, 1);
    devInterestsStore.unshift(newDevInterest);

    return newDevInterest;
  }

  async respondToInterest(receiverUserId: string, interestId: string, status: 'ACCEPTED' | 'REJECTED') {
    try {
      const interest = await this.prisma.interest.findUnique({ where: { id: interestId } });
      if (interest) {
        const updatedInterest = await this.prisma.interest.update({
          where: { id: interestId },
          data: { status },
        });

        const receiverProfile = await this.prisma.profile.findFirst({ where: { userId: receiverUserId } }).catch(() => null);
        const receiverName = receiverProfile ? `${receiverProfile.firstName} ${receiverProfile.lastName}`.trim() : 'A member';

        if (status === 'ACCEPTED') {
          await this.prisma.notification.create({
            data: {
              userId: interest.senderId,
              type: 'INTEREST',
              title: 'Interest Accepted!',
              message: `${receiverName} accepted your interest request! You can now message each other.`,
              data: { receiverUserId, interestId: interest.id },
            },
          }).catch(() => null);

          const u1 = interest.senderId < interest.receiverId ? interest.senderId : interest.receiverId;
          const u2 = interest.senderId < interest.receiverId ? interest.receiverId : interest.senderId;

          await this.prisma.chat.upsert({
            where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
            create: { user1Id: u1, user2Id: u2 },
            update: {},
          }).catch(() => null);
        }

        return updatedInterest;
      }
    } catch {
      // Fallback
    }

    const devItem = devInterestsStore.find((i) => i.id === interestId);
    if (devItem) {
      devItem.status = status;
      return devItem;
    }

    return {
      id: interestId,
      status,
      message: status === 'ACCEPTED' ? 'Interest request accepted successfully' : 'Interest request rejected',
      updatedAt: new Date().toISOString(),
    };
  }

  async getReceivedInterests(userId: string) {
    let dbReceived: any[] = [];
    try {
      dbReceived = await this.prisma.interest.findMany({
        where: { receiverId: userId },
        include: {
          sender: {
            include: {
              profile: {
                include: { photos: true, community: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      dbReceived = [];
    }

    const devRec = devInterestsStore.filter((i) => i.receiverId === userId);
    const dbIds = new Set((dbReceived || []).map((i) => i.id));
    return [...(dbReceived || []), ...devRec.filter((i) => !dbIds.has(i.id))];
  }

  async getSentInterests(userId: string) {
    let dbSent: any[] = [];
    try {
      dbSent = await this.prisma.interest.findMany({
        where: { senderId: userId },
        include: {
          receiver: {
            include: {
              profile: {
                include: { photos: true, community: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      dbSent = [];
    }

    const devSent = devInterestsStore.filter((i) => i.senderId === userId);
    const dbIds = new Set((dbSent || []).map((i) => i.id));
    return [...(dbSent || []), ...devSent.filter((i) => !dbIds.has(i.id))];
  }
}
