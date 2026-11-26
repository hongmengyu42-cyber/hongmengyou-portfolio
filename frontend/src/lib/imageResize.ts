/**
 * Resizes and re-encodes a photo in the browser before upload. Why:
 *  - phone photos are often 5-12 MB, over the server's 5 MB limit, yet a 1000-2000 px image is all a website needs
 *  - smaller images make the page faster
 *  - drawing to a canvas drops EXIF metadata, including GPS location, so it is never published by accident
 * It never throws: if the browser cannot do it, the original file is returned and the normal size check decides.
 */

export interface PrepareOptions {
  /** Longest side in pixels. Images already smaller are never enlarged. */
  maxDimension: number;
  /** 'jpeg' for photos; 'auto' keeps screenshots sharp (WebP where the browser can encode it, otherwise the original format). */
  output: 'jpeg' | 'auto';
  quality?: number;
}

const SKIP_BELOW_BYTES = 1.5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = { 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/png': '.png' };

export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

let webpEncodable: boolean | null = null;
function canEncodeWebp(): boolean {
  if (webpEncodable === null) {
    try {
      webpEncodable = document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp');
    } catch {
      webpEncodable = false;
    }
  }
  return webpEncodable;
}

function chooseType(source: string, output: PrepareOptions['output']): string {
  if (output === 'jpeg') return 'image/jpeg';
  if (canEncodeWebp()) return 'image/webp';
  return source === 'image/jpeg' ? 'image/jpeg' : 'image/png';
}

export async function prepareImage(file: File, options: PrepareOptions): Promise<File> {
  if (typeof createImageBitmap !== 'function') return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); // respects the camera's rotation flag
  } catch {
    return file; // undecodable here: let the server give the definitive answer
  }

  try {
    const target = fitWithin(bitmap.width, bitmap.height, options.maxDimension);
    const resized = target.width < bitmap.width;
    const isJpeg = file.type === 'image/jpeg';
    // Small PNG/WebP files are left byte-for-byte alone. JPEGs are always re-encoded to strip camera metadata.
    if (!resized && !isJpeg && file.size <= SKIP_BELOW_BYTES) return file;

    const type = chooseType(file.type, options.output);
    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;
    const context = canvas.getContext('2d');
    if (!context) return file;
    if (type === 'image/jpeg') {
      context.fillStyle = '#ffffff'; // JPEG has no transparency; avoid black where a PNG was see-through
      context.fillRect(0, 0, target.width, target.height);
    }
    context.drawImage(bitmap, 0, 0, target.width, target.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, options.quality ?? 0.86));
    if (!blob || blob.type !== type) return file; // the browser could not encode that format

    const base = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${base}${EXTENSIONS[type] ?? ''}`, { type, lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    bitmap.close?.();
  }
}

/** Presets used by the admin screens. */
export const PHOTO_OPTIONS: PrepareOptions = { maxDimension: 1400, output: 'jpeg', quality: 0.88 };
export const SCREENSHOT_OPTIONS: PrepareOptions = { maxDimension: 2000, output: 'auto', quality: 0.86 };
