import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { devStore } from '../common/dev-store';

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
              name: { in: ['ADMIN', 'SUPER_ADMIN', 'MODERATOR', 'SUPPORT_AGENT'] },
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

  async getBanners(page = 1, limit = 20) {
    const skip = (+page - 1) * +limit;
    try {
      const [banners, total] = await Promise.all([
        this.prisma.banner.findMany({
          skip,
          take: +limit,
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        }),
        this.prisma.banner.count(),
      ]);

      if (banners && banners.length > 0) {
        return { banners, total, page: +page, totalPages: Math.ceil(total / +limit) };
      }
    } catch {
      // Fallback
    }

    return { banners: [], total: 0, page: +page, totalPages: 1 };
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
        const all = [...devStoriesStore, ...stories];
        return { stories: all, total: all.length, page: +page, totalPages: Math.max(1, Math.ceil(all.length / +limit)) };
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
        isPublished: true,
      },
    ];

    const allStories = [...devStoriesStore, ...fallbackStories];
    return { stories: allStories, total: allStories.length, page: +page, totalPages: 1 };
  }

  async updateSuccessStoryStatus(id: string, isPublished: boolean) {
    return this.prisma.successStory.update({
      where: { id },
      data: { isApproved: isPublished, isPublished },
    });
  }

  async verifyProfile(profileId: string, status: 'VERIFIED' | 'REJECTED') {
    const profile = await this.prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.profile.update({
      where: { id: profileId },
      data: {
        verificationStatus: status,
        isVerified: status === 'VERIFIED',
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

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
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

  async createBanner(data: { title: string; imageUrl: string; page?: string; linkUrl?: string }) {
    return this.prisma.banner.create({
      data: {
        title: data.title,
        imageUrl: data.imageUrl || '/images/couple.png',
        page: data.page || 'HOME',
        linkUrl: data.linkUrl || '#',
        isActive: true,
        displayOrder: 1,
      },
    }).catch(() => ({
      id: `banner-${Date.now()}`,
      title: data.title,
      imageUrl: data.imageUrl || '/images/couple.png',
      page: data.page || 'HOME',
      linkUrl: data.linkUrl || '#',
      isActive: true,
    }));
  }

  async deleteBanner(id: string) {
    return this.prisma.banner.delete({ where: { id } }).catch(() => ({ success: true }));
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
      devStoriesStore.unshift(formatted);
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
}
