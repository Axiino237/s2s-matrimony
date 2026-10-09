import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string, includeInactive: boolean = false) {
    const whereClause: any = {};
    if (!includeInactive) {
      whereClause.isActive = true;
    }
    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }
    try {
      const dbCommunities = await this.prisma.community.findMany({
        where: whereClause,
        include: {
          children: {
            where: includeInactive ? {} : { isActive: true },
            orderBy: { name: 'asc' },
          },
          parent: true,
        },
        orderBy: { name: 'asc' },
      });
      if (dbCommunities && dbCommunities.length > 0) {
        if (!includeInactive) {
          return dbCommunities.filter((c) => c.isActive && (!c.parent || c.parent.isActive));
        }
        return dbCommunities;
      }
    } catch {
      // Fallback data when DB is offline or empty
    }

    const fallbackList = [
      { id: 'comm-01', name: 'Kongu Vellalar', slug: 'kongu-vellalar', description: 'Kongu Vellalar Community', memberCount: 0, isActive: true, children: [] },
      { id: 'comm-02', name: 'Chettiar', slug: 'chettiar', description: 'Nagarathar & Chettiar Community', memberCount: 0, isActive: true, children: [] },
      { id: 'comm-03', name: 'Iyer', slug: 'iyer', description: 'Brahmin Iyer Community', memberCount: 0, isActive: true, children: [] },
      { id: 'comm-04', name: 'Iyengar', slug: 'iyengar', description: 'Brahmin Iyengar Community', memberCount: 0, isActive: true, children: [] },
      { id: 'comm-05', name: 'Nadar', slug: 'nadar', description: 'Nadar Community', memberCount: 0, isActive: true, children: [] },
      { id: 'comm-06', name: 'Mudaliar', slug: 'mudaliar', description: 'Mudaliar Community', memberCount: 0, isActive: true, children: [] },
      { id: 'comm-07', name: 'Pillai', slug: 'pillai', description: 'Saiva Pillai & Vellalar Community', memberCount: 0, isActive: true, children: [] },
      { id: 'comm-08', name: 'Vaniyar', slug: 'vaniyar', description: 'Vaniyar Chettiar Community', memberCount: 0, isActive: true, children: [] },
      { id: 'comm-09', name: 'Viswakarma', slug: 'viswakarma', description: 'Viswakarma Community', memberCount: 0, isActive: true, children: [] },
      { id: 'comm-10', name: 'Naidu', slug: 'naidu', description: 'Kamma & Balija Naidu Community', memberCount: 0, isActive: true, children: [] },
    ];
    return includeInactive ? fallbackList : fallbackList.filter((c) => c.isActive);
  }


  async findOne(id: string) {
    return this.prisma.community.findUnique({
      where: { id },
    });
  }

  async create(data: { name: string; description?: string; parentId?: string | null }) {
    const slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    const created = await this.prisma.community.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        ...(data.parentId ? { parentId: data.parentId } : {}),
      },
      include: {
        children: { orderBy: { name: 'asc' } },
        parent: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'COMMUNITY_CREATED',
        entity: 'Community',
        entityId: created.id,
        newValue: { name: data.name, slug, description: data.description },
      },
    }).catch(() => null);

    return created;
  }

  async update(id: string, data: { name?: string; description?: string; isActive?: boolean; parentId?: string | null }) {
    const existing = await this.prisma.community.findUnique({ where: { id } }).catch(() => null);
    const updateData: any = { ...data };
    if (data.name) {
      updateData.slug = data.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }
    const updated = await this.prisma.community.update({
      where: { id },
      data: updateData,
      include: {
        children: { orderBy: { name: 'asc' } },
        parent: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'COMMUNITY_UPDATED',
        entity: 'Community',
        entityId: id,
        oldValue: existing ? { name: existing.name, isActive: existing.isActive } : undefined,
        newValue: { name: updated.name, isActive: updated.isActive },
      },
    }).catch(() => null);

    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.community.findUnique({ where: { id } }).catch(() => null);
    const deleted = await this.prisma.community.delete({
      where: { id },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'COMMUNITY_DELETED',
        entity: 'Community',
        entityId: id,
        oldValue: existing ? { name: existing.name, slug: existing.slug } : undefined,
      },
    }).catch(() => null);

    return deleted;
  }
}
