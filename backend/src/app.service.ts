import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { devStore } from './common/dev-store';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) { }

  getHello(): string {
    return 'Hello World!';
  }

  async getPublicSettings() {
    let settings: any = {};
    try {
      const record = await this.prisma.setting.findUnique({ where: { key: 'system_settings' } });
      if (record && record.value) {
        settings = JSON.parse(record.value);
      }
    } catch { }

    const devSettings = (devStore as any).systemSettings || {};
    const merged = { ...settings, ...devSettings };
    const isMaintenance = Boolean(merged.maintenanceMode === true || merged.maintenanceMode === 'true');

    return {
      facebookUrl: 'https://www.facebook.com/s2smatrimony',
      instagramUrl: 'https://www.instagram.com/s2smatrimony',
      twitterUrl: 'https://x.com/s2smatrimony',
      youtubeUrl: 'https://www.youtube.com/@s2smatrimony',
      ...merged,
      maintenanceMode: isMaintenance,
      isMaintenanceMode: isMaintenance,
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

