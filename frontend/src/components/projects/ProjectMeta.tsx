import type { ProjectCategory, ProjectStatus } from '../../api/types';
import { CATEGORY_LABELS, STATUS_LABELS } from '../../lib/format';
import { Badge } from '../ui/Badge';

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge tone={status === 'LIVE' ? 'accent' : 'outline'}>
      {status === 'LIVE' ? <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" /> : null}
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function CategoryBadge({ category }: { category: ProjectCategory }) {
  return <Badge tone="neutral">{CATEGORY_LABELS[category] ?? category}</Badge>;
}

export function TechTags({ technologies }: { technologies: string[] }) {
  if (technologies.length === 0) return null;
  return (
    <ul aria-label="Technologies" className="flex flex-wrap gap-2">
      {technologies.map((tech) => (
        <li key={tech} className="rounded-control border border-line px-2.5 py-1 font-mono text-xs text-muted">
          {tech}
        </li>
      ))}
    </ul>
  );
}
