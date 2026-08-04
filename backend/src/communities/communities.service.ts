import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    const whereClause: any = {};
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
            orderBy: { name: 'asc' },
          },
          parent: true,
        },
        orderBy: { name: 'asc' },
      });
      if (dbCommunities && dbCommunities.length > 0) {
        return dbCommunities;
      }
    } catch {
      // Fallback data when DB is offline or empty
    }

    return [
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
  }


  async findOne(id: string) {
    return this.prisma.community.findUnique({
      where: { id },
    });
  }

  async create(data: { name: string; description?: string }) {
    const slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    return this.prisma.community.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
      },
    });
  }

  async update(id: string, data: { name?: string; description?: string; isActive?: boolean }) {
    const updateData: any = { ...data };
    if (data.name) {
      updateData.slug = data.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }
    return this.prisma.community.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.community.delete({
      where: { id },
    });
  }
}
