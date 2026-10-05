import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) { }

  getHello(): string {
    return 'Hello World!';
  }

  async getPublicSettings() {
    try {
      const record = await this.prisma.setting.findUnique({ where: { key: 'system_settings' } });
      if (record && record.value) {
        return JSON.parse(record.value);
      }
    } catch { }
    return {
      facebookUrl: 'https://www.facebook.com/s2smatrimony',
      instagramUrl: 'https://www.instagram.com/s2smatrimony',
      twitterUrl: 'https://x.com/s2smatrimony',
      youtubeUrl: 'https://www.youtube.com/@s2smatrimony',
    };
  }

  async getPublicStaticPages() {
    try {
      const record = await this.prisma.setting.findUnique({ where: { key: 'static_pages' } });
      if (record && record.value) {
        return JSON.parse(record.value);
      }
    } catch {}
    return null;
  }
}

