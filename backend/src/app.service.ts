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

    const uploadLimits = {
      maxBiodataFileSizeMb: Number(merged.maxBiodataFileSizeMb) || 10,
      maxBiodataFilesCount: Number(merged.maxBiodataFilesCount) || 10,
      maxProfilePhotoSizeMb: Number(merged.maxProfilePhotoSizeMb) || 5,
      maxProfilePhotosCount: Number(merged.maxProfilePhotosCount) || 5,
      maxHoroscopeFileSizeMb: Number(merged.maxHoroscopeFileSizeMb) || 10,
      maxHoroscopeFilesCount: Number(merged.maxHoroscopeFilesCount) || 2,
    };

    return {
      facebookUrl: 'https://www.facebook.com/s2smatrimony',
      instagramUrl: 'https://www.instagram.com/s2smatrimony',
      twitterUrl: 'https://x.com/s2smatrimony',
      youtubeUrl: 'https://www.youtube.com/@s2smatrimony',
      ...uploadLimits,
      uploadLimits,
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

