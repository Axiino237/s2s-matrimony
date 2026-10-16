import { BadRequestException } from '@nestjs/common';

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

export const ALLOWED_FORMATS = {
  biodata: {
    extensions: ['.pdf', '.docx', '.jpg', '.jpeg', '.png'],
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
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    mimes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  },
  horoscope: {
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

/**
 * Extracts and calculates byte size of file from base64 string or data URL
 */
export function getBase64ByteSize(base64OrDataUrl: string): number {
  if (!base64OrDataUrl || typeof base64OrDataUrl !== 'string') return 0;
  let raw = base64OrDataUrl.trim();
  if (raw.includes(';base64,')) {
    raw = raw.split(';base64,')[1];
  } else if (raw.startsWith('data:')) {
    const commaIdx = raw.indexOf(',');
    if (commaIdx !== -1) raw = raw.slice(commaIdx + 1);
  }
  // Base64 string length to bytes approximation
  const padding = (raw.endsWith('==') ? 2 : raw.endsWith('=') ? 1 : 0);
  return Math.max(0, Math.floor((raw.length * 3) / 4) - padding);
}

/**
 * Detects MIME type from data URL or header magic bytes
 */
export function detectMimeType(base64OrDataUrl: string, fileName?: string): string {
  if (!base64OrDataUrl) return '';
  const trimmed = base64OrDataUrl.trim();
  if (trimmed.startsWith('data:')) {
    const match = trimmed.match(/^data:([^;]+);/);
    if (match) return match[1].toLowerCase();
  }

  // Check magic bytes
  let rawBase64 = trimmed;
  if (trimmed.includes(';base64,')) {
    rawBase64 = trimmed.split(';base64,')[1];
  } else if (trimmed.startsWith('data:')) {
    const idx = trimmed.indexOf(',');
    if (idx !== -1) rawBase64 = trimmed.slice(idx + 1);
  }

  try {
    const header = Buffer.from(rawBase64.slice(0, 48), 'base64');
    if (header.length >= 4 && header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
      return 'application/pdf';
    }
    if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
      return 'image/jpeg';
    }
    if (header.length >= 8 && header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) {
      return 'image/png';
    }
    if (header.length >= 4 && header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
  } catch {}

  if (fileName) {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (lower.endsWith('.doc')) return 'application/msword';
  }

  return 'application/octet-stream';
}

/**
 * Parses horoscopeFile database string into an array of file URLs / data strings
 */
export function parseHoroscopeFiles(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === 'string' ? item.trim() : item?.url || item?.preview || ''))
      .filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => (typeof item === 'string' ? item.trim() : item?.url || item?.preview || ''))
            .filter(Boolean);
        }
      } catch {}
    }
    return [trimmed];
  }
  return [];
}

/**
 * Serializes horoscope file list into string for DB storage.
 * If 1 file, saves as single string for backward compatibility.
 * If multiple files, saves as JSON array string.
 */
export function serializeHoroscopeFiles(files: string[]): string | null {
  if (!files || files.length === 0) return null;
  const cleaned = files.map((f) => (typeof f === 'string' ? f.trim() : '')).filter(Boolean);
  if (cleaned.length === 0) return null;
  if (cleaned.length === 1) return cleaned[0];
  return JSON.stringify(cleaned);
}

/**
 * Validates file size and format against configured limits
 */
export function validateUploadItem(
  fileDataUrlOrBuffer: string | Buffer,
  category: 'biodata' | 'profilePhoto' | 'horoscope',
  fileName?: string,
  limits?: Partial<UploadLimitsConfig>,
): { sizeBytes: number; mimeType: string } {
  const effectiveLimits = { ...DEFAULT_UPLOAD_LIMITS, ...(limits || {}) };
  let sizeBytes = 0;
  let mimeType = '';

  if (Buffer.isBuffer(fileDataUrlOrBuffer)) {
    sizeBytes = fileDataUrlOrBuffer.length;
    mimeType = detectMimeType(fileDataUrlOrBuffer.toString('base64', 0, 100), fileName);
  } else if (typeof fileDataUrlOrBuffer === 'string') {
    sizeBytes = getBase64ByteSize(fileDataUrlOrBuffer);
    mimeType = detectMimeType(fileDataUrlOrBuffer, fileName);
  }

  let maxSizeMb = 10;
  let allowedRules = ALLOWED_FORMATS[category];

  if (category === 'biodata') {
    maxSizeMb = effectiveLimits.maxBiodataFileSizeMb;
  } else if (category === 'profilePhoto') {
    maxSizeMb = effectiveLimits.maxProfilePhotoSizeMb;
  } else if (category === 'horoscope') {
    maxSizeMb = effectiveLimits.maxHoroscopeFileSizeMb;
  }

  const maxSizeBytes = maxSizeMb * 1024 * 1024;
  if (sizeBytes > maxSizeBytes) {
    const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
    throw new BadRequestException(
      `File size (${sizeMb} MB) exceeds maximum allowed limit of ${maxSizeMb} MB${fileName ? ` for "${fileName}"` : ''}.`,
    );
  }

  const hasAllowedMime = allowedRules.mimes.some((m) => mimeType.toLowerCase().includes(m.toLowerCase()));
  const hasAllowedExt = fileName
    ? allowedRules.extensions.some((ext) => fileName.toLowerCase().endsWith(ext))
    : false;

  // If MIME is octet-stream, check extension as fallback
  if (!hasAllowedMime && !hasAllowedExt && (mimeType !== 'application/octet-stream' || !hasAllowedExt)) {
    throw new BadRequestException(
      `Unsupported file format (${mimeType || 'unknown'}). Allowed formats: ${allowedRules.extensions.join(', ')}${
        fileName ? ` for "${fileName}"` : ''
      }.`,
    );
  }

  return { sizeBytes, mimeType };
}
