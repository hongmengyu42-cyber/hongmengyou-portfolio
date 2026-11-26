export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // the backend limit for what is actually sent
export const MAX_SOURCE_BYTES = 30 * 1024 * 1024; // images may start larger: they are resized in the browser first

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot < 0 ? '' : name.slice(dot + 1).toLowerCase();
}

/** Early, friendly checks. The server repeats them (and inspects the real file bytes), so this is UX, not security. */
export function validateImageFile(file: File): string | null {
  if (!IMAGE_EXTENSIONS.includes(extensionOf(file.name)) || !IMAGE_TYPES.includes(file.type)) {
    return 'Choose a JPG, PNG or WebP image.';
  }
  if (file.size === 0) return 'That file is empty.';
  if (file.size > MAX_SOURCE_BYTES) return 'Choose an image under 30 MB.';
  return null;
}

export function validatePdfFile(file: File): string | null {
  if (extensionOf(file.name) !== 'pdf' || file.type !== 'application/pdf') return 'Choose a PDF file.';
  return sizeProblem(file);
}

function sizeProblem(file: File): string | null {
  if (file.size === 0) return 'That file is empty.';
  if (file.size > MAX_UPLOAD_BYTES) return 'The file is larger than 5 MB.';
  return null;
}
