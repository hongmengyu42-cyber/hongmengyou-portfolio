/**
 * The backend already rejects non-http(s) URLs on save. This is the second layer: the UI refuses to
 * render a link whose scheme is anything else (javascript:, data:, ...), even if bad data got in.
 * Returns the original string when safe, otherwise null.
 */
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
}

/** Props every link that leaves the site must carry. */
export const externalLinkProps = { target: '_blank', rel: 'noopener noreferrer' } as const;
