import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  private cleanSlug(text: string): string {
    return (
      text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || 'community'
    );
  }

  private async generateUniqueSlug(baseText: string, currentId?: string): Promise<string> {
    const raw = this.cleanSlug(baseText);
    let candidate = raw;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.community.findFirst({
        where: {
          slug: candidate,
          ...(currentId ? { id: { not: currentId } } : {}),
        },
      });
      if (!existing) {
        return candidate;
      }
      candidate = `${raw}-${counter}`;
      counter++;
    }
  }

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
      include: {
        children: { orderBy: { name: 'asc' } },
        parent: true,
      },
    });
  }

  async create(data: { name: string; description?: string; parentId?: string | null }) {
    const trimmedName = data.name?.trim();
    if (!trimmedName) {
      throw new BadRequestException('Community or Sub-Community name is required.');
    }

    const parentId = data.parentId && data.parentId.trim() ? data.parentId.trim() : null;
    let parent: any = null;
    if (parentId) {
      parent = await this.prisma.community.findUnique({ where: { id: parentId } });
      if (!parent) {
        throw new BadRequestException('Selected parent community not found.');
      }
    }

    // Check if name already exists globally
    let finalName = trimmedName;
    const existingName = await this.prisma.community.findFirst({
      where: { name: { equals: trimmedName, mode: 'insensitive' } },
    });

    if (existingName) {
      if (parent) {
        // Disambiguate sub-community name with parent tag
        const parentTag = parent.name.replace(/\s*Matrimony\s*$/i, '').trim();
        finalName = `${trimmedName} (${parentTag})`;
        const secondCheck = await this.prisma.community.findFirst({
          where: { name: { equals: finalName, mode: 'insensitive' } },
        });
        if (secondCheck) {
          finalName = `${trimmedName} (${parentTag} - ${Date.now().toString(36).slice(-3)})`;
        }
      } else {
        throw new BadRequestException(`A community named "${trimmedName}" already exists.`);
      }
    }

    // Generate unique slug
    const baseSlugSource = parent ? `${parent.slug}-${finalName}` : finalName;
    const uniqueSlug = await this.generateUniqueSlug(baseSlugSource);

    const created = await this.prisma.community.create({
      data: {
        name: finalName,
        slug: uniqueSlug,
        description: data.description?.trim() || null,
        parentId: parent ? parent.id : null,
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
        newValue: {
          name: created.name,
          slug: created.slug,
          parentId: created.parentId,
          description: created.description,
        },
      },
    }).catch(() => null);

    return created;
  }

  async update(id: string, data: { name?: string; description?: string; isActive?: boolean; parentId?: string | null }) {
    const existing = await this.prisma.community.findUnique({
      where: { id },
      include: { parent: true },
    });
    if (!existing) {
      throw new NotFoundException('Community not found');
    }

    const updateData: any = {};

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
    }

    if (data.parentId !== undefined) {
      const newParentId = data.parentId && data.parentId.trim() ? data.parentId.trim() : null;
      if (newParentId === id) {
        throw new BadRequestException('A community cannot be its own parent.');
      }
      if (newParentId) {
        const parentCheck = await this.prisma.community.findUnique({ where: { id: newParentId } });
        if (!parentCheck) {
          throw new BadRequestException('Parent community not found.');
        }
      }
      updateData.parentId = newParentId;
    }

    if (data.name && data.name.trim() && data.name.trim() !== existing.name) {
      const trimmed = data.name.trim();
      const nameConflict = await this.prisma.community.findFirst({
        where: {
          name: { equals: trimmed, mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (nameConflict) {
        throw new BadRequestException(`Another community with the name "${trimmed}" already exists.`);
      }
      updateData.name = trimmed;
      const effectiveParentId = updateData.parentId !== undefined ? updateData.parentId : existing.parentId;
      const baseSlugSource = effectiveParentId
        ? `${existing.parent?.slug || 'sub'}-${trimmed}`
        : trimmed;
      updateData.slug = await this.generateUniqueSlug(baseSlugSource, id);
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
        oldValue: { name: existing.name, isActive: existing.isActive, parentId: existing.parentId },
        newValue: { name: updated.name, isActive: updated.isActive, parentId: updated.parentId },
      },
    }).catch(() => null);

    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.community.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Community not found');
    }

    // Cascade delete any child sub-communities
    await this.prisma.community.deleteMany({
      where: { parentId: id },
    });

    const deleted = await this.prisma.community.delete({
      where: { id },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'COMMUNITY_DELETED',
        entity: 'Community',
        entityId: id,
        oldValue: { name: existing.name, slug: existing.slug, parentId: existing.parentId },
      },
    }).catch(() => null);

    return deleted;
  }
}
