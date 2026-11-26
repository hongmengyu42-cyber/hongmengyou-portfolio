const monthYear = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });

/** "2024-06-01" becomes "Jun 2024". UTC on both sides, so the displayed month never shifts with the timezone. */
export function formatMonthYear(isoDate: string): string {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? isoDate : monthYear.format(date);
}

export function formatRange(start: string, end: string | null | undefined, current = false): string {
  const to = current || !end ? 'Present' : formatMonthYear(end);
  return `${formatMonthYear(start)} – ${to}`;
}

/** Splits plain text into paragraphs. Content is only ever rendered as text, never as HTML. */
export function paragraphs(text: string | null | undefined): string[] {
  return (text ?? '')
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

export const CATEGORY_LABELS: Record<string, string> = {
  WEB_APP: 'Web App',
  API: 'API',
  FULL_STACK: 'Full-Stack',
  MOBILE: 'Mobile',
  LIBRARY: 'Library',
  OTHER: 'Other',
};

export const STATUS_LABELS: Record<string, string> = {
  LIVE: 'Live',
  IN_DEVELOPMENT: 'In development',
  ARCHIVED: 'Archived',
};

const dateTime = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : dateTime.format(date);
}
