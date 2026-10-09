import { devStore } from './dev-store';
import { PrismaService } from '../prisma/prisma.service';

let cachedStatus: { active: boolean; checkedAt: number } | null = null;
const CACHE_TTL_MS = 1000;

export async function checkIsMaintenanceModeActive(prisma?: PrismaService): Promise<boolean> {
  // 1. In-memory devStore check (updated in real-time when admin saves settings)
  const devSettings = (devStore as any).systemSettings;
  if (devSettings && devSettings.maintenanceMode !== undefined) {
    return Boolean(devSettings.maintenanceMode === true || devSettings.maintenanceMode === 'true');
  }

  // 2. Short-lived memory cache check
  const now = Date.now();
  if (cachedStatus && now - cachedStatus.checkedAt < CACHE_TTL_MS) {
    return cachedStatus.active;
  }

  // 3. Database lookup
  if (prisma) {
    try {
      const record = await prisma.setting.findUnique({ where: { key: 'system_settings' } });
      if (record?.value) {
        const parsed = JSON.parse(record.value);
        const active = Boolean(parsed.maintenanceMode === true || parsed.maintenanceMode === 'true');
        cachedStatus = { active, checkedAt: now };
        return active;
      }
    } catch {}
  }

  return false;
}

export function syncMaintenanceModeState(active: boolean) {
  cachedStatus = { active, checkedAt: Date.now() };
  if (!(devStore as any).systemSettings) {
    (devStore as any).systemSettings = {};
  }
  (devStore as any).systemSettings.maintenanceMode = active;
}
