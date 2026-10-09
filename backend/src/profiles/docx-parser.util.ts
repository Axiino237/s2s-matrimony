import * as zlib from 'zlib';

export interface ExtractedDocxContent {
  text: string;
  images: Array<{
    name: string;
    mimeType: string;
    base64: string;
    buffer: Buffer;
  }>;
}

/**
 * Checks if a buffer begins with standard PK zip signature (0x04034b50).
 */
export function isZipOrDocxSignature(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 30) return false;
  return (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  );
}

/**
 * Parses a DOCX buffer by inspecting the central directory and decompressing
 * word/document.xml (for text content) and word/media/* (for embedded images/charts).
 * Uses standard Node.js zlib without external binary or npm dependencies.
 */
export function parseDocxBuffer(buffer: Buffer): ExtractedDocxContent {
  if (!isZipOrDocxSignature(buffer)) {
    throw new Error('Invalid DOCX file signature: missing ZIP local header (PK\\x03\\x04)');
  }

  // Find End of Central Directory (EOCD) record
  let eocdOffset = -1;
  const minOffset = Math.max(0, buffer.length - 65557);
  for (let i = buffer.length - 22; i >= minOffset; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error('Corrupted DOCX archive: End of Central Directory record not found');
  }

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);

  let curCd = cdOffset;
  let docXml = '';
  const mediaImages: ExtractedDocxContent['images'] = [];

  for (let i = 0; i < totalEntries; i++) {
    if (curCd + 46 > buffer.length || buffer.readUInt32LE(curCd) !== 0x02014b50) {
      break;
    }

    const method = buffer.readUInt16LE(curCd + 10);
    const compressedSize = buffer.readUInt32LE(curCd + 20);
    const fileNameLen = buffer.readUInt16LE(curCd + 28);
    const extraLen = buffer.readUInt16LE(curCd + 30);
    const commentLen = buffer.readUInt16LE(curCd + 32);
    const localHeaderOffset = buffer.readUInt32LE(curCd + 42);

    const fileName = buffer.toString('utf-8', curCd + 46, curCd + 46 + fileNameLen);

    if (localHeaderOffset + 30 <= buffer.length) {
      const localFileNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localFileNameLen + localExtraLen;

      if (dataStart + compressedSize <= buffer.length) {
        const rawData = buffer.subarray(dataStart, dataStart + compressedSize);

        let decompressed: Buffer | null = null;
        try {
          if (method === 8) {
            decompressed = zlib.inflateRawSync(rawData);
          } else if (method === 0) {
            decompressed = Buffer.from(rawData);
          }
        } catch {
          decompressed = null;
        }

        if (decompressed) {
          if (fileName === 'word/document.xml') {
            docXml = decompressed.toString('utf-8');
          } else if (fileName.startsWith('word/media/')) {
            const lower = fileName.toLowerCase();
            let mimeType = 'image/jpeg';
            if (lower.endsWith('.png')) mimeType = 'image/png';
            else if (lower.endsWith('.webp')) mimeType = 'image/webp';
            else if (lower.endsWith('.gif')) mimeType = 'image/gif';

            mediaImages.push({
              name: fileName,
              mimeType,
              base64: decompressed.toString('base64'),
              buffer: decompressed,
            });
          }
        }
      }
    }

    curCd += 46 + fileNameLen + extraLen + commentLen;
  }

  if (!docXml) {
    throw new Error('Invalid DOCX format: word/document.xml not found inside package');
  }

  // Extract structured text from WordprocessingML
  const clean = docXml
    .replace(/<w:p\b[^>]*>/gi, '\n')
    .replace(/<w:tr\b[^>]*>/gi, '\n')
    .replace(/<w:tc\b[^>]*>/gi, ' ')
    .replace(/<w:br\b[^>]*\/>/gi, '\n')
    .replace(/<w:tab\b[^>]*\/>/gi, '\t');

  const paragraphs = clean
    .split('\n')
    .map((p) => {
      const matches = p.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi) || [];
      return matches
        .map((m) => m.replace(/<\/?w:t\b[^>]*>/gi, ''))
        .join('')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .trim();
    })
    .filter(Boolean);

  const text = paragraphs.join('\n');

  return { text, images: mediaImages };
}
