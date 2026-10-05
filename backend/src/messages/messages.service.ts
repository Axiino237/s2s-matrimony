import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../common/entitlements.service';
import { devStore, devInterestsStore, devMessagesStore, devChatsStore } from '../common/dev-store';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  /** Get all chats for the logged-in user, with the last message + other person's profile */
  async getChats(userId: string) {
    const chatMap = new Map<string, any>();

    // 1. Prisma DB Accepted Interests
    try {
      const acceptedInterests = await this.prisma.interest.findMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
          status: 'ACCEPTED',
        },
      });

      for (const item of acceptedInterests) {
        const partnerId = item.senderId === userId ? item.receiverId : item.senderId;
        const partnerUser = await this.prisma.user.findUnique({
          where: { id: partnerId },
          include: { profile: { include: { photos: true, community: true } } },
        });
        if (!partnerUser) continue;

        const u1 = item.senderId < item.receiverId ? item.senderId : item.receiverId;
        const u2 = item.senderId < item.receiverId ? item.receiverId : item.senderId;

        let chat = await this.prisma.chat.findFirst({
          where: {
            OR: [
              { user1Id: userId, user2Id: partnerId },
              { user1Id: partnerId, user2Id: userId },
            ],
          },
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        });

        if (!chat) {
          try {
            chat = await this.prisma.chat.create({
              data: { user1Id: u1, user2Id: u2 },
              include: {
                messages: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            });
          } catch {
            chat = await this.prisma.chat.findFirst({
              where: {
                OR: [
                  { user1Id: userId, user2Id: partnerId },
                  { user1Id: partnerId, user2Id: userId },
                ],
              },
              include: {
                messages: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            });
          }
        }

        if (!chat) continue;

        const devMsgs = devMessagesStore.get(chat.id) || [];
        const lastDevMsg = devMsgs[devMsgs.length - 1];
        const lastMessage = lastDevMsg || (chat.messages?.[0] ?? null);

        const p = partnerUser.profile;
        const partnerName = p ? `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Member' : 'Member';
        const partnerPhoto = p?.photos?.[0]?.url || (p?.gender === 'FEMALE' ? '/images/bride.png' : '/images/groom.png');

        chatMap.set(chat.id, {
          chatId: chat.id,
          partnerId,
          partnerName,
          partnerPhoto,
          partnerCommunityId: p?.communityId ?? null,
          isVerified: p?.isVerified ?? false,
          lastMessage: lastMessage?.content ?? 'Connected! Say hi 👋',
          lastMessageTime: lastMessage?.createdAt ?? chat.createdAt,
          lastMessageSentByMe: lastMessage?.senderId === userId,
          unreadCount: 0,
          updatedAt: chat.updatedAt,
        });
      }
    } catch {
      // Ignore DB errors
    }

    // 2. devInterestsStore (Only ACCEPTED interests involving userId)
    const userDevInterests = devInterestsStore.filter(
      (i) => (i.senderId === userId || i.receiverId === userId) && i.status === 'ACCEPTED',
    );

    for (const item of userDevInterests) {
      const partnerId = item.senderId === userId ? item.receiverId : item.senderId;
      const partnerDevUser = devStore.get(partnerId) || (item.senderId === userId ? item.receiver?.profile : item.sender?.profile);

      const partnerName = partnerDevUser
        ? `${partnerDevUser.firstName || ''} ${partnerDevUser.lastName || ''}`.trim() || 'Member'
        : partnerId === 'user-male-001'
        ? 'Aravindhan Ravi'
        : 'Kavitha Ramasamy';

      const partnerPhoto = partnerDevUser?.gender === 'FEMALE' ? '/images/bride.png' : '/images/groom.png';
      const chatId = `chat-${userId < partnerId ? userId : partnerId}-${userId < partnerId ? partnerId : userId}`;

      const devMsgs = devMessagesStore.get(chatId) || [];
      const lastDevMsg = devMsgs[devMsgs.length - 1];

      if (!chatMap.has(chatId)) {
        chatMap.set(chatId, {
          chatId,
          partnerId,
          partnerName,
          partnerPhoto,
          isVerified: true,
          lastMessage: lastDevMsg?.content ?? 'Connected! Say hi 👋',
          lastMessageTime: lastDevMsg?.createdAt ?? item.createdAt,
          lastMessageSentByMe: lastDevMsg?.senderId === userId,
          unreadCount: 0,
          updatedAt: item.createdAt,
        });
      }
    }

    // 3. devMessagesStore (Any chat where userId sent or received messages)
    for (const [chatId, msgs] of devMessagesStore.entries()) {
      if (chatMap.has(chatId) || !msgs || msgs.length === 0) continue;

      const hasUserMsg = msgs.some((m) => m.senderId === userId || chatId.includes(userId));
      if (!hasUserMsg) continue;

      const lastDevMsg = msgs[msgs.length - 1];
      const partnerId = msgs.find((m) => m.senderId !== userId)?.senderId || 'user-male-001';
      const partnerDevUser = devStore.get(partnerId);

      const partnerName = partnerDevUser
        ? `${partnerDevUser.firstName || ''} ${partnerDevUser.lastName || ''}`.trim() || 'Member'
        : partnerId === 'user-male-001'
        ? 'Aravindhan Ravi'
        : 'Kavitha Ramasamy';

      const partnerPhoto = partnerDevUser?.gender === 'FEMALE' ? '/images/bride.png' : '/images/groom.png';

      chatMap.set(chatId, {
        chatId,
        partnerId,
        partnerName,
        partnerPhoto,
        isVerified: true,
        lastMessage: lastDevMsg?.content ?? 'Connected! Say hi 👋',
        lastMessageTime: lastDevMsg?.createdAt ?? new Date().toISOString(),
        lastMessageSentByMe: lastDevMsg?.senderId === userId,
        unreadCount: 0,
        updatedAt: lastDevMsg?.createdAt ?? new Date().toISOString(),
      });
    }

    const list = Array.from(chatMap.values());
    return list.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
  }

  /** Get all messages inside a specific chat */
  async getMessages(userId: string, chatId: string, page = 1, limit = 50) {
    try {
      const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
      if (chat) {
        const skip = (page - 1) * limit;
        const dbMessages = await this.prisma.message.findMany({
          where: { chatId, deletedAt: null },
          orderBy: { createdAt: 'asc' },
          skip,
          take: limit,
        });

        const devMsgs = devMessagesStore.get(chatId) || [];
        const existingDbIds = new Set(dbMessages.map((m) => m.id));
        const uniqueDevMsgs = devMsgs.filter((m) => !existingDbIds.has(m.id));
        const combined = [...dbMessages, ...uniqueDevMsgs];

        const deduped: any[] = [];
        for (const m of combined) {
          const isDup = deduped.some(
            (d) =>
              d.senderId === m.senderId &&
              d.content === m.content &&
              Math.abs(new Date(d.createdAt).getTime() - new Date(m.createdAt).getTime()) < 5000,
          );
          if (!isDup) deduped.push(m);
        }

        return deduped.map((m) => ({
          id: m.id,
          chatId: m.chatId,
          senderId: m.senderId,
          sent: m.senderId === userId,
          content: m.content,
          type: m.type || 'TEXT',
          isRead: m.isRead ?? true,
          createdAt: m.createdAt,
        }));
      }
    } catch {
      // Fallthrough to dev mode
    }

    const devMsgs = devMessagesStore.get(chatId) || [];
    const dedupedDevMsgs: any[] = [];
    for (const m of devMsgs) {
      const isDup = dedupedDevMsgs.some(
        (d) =>
          d.senderId === m.senderId &&
          d.content === m.content &&
          Math.abs(new Date(d.createdAt).getTime() - new Date(m.createdAt).getTime()) < 5000,
      );
      if (!isDup) dedupedDevMsgs.push(m);
    }

    return dedupedDevMsgs.map((m) => ({
      id: m.id,
      chatId: m.chatId,
      senderId: m.senderId,
      sent: m.senderId === userId,
      content: m.content,
      type: m.type || 'TEXT',
      isRead: m.isRead ?? true,
      createdAt: m.createdAt,
    }));
  }

  /** Send a message in a chat */
  /** Send a message in a chat */
  async sendMessage(userId: string, chatId: string, content: string) {
    // 1. Resolve other participant in this chat
    let otherUserId: string | null = null;
    try {
      const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
      if (chat) {
        otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
      }
    } catch {
      // ignore
    }

    if (!otherUserId) {
      const devChat = devChatsStore.get(chatId);
      if (devChat) {
        otherUserId = devChat.user1Id === userId ? devChat.user2Id : devChat.user1Id;
      }
    }

    if (!otherUserId && chatId.startsWith('chat-')) {
      const raw = chatId.replace('chat-', '');
      if (raw.includes('__')) {
        const [u1, u2] = raw.split('__');
        otherUserId = u1 === userId ? u2 : u1;
      } else {
        // Also check if any known user or accepted interest matches this chatId
        for (const item of devInterestsStore) {
          if (chatId.includes(item.senderId) && chatId.includes(item.receiverId)) {
            otherUserId = item.senderId === userId ? item.receiverId : item.senderId;
            break;
          }
        }
      }
    }

    // 2. Verify an ACCEPTED interest exists between the two members
    let acceptedInterest: any = null;
    if (otherUserId) {
      try {
        acceptedInterest = await this.prisma.interest.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: userId },
            ],
            status: 'ACCEPTED',
          },
        });
      } catch {
        // ignore
      }

      if (!acceptedInterest) {
        acceptedInterest = devInterestsStore.find(
          (i) =>
            ((i.senderId === userId && i.receiverId === otherUserId) ||
              (i.senderId === otherUserId && i.receiverId === userId)) &&
            i.status === 'ACCEPTED',
        );
      }
    }

    if (!acceptedInterest) {
      throw new ForbiddenException(
        'Messaging is only allowed between members after an Express Interest request has been accepted.',
      );
    }

    // 3. Dynamic chat capability verification
    // Recipient of an accepted interest can reply; otherwise check initiator's plan
    const isRecipientReplying = acceptedInterest.receiverId === userId;
    if (!isRecipientReplying) {
      const entitlements = await this.entitlementsService.getUserEntitlements(userId);
      if (!entitlements.hasChat) {
        throw new ForbiddenException(
          `Live Chat is disabled for your active membership plan (${entitlements.planName}). Please upgrade to unlock chat!`,
        );
      }
    }

    const msgs = devMessagesStore.get(chatId) || [];
    const lastMsg = msgs[msgs.length - 1];
    if (
      lastMsg &&
      lastMsg.senderId === userId &&
      lastMsg.content === content &&
      Math.abs(Date.now() - new Date(lastMsg.createdAt).getTime()) < 3000
    ) {
      return lastMsg;
    }

    const newMsg = {
      id: `msg-${Date.now()}`,
      chatId,
      senderId: userId,
      content,
      type: 'TEXT',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    try {
      const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
      if (chat) {
        // Prevent DB duplicate insert within 3 seconds
        const recentDbMsg = await this.prisma.message.findFirst({
          where: { chatId, senderId: userId, content },
          orderBy: { createdAt: 'desc' },
        });

        if (
          recentDbMsg &&
          Math.abs(Date.now() - new Date(recentDbMsg.createdAt).getTime()) < 3000
        ) {
          return recentDbMsg;
        }

        const dbMessage = await this.prisma.message.create({
          data: { chatId, senderId: userId, content },
        });

        await this.prisma.chat.update({
          where: { id: chatId },
          data: { updatedAt: new Date() },
        }).catch(() => null);

        return dbMessage;
      }
    } catch {
      // Fallback
    }

    msgs.push(newMsg);
    devMessagesStore.set(chatId, msgs);

    return newMsg;
  }

  /** Start a new chat with another user (or return existing) */
  async startChat(userId: string, otherUserId: string) {
    // 1. Verify Interest is ACCEPTED between users
    let acceptedInterest: any = null;
    try {
      acceptedInterest = await this.prisma.interest.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
          status: 'ACCEPTED',
        },
      });
    } catch {
      // ignore
    }

    if (!acceptedInterest) {
      acceptedInterest = devInterestsStore.find(
        (i) =>
          ((i.senderId === userId && i.receiverId === otherUserId) ||
            (i.senderId === otherUserId && i.receiverId === userId)) &&
          i.status === 'ACCEPTED',
      );
    }

    if (!acceptedInterest) {
      throw new ForbiddenException(
        'Live Chat is disabled until Express Interest is ACCEPTED by both members.',
      );
    }

    // 2. If user is the recipient of the interest, allow reply access. Otherwise check initiator's plan.
    const isRecipient = acceptedInterest.receiverId === userId;
    if (!isRecipient) {
      const entitlements = await this.entitlementsService.getUserEntitlements(userId);
      if (!entitlements.hasChat) {
        throw new ForbiddenException(
          `Live Chat is disabled for your active membership plan (${entitlements.planName}). Please upgrade to unlock chat!`,
        );
      }
    }

    try {
      const existing = await this.prisma.chat.findFirst({
        where: {
          OR: [
            { user1Id: userId, user2Id: otherUserId },
            { user1Id: otherUserId, user2Id: userId },
          ],
        },
      });

      if (existing) return { chatId: existing.id };

      const u1 = userId < otherUserId ? userId : otherUserId;
      const u2 = userId < otherUserId ? otherUserId : userId;

      const chat = await this.prisma.chat.create({
        data: { user1Id: u1, user2Id: u2 },
      });

      return { chatId: chat.id };
    } catch {
      // Fallback
    }

    const u1 = userId < otherUserId ? userId : otherUserId;
    const u2 = userId < otherUserId ? otherUserId : userId;
    const cId = `chat-${u1}__${u2}`;
    devChatsStore.set(cId, { user1Id: u1, user2Id: u2 });
    devChatsStore.set(`chat-${u1}-${u2}`, { user1Id: u1, user2Id: u2 });
    return { chatId: cId };
  }
}
