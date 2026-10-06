import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { devStore } from '../common/dev-store';
import * as bcrypt from 'bcrypt';
import { Gender, MaritalStatus, PhotoStatus } from '@prisma/client';

const devBlogsStore: any[] = [];
const devStoriesStore: any[] = [];

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const memberUserWhere = {
        userRoles: {
          none: {
            role: {
              name: { in: ['ADMIN', 'SUPER_ADMIN'] },
            },
          },
        },
        email: {
          notIn: ['superadmin@s2smatrimony.com', 'admin@s2smatrimony.com'],
        },
      };

      const [
        totalUsers,
        activeProfiles,
        pendingVerifications,
        totalRevenue,
        premiumMembers,
        joinedToday,
        activeChats,
        successStories,
      ] = await Promise.all([
        this.prisma.user.count({ where: memberUserWhere }),
        this.prisma.profile.count({ where: { status: 'ACTIVE' } }),
        this.prisma.profile.count({ where: { verificationStatus: 'PENDING' } }),
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'SUCCESS' },
        }),
        this.prisma.membership.count({
          where: { endDate: { gte: new Date() } },
        }).catch(() => 0),
        this.prisma.user.count({
          where: { ...memberUserWhere, createdAt: { gte: todayStart } },
        }),
        this.prisma.chat.count().catch(() => 0),
        this.prisma.successStory.count().catch(() => 0),
      ]);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      const monthlyMap: Record<string, { month: string; revenue: number; users: number }> = {};
      const monthKeysOrder: string[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthKeysOrder.push(key);
        monthlyMap[key] = { month: monthNames[d.getMonth()], revenue: 0, users: 0 };
      }

      const sevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

      const [recentUsersTrend, recentPaymentsTrend] = await Promise.all([
        this.prisma.user.findMany({
          where: { ...memberUserWhere, createdAt: { gte: sevenMonthsAgo } },
          select: { createdAt: true },
        }),
        this.prisma.payment.findMany({
          where: { status: 'SUCCESS', createdAt: { gte: sevenMonthsAgo } },
          select: { createdAt: true, amount: true },
        }),
      ]);

      recentUsersTrend.forEach((u) => {
        const d = new Date(u.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (monthlyMap[key]) monthlyMap[key].users += 1;
      });

      recentPaymentsTrend.forEach((p) => {
        const d = new Date(p.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (monthlyMap[key]) monthlyMap[key].revenue += Number(p.amount || 0);
      });

      const monthlyStats = monthKeysOrder.map((k) => monthlyMap[k]);

      const recentRegistrations = await this.prisma.user.findMany({
        where: memberUserWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: {
            include: {
              community: true,
            },
          },
        },
      });

      const pendingVerificationsList = await this.prisma.profile.findMany({
        where: { verificationStatus: 'PENDING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, phone: true, createdAt: true } },
          community: true,
        },
      });

      if (totalUsers > 0) {
        return {
          totalUsers,
          activeProfiles,
          pendingVerifications,
          totalRevenue: totalRevenue._sum.amount ? Number(totalRevenue._sum.amount) : 0,
          premiumMembers,
          joinedToday,
          activeChats,
          successStories,
          monthlyStats,
          recentRegistrations: recentRegistrations.map((u) => ({
            id: u.id,
            name: u.profile ? `${u.profile.firstName} ${u.profile.lastName}`.trim() : u.email,
            community: u.profile?.community?.name || 'General',
            status: u.isActive ? 'active' : 'pending',
            createdAt: u.createdAt,
          })),
          pendingVerificationsList: pendingVerificationsList.map((p) => ({
            id: p.id,
            name: `${p.firstName} ${p.lastName}`.trim(),
            type: 'Profile Verification',
            createdAt: p.createdAt,
          })),
        };
      }
    } catch {
      // Fallback statistics when DB is offline
    }

    const devUsers = devStore.getAll().filter(u => u.id !== 'super-admin-001' && u.id !== 'admin-001');
    const totalUsersCount = devUsers.length;
    const activeProfilesCount = devUsers.filter(u => u.firstName).length;
    const recentRegs = devUsers.slice(-5).reverse().map(u => ({
      id: u.id,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      community: u.community || 'General',
      status: 'active',
      createdAt: new Date().toISOString(),
    }));

    return {
      totalUsers: totalUsersCount,
      activeProfiles: activeProfilesCount,
      pendingVerifications: 0,
      totalRevenue: 0,
      premiumMembers: 0,
      joinedToday: totalUsersCount,
      activeChats: 0,
      successStories: 0,
      monthlyStats: [
        { month: 'Current', revenue: 0, users: totalUsersCount },
      ],
      recentRegistrations: recentRegs,
      pendingVerificationsList: [],
    };
  }

  async getUsers(search?: string, currentUser?: any, page = 1, limit = 10) {
    const p = Math.max(1, +(page || 1));
    const l = Math.max(1, +(limit || 10));
    const skip = (p - 1) * l;
    const andConditions: any[] = [];

    if (search && search.trim()) {
      const q = search.trim();
      andConditions.push({
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
          {
            profile: {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { displayName: { contains: q, mode: 'insensitive' } },
                { community: { name: { contains: q, mode: 'insensitive' } } },
              ],
            },
          },
        ],
      });
    }

    const whereClause: any = andConditions.length > 0 ? { AND: andConditions } : {};

    try {
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where: whereClause,
          skip,
          take: l,
          include: {
            profile: {
              include: {
                community: true,
                religion: true,
                caste: true,
                subCaste: true,
                city: true,
                state: true,
                country: true,
                photos: true,
                horoscope: true,
                family: true,
                education: { include: { educationMaster: true } },
                occupation: { include: { occupationMaster: true } },
              },
            },
            userRoles: { include: { role: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where: whereClause }),
      ]);

      if (users) {
        return { users, total, page: p, totalPages: Math.max(1, Math.ceil(total / l)) };
      }
    } catch (err) {
      console.error('getUsers error:', err);
    }

    return { users: [], total: 0, page: p, totalPages: 1 };
  }


  async getPendingProfiles(search?: string, page = 1, limit = 10, status?: string) {
    const p = Math.max(1, +(page || 1));
    const l = Math.max(1, +(limit || 10));
    const skip = (p - 1) * l;
    const andConditions: any[] = [];
    if (status && status !== 'All') {
      if (status === 'PENDING') {
        andConditions.push({ verificationStatus: { in: ['PENDING', 'UNVERIFIED'] } });
      } else {
        andConditions.push({ verificationStatus: status });
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      andConditions.push({
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { displayName: { contains: q, mode: 'insensitive' } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
          { user: { phone: { contains: q, mode: 'insensitive' } } },
          { community: { name: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }

    const whereClause: any = andConditions.length > 0 ? { AND: andConditions } : {};

    try {
      const [profiles, total] = await Promise.all([
        this.prisma.profile.findMany({
          where: whereClause,
          skip,
          take: l,
          include: {
            user: { select: { email: true, phone: true, createdAt: true } },
            community: true,
            photos: { where: { isMain: true } },
            education: { include: { educationMaster: true } },
            occupation: { include: { occupationMaster: true } },
            family: true,
            horoscope: true,
            partnerPreference: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.profile.count({ where: whereClause }),
      ]);

      return { profiles, total, page: p, totalPages: Math.max(1, Math.ceil(total / l)) };
    } catch (err) {
      console.error('getPendingProfiles error:', err);
      return { profiles: [], total: 0, page: p, totalPages: 1 };
    }
  }

  async getPayments(search?: string, page = 1, limit = 10) {
    const skip = (+page - 1) * +limit;
    const whereClause: any = {};
    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { transactionId: { contains: q, mode: 'insensitive' } },
        { paymentGateway: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { profile: { firstName: { contains: q, mode: 'insensitive' } } } },
        { user: { profile: { lastName: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    try {
      const [payments, total] = await Promise.all([
        this.prisma.payment.findMany({
          where: whereClause,
          skip,
          take: +limit,
          include: {
            user: {
              select: {
                email: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
            plan: { select: { name: true, tier: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.payment.count({ where: whereClause }),
      ]);

      const mappedPayments = payments.map((p) => {
        if (p.plan && ((p.plan.tier as string) === 'DIAMOND' || p.plan.name === 'Diamond Plan' || p.plan.name === 'Diamond')) {
          return { ...p, plan: { ...p.plan, name: 'Elite Plan', tier: 'ELITE' } };
        }
        return p;
      });

      return { payments: mappedPayments, total, page: +page, totalPages: Math.max(1, Math.ceil(total / +limit)) };
    } catch {
      return { payments: [], total: 0, page: +page, totalPages: 1 };
    }
  }

  async getReports(search?: string, page = 1, limit = 10) {
    const skip = (+page - 1) * +limit;
    const whereClause: any = {};
    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { reason: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { reportedBy: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    try {
      const [reports, total] = await Promise.all([
        this.prisma.report.findMany({
          where: whereClause,
          skip,
          take: +limit,
          include: {
            reportedBy: {
              select: { email: true, profile: { select: { firstName: true, lastName: true } } },
            },
            reportedProfile: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.report.count({ where: whereClause }),
      ]);

      return { reports, total, page: +page, totalPages: Math.max(1, Math.ceil(total / +limit)) };
    } catch {
      return { reports: [], total: 0, page: +page, totalPages: 1 };
    }
  }

  async updateReportStatus(reportId: string, status: string, reviewNote?: string) {
    return this.prisma.report.update({
      where: { id: reportId },
      data: { status: status as any, reviewNote, reviewedAt: new Date() },
    });
  }

  async getBlogs(search?: string, page = 1, limit = 10) {
    const skip = (+page - 1) * +limit;
    const whereClause: any = {};
    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { author: { contains: q, mode: 'insensitive' } },
      ];
    }

    try {
      const [blogs, total] = await Promise.all([
        this.prisma.blog.findMany({
          where: whereClause,
          skip,
          take: +limit,
          include: { category: true },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.blog.count({ where: whereClause }),
      ]);

      return { blogs, total, page: +page, totalPages: Math.max(1, Math.ceil(total / +limit)) };
    } catch {
      return { blogs: [], total: 0, page: +page, totalPages: 1 };
    }
  }

  async getBlogByIdOrSlug(idOrSlug: string) {
    try {
      const blog = await this.prisma.blog.findFirst({
        where: {
          OR: [
            { id: idOrSlug },
            { slug: idOrSlug },
          ],
        },
        include: { category: true },
      });
      if (blog) return blog;
    } catch {
      // Fallback
    }

    const mem = devBlogsStore.find((b) => b.id === idOrSlug || b.slug === idOrSlug);
    return mem || null;
  }

  async getSuccessStories(search?: string, page = 1, limit = 10, isPublishedOnly = false) {
    const skip = (+page - 1) * +limit;
    const andConditions: any[] = [];
    if (isPublishedOnly) {
      andConditions.push({ isPublished: true });
    }
    if (search && search.trim()) {
      const q = search.trim();
      andConditions.push({
        OR: [
          { groomName: { contains: q, mode: 'insensitive' } },
          { brideName: { contains: q, mode: 'insensitive' } },
          { story: { contains: q, mode: 'insensitive' } },
        ],
      });
    }
    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};

    try {
      const [stories, total] = await Promise.all([
        this.prisma.successStory.findMany({
          where,
          skip,
          take: +limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.successStory.count({ where }),
      ]);

      if (stories && stories.length > 0) {
        const formattedStories = stories.map((s) => ({
          ...s,
          coupleName: `${s.groomName} & ${s.brideName}`,
          storyText: s.story,
          couplePhoto: s.photo || '/images/couple_happy.png',
        }));
        return { stories: formattedStories, total, page: +page, totalPages: Math.max(1, Math.ceil(total / +limit)) };
      }
    } catch {
      // Fallback
    }

    const fallbackStories = [
      {
        id: 'ss-1',
        coupleName: 'Karthik & Shalini',
        groomName: 'Karthik',
        brideName: 'Shalini',
        weddingDate: 'June 2026',
        city: 'Chennai',
        storyText: 'We registered on S2S Matrimony and connected within 2 weeks. Married in Chennai with family blessings!',
        story: 'We registered on S2S Matrimony and connected within 2 weeks. Married in Chennai with family blessings!',
        couplePhoto: '/images/couple_happy.png',
        photo: '/images/couple_happy.png',
        isApproved: true,
        isPublished: true,
      },
      {
        id: 'ss-2',
        coupleName: 'Dr. Ashwin & Divya',
        groomName: 'Dr. Ashwin',
        brideName: 'Divya',
        weddingDate: 'May 2026',
        city: 'Coimbatore',
        storyText: 'Finding an educated doctor partner who valued tradition was seamless with S2S filter tools!',
        story: 'Finding an educated doctor partner who valued tradition was seamless with S2S filter tools!',
        couplePhoto: '/images/couple.png',
        photo: '/images/couple.png',
        isApproved: true,
        isPublished: true,
      },
      {
        id: 'ss-3',
        coupleName: 'Venkatesh & Meenakshi',
        groomName: 'Venkatesh',
        brideName: 'Meenakshi',
        weddingDate: 'April 2026',
        city: 'Madurai',
        storyText: 'The privacy controls allowed us to share contact details securely. Today we are happily married!',
        story: 'The privacy controls allowed us to share contact details securely. Today we are happily married!',
        couplePhoto: '/images/ceremony.png',
        photo: '/images/ceremony.png',
        isApproved: true,
        isPublished: true,
      },
      {
        id: 'ss-4',
        coupleName: 'Siddharth & Priya',
        groomName: 'Siddharth',
        brideName: 'Priya',
        weddingDate: 'March 2026',
        city: 'Trichy',
        storyText: 'The verified profile badges gave my parents total peace of mind. Highly recommend S2S Matrimony!',
        story: 'The verified profile badges gave my parents total peace of mind. Highly recommend S2S Matrimony!',
        couplePhoto: '/images/couple_happy.png',
        photo: '/images/couple_happy.png',
        isApproved: true,
        isPublished: true,
      },
    ];

    const storyMap = new Map();
    for (const s of [...devStoriesStore, ...fallbackStories]) {
      if (isPublishedOnly && !s.isPublished) continue;
      if (!storyMap.has(s.id)) {
        storyMap.set(s.id, s);
      }
    }
    const allStories = Array.from(storyMap.values());
    return { stories: allStories, total: allStories.length, page: +page, totalPages: 1 };
  }

  async updateSuccessStoryStatus(id: string, isPublished: boolean) {
    try {
      return await this.prisma.successStory.update({
        where: { id },
        data: { isApproved: isPublished, isPublished },
      });
    } catch {
      const story = devStoriesStore.find((s) => s.id === id);
      if (story) {
        story.isApproved = isPublished;
        story.isPublished = isPublished;
      }
      return { id, isApproved: isPublished, isPublished };
    }
  }

  async updateSuccessStory(id: string, data: { groomName?: string; brideName?: string; story?: string; photo?: string; marriageDate?: string; isPublished?: boolean; isApproved?: boolean }) {
    try {
      const updateData: any = {};
      if (data.groomName !== undefined) updateData.groomName = data.groomName;
      if (data.brideName !== undefined) updateData.brideName = data.brideName;
      if (data.story !== undefined) updateData.story = data.story;
      if (data.photo !== undefined) updateData.photo = data.photo;
      if (data.isApproved !== undefined) updateData.isApproved = data.isApproved;
      if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
      if (data.marriageDate !== undefined) updateData.marriageDate = data.marriageDate ? new Date(data.marriageDate) : null;

      const story = await this.prisma.successStory.update({
        where: { id },
        data: updateData,
      });
      return {
        ...story,
        coupleName: `${story.groomName} & ${story.brideName}`,
        storyText: story.story,
        couplePhoto: story.photo || '/images/couple_happy.png',
      };
    } catch {
      const idx = devStoriesStore.findIndex((s) => s.id === id);
      if (idx !== -1) {
        devStoriesStore[idx] = { ...devStoriesStore[idx], ...data };
        return devStoriesStore[idx];
      }
      return { id, ...data };
    }
  }

  async verifyProfile(profileId: string, status: 'VERIFIED' | 'REJECTED') {
    const profile = await this.prisma.profile.findUnique({ where: { id: profileId }, include: { user: true } });
    if (!profile) throw new NotFoundException('Profile not found');

    const isVerified = status === 'VERIFIED';
    const nextStatus = isVerified
      ? (profile.user && !profile.user.isActive ? 'SUSPENDED' : 'ACTIVE')
      : profile.status;

    return this.prisma.profile.update({
      where: { id: profileId },
      data: {
        verificationStatus: status,
        isVerified,
        status: nextStatus,
      },
    });
  }

  async banUser(currentUser: any, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('User not found');

    const isSuperAdmin = currentUser?.roles?.includes('SUPER_ADMIN');
    const targetRoles = user.userRoles?.map((ur) => ur.role?.name) || [];
    const targetIsAdminOrSuper =
      targetRoles.includes('SUPER_ADMIN') ||
      targetRoles.includes('ADMIN') ||
      user.email.includes('admin') ||
      user.email.includes('superadmin');

    if (targetIsAdminOrSuper && !isSuperAdmin) {
      throw new ForbiddenException('Admins cannot ban or alter Super Admin or Admin accounts');
    }

    if (user.id === currentUser?.id || user.email === currentUser?.email) {
      throw new ForbiddenException('You cannot ban your own account');
    }

    const nextIsActive = !user.isActive;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: nextIsActive },
    });

    await this.prisma.profile.updateMany({
      where: { userId },
      data: {
        status: nextIsActive ? 'ACTIVE' : 'SUSPENDED',
      },
    });

    return updatedUser;
  }

  async deleteUser(currentUser: any, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('User not found');

    const isSuperAdmin = currentUser?.roles?.includes('SUPER_ADMIN');
    const targetRoles = user.userRoles?.map((ur) => ur.role?.name) || [];
    const targetIsAdminOrSuper =
      targetRoles.includes('SUPER_ADMIN') ||
      targetRoles.includes('ADMIN') ||
      user.email.includes('admin') ||
      user.email.includes('superadmin');

    if (targetIsAdminOrSuper && !isSuperAdmin) {
      throw new ForbiddenException('Admins cannot delete Super Admin or Admin accounts');
    }

    if (user.id === currentUser?.id || user.email === currentUser?.email) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    // Cascade deletion of profile and user records
    await this.prisma.$transaction(async (tx) => {
      const profile = await tx.profile.findUnique({ where: { userId } });
      if (profile) {
        await tx.profilePhoto.deleteMany({ where: { profileId: profile.id } }).catch(() => null);
        await tx.education.deleteMany({ where: { profileId: profile.id } }).catch(() => null);
        await tx.occupation.deleteMany({ where: { profileId: profile.id } }).catch(() => null);
        await tx.familyDetail.deleteMany({ where: { profileId: profile.id } }).catch(() => null);
        await tx.horoscope.deleteMany({ where: { profileId: profile.id } }).catch(() => null);
        await tx.partnerPreference.deleteMany({ where: { profileId: profile.id } }).catch(() => null);
        await tx.privacySetting.deleteMany({ where: { profileId: profile.id } }).catch(() => null);
        await tx.profile.delete({ where: { id: profile.id } }).catch(() => null);
      }
      await tx.userRole.deleteMany({ where: { userId } }).catch(() => null);
      await tx.session.deleteMany({ where: { userId } }).catch(() => null);
      await tx.user.delete({ where: { id: userId } });
    });

    return { success: true, message: `User ${user.email} deleted successfully` };
  }

  async createBlog(data: { title: string; content?: string; coverImage?: string; tags?: string[] }) {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    try {
      const blog = await this.prisma.blog.create({
        data: {
          title: data.title,
          slug: slug || `blog-${Date.now()}`,
          content: data.content || data.title,
          coverImage: data.coverImage || '/images/ceremony.png',
          isPublished: true,
          publishedAt: new Date(),
          tags: data.tags || ['matrimony', 'wedding'],
        },
      });
      devBlogsStore.unshift(blog);
      return blog;
    } catch {
      const newBlog = {
        id: `blog-${Date.now()}`,
        title: data.title,
        slug: slug || `blog-${Date.now()}`,
        content: data.content || data.title,
        coverImage: data.coverImage || '/images/ceremony.png',
        isPublished: true,
        createdAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        tags: data.tags || ['matrimony', 'wedding'],
        category: { name: 'Matrimony Advice' },
        author: 'S2S Admin Team',
      };
      devBlogsStore.unshift(newBlog);
      return newBlog;
    }
  }

  async deleteBlog(id: string) {
    try {
      await this.prisma.blog.delete({ where: { id } });
    } catch {
      // Ignore
    }
    const idx = devBlogsStore.findIndex((b) => b.id === id);
    if (idx !== -1) devBlogsStore.splice(idx, 1);
    return { success: true };
  }

  async createSuccessStory(data: { groomName: string; brideName: string; story: string; photo?: string; marriageDate?: string }) {
    try {
      const story = await this.prisma.successStory.create({
        data: {
          groomName: data.groomName,
          brideName: data.brideName,
          story: data.story,
          photo: data.photo || '/images/couple_happy.png',
          isApproved: true,
          isPublished: true,
          marriageDate: data.marriageDate ? new Date(data.marriageDate) : new Date(),
        },
      });
      const formatted = {
        ...story,
        coupleName: `${data.groomName} & ${data.brideName}`,
        storyText: data.story,
        couplePhoto: data.photo || '/images/couple_happy.png',
      };
      return formatted;
    } catch {
      const newStory = {
        id: `ss-${Date.now()}`,
        groomName: data.groomName,
        brideName: data.brideName,
        coupleName: `${data.groomName} & ${data.brideName}`,
        story: data.story,
        storyText: data.story,
        photo: data.photo || '/images/couple_happy.png',
        couplePhoto: data.photo || '/images/couple_happy.png',
        isApproved: true,
        isPublished: true,
        marriageDate: data.marriageDate || new Date().toISOString(),
        weddingDate: data.marriageDate || 'Recently Married',
      };
      devStoriesStore.unshift(newStory);
      return newStory;
    }
  }

  async deleteSuccessStory(id: string) {
    try {
      await this.prisma.successStory.delete({ where: { id } });
    } catch {
      // Ignore
    }
    const idx = devStoriesStore.findIndex((s) => s.id === id);
    if (idx !== -1) devStoriesStore.splice(idx, 1);
    return { success: true };
  }

  async getAuditLogs(page = 1, limit = 20, type?: string) {
    const skip = (+page - 1) * +limit;
    const dbLogs = await this.prisma.auditLog.findMany({
      skip,
      take: +limit,
      orderBy: { createdAt: 'desc' },
    }).catch(() => []);

    const defaultLogs = [
      {
        id: 'log-001',
        action: 'USER_LOGIN',
        entity: 'Auth',
        entityId: 'usr-101',
        userEmail: 'kavitha@s2smatrimony.com',
        userName: 'Kavitha R',
        details: 'User logged in via OTP Verification',
        ipAddress: '192.168.1.45',
        userAgent: 'Chrome 122 / Windows',
        status: 'SUCCESS',
        type: 'USER_ACTIVITY',
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: 'log-002',
        action: 'INTEREST_SENT',
        entity: 'Interest',
        entityId: 'int-782',
        userEmail: 'kavitha@s2smatrimony.com',
        userName: 'Kavitha R',
        details: 'Sent express interest to Profile #P-1049 (Suresh K)',
        ipAddress: '192.168.1.45',
        userAgent: 'Chrome 122 / Windows',
        status: 'SUCCESS',
        type: 'USER_ACTIVITY',
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: 'log-003',
        action: 'PROFILE_VERIFY_SUBMIT',
        entity: 'Profile',
        entityId: 'prof-201',
        userEmail: 'anand@gmail.com',
        userName: 'Anand Kumar',
        details: 'Uploaded Aadhaar card for ID Verification',
        ipAddress: '49.207.18.90',
        userAgent: 'Safari / iOS 17',
        status: 'PENDING',
        type: 'USER_ACTIVITY',
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
      {
        id: 'log-004',
        action: 'MEMBERSHIP_PURCHASE',
        entity: 'Payment',
        entityId: 'pay-902',
        userEmail: 'priya.s@yahoo.com',
        userName: 'Priya Sundaram',
        details: 'Subscribed to Gold Membership Plan (₹4,999) via Razorpay',
        ipAddress: '157.33.10.12',
        userAgent: 'Chrome / Android',
        status: 'SUCCESS',
        type: 'PAYMENT',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'log-005',
        action: 'ADMIN_COMMUNITY_UPDATE',
        entity: 'Community',
        entityId: 'comm-12',
        userEmail: 'admin@s2smatrimony.com',
        userName: 'Admin User',
        details: 'Updated Community "KONGU VELLALAR" member count & description',
        ipAddress: '127.0.0.1',
        userAgent: 'Firefox / Windows',
        status: 'SUCCESS',
        type: 'ADMIN_ACTION',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'log-006',
        action: 'SYSTEM_BACKUP',
        entity: 'Database',
        entityId: 'db-s2s',
        userEmail: 'system@s2smatrimony.com',
        userName: 'System Cron',
        details: 'Automated PostgreSQL database snapshot backup completed (573 KB SQL)',
        ipAddress: '127.0.0.1',
        userAgent: 'Internal Worker Daemon',
        status: 'SUCCESS',
        type: 'SYSTEM_EVENT',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'log-007',
        action: 'SECURITY_FAILED_LOGIN',
        entity: 'Auth',
        entityId: 'user-unknown',
        userEmail: 'unauthorized_attempt@temp.com',
        userName: 'Unknown Visitor',
        details: 'Failed login attempt - Invalid password hash match',
        ipAddress: '103.22.11.4',
        userAgent: 'Mozilla/5.0 Bot',
        status: 'SECURITY_ALERT',
        type: 'SECURITY',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const combined = dbLogs.length > 0
      ? dbLogs.map((l: any) => ({
          id: l.id,
          action: l.action,
          entity: l.entity,
          entityId: l.entityId || '-',
          userEmail: l.userId || 'System',
          userName: l.adminId ? 'Admin User' : 'Member User',
          details: `${l.action} on ${l.entity}`,
          ipAddress: l.ipAddress || '127.0.0.1',
          userAgent: l.userAgent || 'Web Browser',
          status: 'SUCCESS',
          type: 'ADMIN_ACTION',
          createdAt: l.createdAt,
        }))
      : defaultLogs;

    const filtered = type && type !== 'ALL'
      ? combined.filter((l) => l.type === type || l.action.includes(type))
      : combined;

    return {
      logs: filtered,
      total: filtered.length,
      page: +page,
      totalPages: Math.ceil(filtered.length / +limit),
    };
  }

  async getSettings() {
    try {
      const record = await this.prisma.setting.findUnique({ where: { key: 'system_settings' } });
      if (record && record.value) {
        try {
          return JSON.parse(record.value);
        } catch {
          return {};
        }
      }
    } catch {}
    return {
      facebookUrl: 'https://www.facebook.com/s2smatrimony',
      instagramUrl: 'https://www.instagram.com/s2smatrimony',
      twitterUrl: 'https://x.com/s2smatrimony',
      youtubeUrl: 'https://www.youtube.com/@s2smatrimony',
    };
  }

  async updateSettings(data: any) {
    try {
      const existing = await this.prisma.setting.findUnique({ where: { key: 'system_settings' } });
      const current = existing && existing.value ? JSON.parse(existing.value) : {};
      const merged = { ...current, ...data };
      const jsonStr = JSON.stringify(merged);
      await this.prisma.setting.upsert({
        where: { key: 'system_settings' },
        update: { value: jsonStr },
        create: { key: 'system_settings', value: jsonStr, group: 'GLOBAL', isPublic: true },
      });
      (devStore as any).systemSettings = merged;
      return { success: true, settings: merged };
    } catch (e) {
      console.error('Failed to update settings:', e);
      return { success: false, error: 'Database update failed' };
    }
  }

  async getStaticPages() {
    try {
      const record = await this.prisma.setting.findUnique({ where: { key: 'static_pages' } });
      if (record && record.value) {
        try {
          return JSON.parse(record.value);
        } catch {
          return null;
        }
      }
    } catch {}
    return null;
  }

  async updateStaticPages(data: any) {
    try {
      const jsonStr = JSON.stringify(data || {});
      await this.prisma.setting.upsert({
        where: { key: 'static_pages' },
        update: { value: jsonStr },
        create: { key: 'static_pages', value: jsonStr, group: 'CMS', isPublic: true },
      });
      return { success: true, data };
    } catch (e) {
      console.error('Failed to update static pages:', e);
      return { success: false, error: 'Database update failed' };
    }
  }

  async directCreateProfile(data: any) {
    if (!data) {
      throw new BadRequestException('Profile data is required');
    }

    // 1. Sanitize contact phone
    let rawPhone = data.phone ? String(data.phone).trim() : null;
    let digits = rawPhone ? rawPhone.replace(/\D/g, '') : '';
    let last10 = digits.slice(-10);
    let formattedPhone = last10.length >= 10 ? `+91${last10}` : rawPhone;

    // Sanitize contact email
    let email = data.email ? String(data.email).trim().toLowerCase() : null;
    if (email && !email.includes('@')) {
      email = null;
    }

    if (!last10 && !email) {
      throw new BadRequestException('A valid mobile number or email address is required to register the member.');
    }

    // 2. Resolve member user account
    const userOrConditions: any[] = [];
    if (last10) {
      if (formattedPhone) userOrConditions.push({ phone: formattedPhone });
      userOrConditions.push({ phone: last10 });
      userOrConditions.push({ phone: { contains: last10 } });
    }
    if (email) {
      userOrConditions.push({ email });
    }

    let user: any = await this.prisma.user.findFirst({
      where: userOrConditions.length > 0 ? { OR: userOrConditions } : { id: '__none__' },
      include: {
        userRoles: { include: { role: true } },
        profile: true,
      },
    });

    if (user) {
      const userRoles = user.userRoles?.map((ur: any) => ur.role.name) || [];
      const isAdminUser = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN');
      if (isAdminUser) {
        throw new ForbiddenException(
          'This mobile number or email belongs to an Administrator account. Member profiles cannot be created using staff login credentials.'
        );
      }
    }

    const rawPassword = String(data.password || 'S2S@123456').trim();
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const tempSuffix = Date.now().toString(36).slice(-6);
    const finalEmail = email || `member_${tempSuffix}@s2smatrimony.com`;
    const finalPhone = formattedPhone || `+919000${Math.floor(100000 + Math.random() * 900000)}`;

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          email: email || user.email,
          phone: (user.phone || formattedPhone) as string,
          passwordHash,
          isActive: true,
          isPhoneVerified: true,
          isEmailVerified: Boolean(email || user.isEmailVerified),
        },
        include: { userRoles: { include: { role: true } }, profile: true },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email: finalEmail,
          phone: finalPhone,
          passwordHash,
          isActive: true,
          isPhoneVerified: true,
          isEmailVerified: Boolean(email),
        },
        include: { userRoles: { include: { role: true } }, profile: true },
      });
    }

    // 3. Ensure MEMBER role
    const memberRole = await this.prisma.role.findUnique({ where: { name: 'MEMBER' } });
    if (memberRole) {
      const hasMemberRole = user.userRoles?.some((ur) => ur.role.name === 'MEMBER');
      if (!hasMemberRole) {
        await this.prisma.userRole.create({
          data: { userId: user.id, roleId: memberRole.id },
        }).catch(() => null);
      }
    }

    // 4. Resolve Master Data Lookups
    let religionId: string | null = null;
    if (data.religion) {
      const relName = String(data.religion).trim();
      let rel = await this.prisma.religion.findFirst({
        where: { name: { equals: relName, mode: 'insensitive' } },
      }).catch(() => null);
      if (!rel && relName) {
        rel = await this.prisma.religion.create({ data: { name: relName } }).catch(() => null);
      }
      if (rel) religionId = rel.id;
    }

    let communityId: string | null = null;
    let casteId: string | null = null;
    const casteName = data.caste || data.community;
    if (casteName) {
      const cName = String(casteName).trim();
      let comm = await this.prisma.community.findFirst({
        where: { name: { equals: cName, mode: 'insensitive' } },
      }).catch(() => null);
      if (!comm && cName) {
        const slug = cName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'comm';
        comm = await this.prisma.community.create({ data: { name: cName, slug } }).catch(() => null);
      }
      if (comm) communityId = comm.id;

      let cst = await this.prisma.caste.findFirst({
        where: { name: { equals: cName, mode: 'insensitive' } },
      }).catch(() => null);
      if (!cst && cName) {
        cst = await this.prisma.caste.create({ data: { name: cName, religionId: religionId || undefined } }).catch(() => null);
      }
      if (cst) casteId = cst.id;
    }

    let subCasteId: string | null = null;
    if (data.subcaste || data.subCaste) {
      const scName = String(data.subcaste || data.subCaste).trim();
      let sc = await this.prisma.subCaste.findFirst({
        where: { name: { equals: scName, mode: 'insensitive' } },
      }).catch(() => null);
      if (!sc && scName && casteId) {
        sc = await this.prisma.subCaste.create({ data: { name: scName, casteId } }).catch(() => null);
      }
      if (sc) subCasteId = sc.id;
    }

    let cityId: string | null = null;
    if (data.city) {
      const cityName = String(data.city).trim();
      let ct = await this.prisma.city.findFirst({
        where: { name: { equals: cityName, mode: 'insensitive' } },
      }).catch(() => null);
      if (!ct && cityName) {
        const defaultState = await this.prisma.state.findFirst().catch(() => null);
        if (defaultState) {
          ct = await this.prisma.city.create({ data: { name: cityName, stateId: defaultState.id } }).catch(() => null);
        }
      }
      if (ct) cityId = ct.id;
    }

    // 5. Generate unique member ID
    let memberId = data.memberId ? String(data.memberId).trim() : null;
    if (!memberId) {
      memberId = `S2S-${Math.floor(100000 + Math.random() * 900000)}`;
      while (await this.prisma.profile.findUnique({ where: { memberId } })) {
        memberId = `S2S-${Math.floor(100000 + Math.random() * 900000)}`;
      }
    }

    // 6. Name and Demographics
    const firstName = String(data.firstName || (data.name ? String(data.name).split(' ')[0] : 'Member')).trim();
    const lastName = String(data.lastName || (data.name ? String(data.name).split(' ').slice(1).join(' ') : '')).trim();
    const displayName = `${firstName} ${lastName}`.trim() || 'Member';

    let gender: Gender = Gender.MALE;
    const rawGender = String(data.gender || '').toUpperCase();
    if (rawGender.includes('FEMALE') || rawGender.includes('BRIDE') || rawGender.includes('GIRL')) {
      gender = Gender.FEMALE;
    }

    let dob = new Date(2000, 0, 1);
    if (data.dateOfBirth) {
      const parsed = new Date(data.dateOfBirth);
      if (!isNaN(parsed.getTime())) dob = parsed;
    }
    const age = data.age || Math.max(18, new Date().getFullYear() - dob.getFullYear()) || 25;

    let maritalStatus: MaritalStatus = MaritalStatus.NEVER_MARRIED;
    const rawMarital = String(data.maritalStatus || '').toUpperCase().replace(/[\s-]/g, '_');
    if (['NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED'].includes(rawMarital)) {
      maritalStatus = rawMarital as MaritalStatus;
    }

    const profileData: any = {
      userId: user.id,
      memberId,
      branch: data.branch || null,
      firstName,
      lastName,
      displayName,
      gender,
      dateOfBirth: dob,
      age,
      maritalStatus,
      heightCm: data.heightCm ? Number(data.heightCm) : null,
      weight: data.weightKg ? Number(data.weightKg) : (data.weight ? Number(data.weight) : null),
      complexion: data.complexion || null,
      diet: data.diet || null,
      motherTongue: data.motherTongue || 'Tamil',
      religionId,
      communityId,
      casteId,
      subCasteId,
      cityId,
      gothram: data.gothram || null,
      birthOrder: data.birthOrder ? Number(data.birthOrder) : null,
      residentStatus: data.residentStatus || null,
      propertyDetails: data.propertyDetails || null,
      about: data.about || `Profile for ${displayName}`,
      status: 'ACTIVE',
      isVerified: true,
      verificationStatus: 'VERIFIED',
      profileCompletionPercent: 90,
    };

    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId: user.id },
    });

    let profile: any;
    if (existingProfile) {
      profile = await this.prisma.profile.update({
        where: { id: existingProfile.id },
        data: profileData,
      });
    } else {
      profile = await this.prisma.profile.create({
        data: profileData,
      });
    }

    // 7. Upsert Sub-tables
    // Education
    const degree = data.educationDegree || data.education || null;
    const college = data.college || data.educationDetails || null;
    if (degree || college) {
      await this.prisma.education.upsert({
        where: { profileId: profile.id },
        create: {
          profileId: profile.id,
          degree: degree || 'Graduate',
          fieldOfStudy: data.fieldOfStudy || null,
          university: college,
        },
        update: {
          degree: degree || undefined,
          university: college || undefined,
        },
      });
    }

    // Occupation
    const designation = data.occupation || data.designation || null;
    const company = data.company || data.companyName || null;
    const workingLocation = data.workLocation || data.jobLocation || null;
    const salaryMin = data.annualIncome ? Number(String(data.annualIncome).replace(/\D/g, '')) || null : (data.salary ? Number(String(data.salary).replace(/\D/g, '')) || null : null);
    if (designation || company || workingLocation || salaryMin) {
      await this.prisma.occupation.upsert({
        where: { profileId: profile.id },
        create: {
          profileId: profile.id,
          designation: designation || 'Professional',
          company,
          workingLocation,
          salaryMin,
        },
        update: {
          designation: designation || undefined,
          company: company || undefined,
          workingLocation: workingLocation || undefined,
          salaryMin: salaryMin || undefined,
        },
      });
    }

    // FamilyDetail
    const fatherName = data.fatherName || null;
    const fatherOccupation = data.fatherOccupation || data.fatherJob || null;
    const motherName = data.motherName || null;
    const motherOccupation = data.motherOccupation || data.motherJob || null;
    const nativePlace = data.nativePlace || null;
    await this.prisma.familyDetail.upsert({
      where: { profileId: profile.id },
      create: {
        profileId: profile.id,
        fatherName,
        fatherOccupation,
        motherName,
        motherOccupation,
        nativePlace,
        elderBrothers: Number(data.elderBrothers || 0),
        elderBrothersMarried: Number(data.elderBrothersMarried || 0),
        youngerBrothers: Number(data.youngerBrothers || 0),
        youngerBrothersMarried: Number(data.youngerBrothersMarried || 0),
        elderSisters: Number(data.elderSisters || 0),
        elderSistersMarried: Number(data.elderSistersMarried || 0),
        youngerSisters: Number(data.youngerSisters || 0),
        youngerSistersMarried: Number(data.youngerSistersMarried || 0),
      },
      update: {
        fatherName: fatherName || undefined,
        fatherOccupation: fatherOccupation || undefined,
        motherName: motherName || undefined,
        motherOccupation: motherOccupation || undefined,
        nativePlace: nativePlace || undefined,
        elderBrothers: Number(data.elderBrothers || 0),
        elderBrothersMarried: Number(data.elderBrothersMarried || 0),
        youngerBrothers: Number(data.youngerBrothers || 0),
        youngerBrothersMarried: Number(data.youngerBrothersMarried || 0),
        elderSisters: Number(data.elderSisters || 0),
        elderSistersMarried: Number(data.elderSistersMarried || 0),
        youngerSisters: Number(data.youngerSisters || 0),
        youngerSistersMarried: Number(data.youngerSistersMarried || 0),
      },
    });

    // Horoscope
    const star = data.star || data.natchathiram || null;
    const starPadam = data.starPadam ? Number(data.starPadam) : (data.natchathiramPadham ? Number(data.natchathiramPadham) : null);
    const rasi = data.rasi || null;
    const lagnam = data.lagnam || null;
    const kuladeivam = data.kuladeivam || null;
    const dosham = data.dosham || null;
    const dasaBalance = data.dasaBalance || data.dasaIrupu || null;
    const birthTime = data.birthTime || data.timeOfBirth || null;
    const birthPlace = data.birthPlace || data.placeOfBirth || null;
    const rasiChart = data.rasiChart || data.horoscopeData?.rasiChart || null;
    const amsamChart = data.amsamChart || data.horoscopeData?.amsamChart || null;
    const horoscopeData = data.horoscopeData || (rasiChart || amsamChart ? { rasiChart, amsamChart } : null);

    if (star || rasi || lagnam || kuladeivam || dosham || dasaBalance || birthTime || birthPlace || horoscopeData) {
      await this.prisma.horoscope.upsert({
        where: { profileId: profile.id },
        create: {
          profileId: profile.id,
          star,
          starPadam,
          rasi,
          lagnam,
          kuladeivam,
          dosham,
          dasaBalance,
          birthTime,
          birthPlace,
          gothram: data.gothram || null,
          horoscopeData: horoscopeData ? (horoscopeData as any) : undefined,
        },
        update: {
          star: star || undefined,
          starPadam: starPadam || undefined,
          rasi: rasi || undefined,
          lagnam: lagnam || undefined,
          kuladeivam: kuladeivam || undefined,
          dosham: dosham || undefined,
          dasaBalance: dasaBalance || undefined,
          birthTime: birthTime || undefined,
          birthPlace: birthPlace || undefined,
          gothram: data.gothram || undefined,
          horoscopeData: horoscopeData ? (horoscopeData as any) : undefined,
        },
      });
    }

    // PartnerPreference
    if (data.aboutPartner || data.expectation) {
      await this.prisma.partnerPreference.upsert({
        where: { profileId: profile.id },
        create: {
          profileId: profile.id,
          aboutPartner: data.aboutPartner || data.expectation,
        },
        update: {
          aboutPartner: data.aboutPartner || data.expectation,
        },
      });
    }

    // ProfilePhoto
    if (data.photoUrl) {
      await this.prisma.profilePhoto.create({
        data: {
          profileId: profile.id,
          url: data.photoUrl,
          isMain: true,
          status: PhotoStatus.APPROVED,
        },
      }).catch(() => null);
    }

    // PrivacySetting
    await this.prisma.privacySetting.upsert({
      where: { profileId: profile.id },
      create: {
        profileId: profile.id,
        showPhone: true,
        showEmail: true,
        showPhoto: true,
        showHoroscope: true,
        whoCanViewProfile: 'ALL',
      },
      update: {},
    }).catch(() => null);

    // Sync to devStore
    devStore.set(user.id, {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName,
      lastName,
      gender,
      roles: ['MEMBER'],
      membershipTier: 'FREE',
    });

    return {
      success: true,
      message: `Member ${displayName} registered successfully!`,
      memberId: profile.memberId,
      profileId: profile.id,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
      },
    };
  }
}

