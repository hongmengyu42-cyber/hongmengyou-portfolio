import { SHOW_PLACEHOLDERS } from '../../lib/env';

/** Obvious, easy-to-find marker for content the owner still has to supply. Rendered in development only. */
export function DevPlaceholder({ children }: { children: string }) {
  if (!SHOW_PLACEHOLDERS) return null;
  return (
    <p className="rounded-control border border-dashed border-field px-3 py-2 font-mono text-xs text-muted">
      TODO_REPLACE: {children}
    </p>
  );
}
