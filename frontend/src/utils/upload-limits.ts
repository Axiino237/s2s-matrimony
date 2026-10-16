import { useSettingsStore } from '../store/settings.store';

export interface UploadLimitsConfig {
  maxBiodataFileSizeMb: number;
  maxBiodataFilesCount: number;
  maxProfilePhotoSizeMb: number;
  maxProfilePhotosCount: number;
  maxHoroscopeFileSizeMb: number;
  maxHoroscopeFilesCount: number;
}

export const DEFAULT_UPLOAD_LIMITS: UploadLimitsConfig = {
  maxBiodataFileSizeMb: 10,
  maxBiodataFilesCount: 10,
  maxProfilePhotoSizeMb: 5,
  maxProfilePhotosCount: 5,
  maxHoroscopeFileSizeMb: 10,
  maxHoroscopeFilesCount: 2,
};

export const ALLOWED_UPLOAD_FORMATS = {
  biodata: {
    label: 'PDF, DOC, DOCX, JPEG, PNG',
    accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png',
    extensions: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
    mimes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ],
  },
  profilePhoto: {
    label: 'JPEG, PNG, WebP',
    accept: '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp',
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    mimes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  },
  horoscope: {
    label: 'PDF, DOC, DOCX, JPEG, PNG',
    accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png',
    extensions: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
    mimes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ],
  },
};

export function getEffectiveUploadLimits(customOverrides?: Partial<UploadLimitsConfig>): UploadLimitsConfig {
  try {
    const state = useSettingsStore.getState();
    const limits = customOverrides || state?.uploadLimits || (state as any);
    return {
      maxBiodataFileSizeMb: Number(limits?.maxBiodataFileSizeMb) || DEFAULT_UPLOAD_LIMITS.maxBiodataFileSizeMb,
      maxBiodataFilesCount: Number(limits?.maxBiodataFilesCount) || DEFAULT_UPLOAD_LIMITS.maxBiodataFilesCount,
      maxProfilePhotoSizeMb: Number(limits?.maxProfilePhotoSizeMb) || DEFAULT_UPLOAD_LIMITS.maxProfilePhotoSizeMb,
      maxProfilePhotosCount: Number(limits?.maxProfilePhotosCount) || DEFAULT_UPLOAD_LIMITS.maxProfilePhotosCount,
      maxHoroscopeFileSizeMb: Number(limits?.maxHoroscopeFileSizeMb) || DEFAULT_UPLOAD_LIMITS.maxHoroscopeFileSizeMb,
      maxHoroscopeFilesCount: Number(limits?.maxHoroscopeFilesCount) || DEFAULT_UPLOAD_LIMITS.maxHoroscopeFilesCount,
    };
  } catch {
    return {
      ...DEFAULT_UPLOAD_LIMITS,
      ...(customOverrides || {}),
    };
  }
}

export interface ValidationResult {
  validFiles: File[];
  rejectedFiles: { file: File; reason: string }[];
  maxCountReached: boolean;
  maxFiles: number;
  maxSizeMb: number;
}

export type UploadCategory = 'biodata' | 'profilePhoto' | 'photo' | 'horoscope';

/**
 * Validates a batch of files individually against size, format, and cumulative count limits.
 * Supports flexible argument ordering: (files, category, retainedCount, limits) or (files, retainedCount, category, limits).
 * Rejects invalid files individually while allowing valid files to proceed.
 */
export function validateFileBatch(
  incomingFiles: File[],
  arg2: UploadCategory | number,
  arg3: UploadCategory | number,
  customLimits?: Partial<UploadLimitsConfig>,
): ValidationResult {
  let category: 'biodata' | 'profilePhoto' | 'horoscope';
  let currentRetainedCount: number;

  if (typeof arg2 === 'number') {
    currentRetainedCount = arg2;
    category = arg3 === 'photo' ? 'profilePhoto' : (arg3 as any);
  } else {
    category = arg2 === 'photo' ? 'profilePhoto' : (arg2 as any);
    currentRetainedCount = typeof arg3 === 'number' ? arg3 : 0;
  }

  const limits = { ...getEffectiveUploadLimits(), ...(customLimits || {}) };
  const rules = ALLOWED_UPLOAD_FORMATS[category] || ALLOWED_UPLOAD_FORMATS.biodata;

  let maxSizeMb = 10;
  let maxFiles = 10;

  if (category === 'biodata') {
    maxSizeMb = limits.maxBiodataFileSizeMb;
    maxFiles = limits.maxBiodataFilesCount;
  } else if (category === 'profilePhoto') {
    maxSizeMb = limits.maxProfilePhotoSizeMb;
    maxFiles = limits.maxProfilePhotosCount;
  } else if (category === 'horoscope') {
    maxSizeMb = limits.maxHoroscopeFileSizeMb;
    maxFiles = limits.maxHoroscopeFilesCount;
  }

  const maxSizeBytes = maxSizeMb * 1024 * 1024;
  const validFiles: File[] = [];
  const rejectedFiles: { file: File; reason: string }[] = [];

  let availableSlots = Math.max(0, maxFiles - currentRetainedCount);
  let maxCountReached = availableSlots <= 0;

  for (const file of incomingFiles) {
    const nameLower = file.name.toLowerCase();
    const fileExt = '.' + nameLower.split('.').pop();
    const isExtensionAllowed = rules.extensions.some((ext) => nameLower.endsWith(ext));
    const isMimeAllowed = rules.mimes.some((m) => file.type && file.type.toLowerCase().includes(m.toLowerCase()));

    // 1. Check file type
    if (!isExtensionAllowed && !isMimeAllowed) {
      rejectedFiles.push({
        file,
        reason: `Unsupported format (${fileExt || file.type || 'unknown'}). Allowed: ${rules.label}`,
      });
      continue;
    }

    // 2. Check file size
    if (file.size > maxSizeBytes) {
      const fileMb = (file.size / (1024 * 1024)).toFixed(1);
      rejectedFiles.push({
        file,
        reason: `File size (${fileMb} MB) exceeds maximum allowed limit of ${maxSizeMb} MB.`,
      });
      continue;
    }

    // 3. Check cumulative count
    if (availableSlots <= 0) {
      maxCountReached = true;
      rejectedFiles.push({
        file,
        reason: `Maximum limit of ${maxFiles} file${maxFiles > 1 ? 's' : ''} reached for this field.`,
      });
      continue;
    }

    validFiles.push(file);
    availableSlots--;
  }

  return {
    validFiles,
    rejectedFiles,
    maxCountReached,
    maxFiles,
    maxSizeMb,
  };
}

export interface ParsedHoroscopeFileItem {
  id?: string;
  url: string;
  name?: string;
  size?: number;
  type?: string;
  isImage?: boolean;
  isPdf?: boolean;
  isDoc?: boolean;
}

/**
 * Parses horoscopeFile from DB or state into an array of items (up to 2).
 */
export function parseHoroscopeFiles(raw: any): ParsedHoroscopeFileItem[] {
  if (!raw) return [];
  let urls: string[] = [];

  if (Array.isArray(raw)) {
    urls = raw
      .map((item) => (typeof item === 'string' ? item.trim() : item?.url || item?.preview || ''))
      .filter(Boolean);
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed) {
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            urls = parsed
              .map((item) => (typeof item === 'string' ? item.trim() : item?.url || item?.preview || ''))
              .filter(Boolean);
          }
        } catch {
          urls = [trimmed];
        }
      } else {
        urls = [trimmed];
      }
    }
  }

  return urls.slice(0, 2).map((url, idx) => {
    const isImage =
      url.startsWith('data:image/') ||
      /\.(jpe?g|png|webp)$/i.test(url) ||
      (!url.startsWith('data:') && !/\.(pdf|docx?)$/i.test(url));
    const isPdf = url.startsWith('data:application/pdf') || /\.pdf$/i.test(url);
    const isDoc =
      url.startsWith('data:application/msword') ||
      url.startsWith('data:application/vnd.openxmlformats') ||
      /\.docx?$/i.test(url);

    return {
      id: `horo-file-${idx + 1}`,
      url,
      name: `Horoscope File ${idx + 1}${isPdf ? ' (PDF)' : isDoc ? ' (Word)' : ' (Chart)'}`,
      isImage,
      isPdf,
      isDoc,
    };
  });
}

/**
 * Serializes horoscope files for API/DB storage.
 */
export function serializeHoroscopeFiles(items: (string | { url: string })[]): string | null {
  if (!items || items.length === 0) return null;
  const urls = items
    .map((item) => (typeof item === 'string' ? item.trim() : item?.url?.trim() || ''))
    .filter(Boolean);

  if (urls.length === 0) return null;
  if (urls.length === 1) return urls[0];
  return JSON.stringify(urls.slice(0, 2));
}
