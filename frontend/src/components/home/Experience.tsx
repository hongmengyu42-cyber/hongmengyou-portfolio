import { useContent } from '../../content/ContentProvider';
import { formatRange, paragraphs } from '../../lib/format';
import { AsyncState } from '../ui/AsyncState';
import { Badge } from '../ui/Badge';
import { Reveal } from '../ui/Reveal';
import { Section } from '../ui/Section';
import { Skeleton } from '../ui/Skeleton';

const TYPE_LABEL = { WORK: 'Work', INTERNSHIP: 'Internship', ACTIVITY: 'Activity' } as const;

export function Experience() {
  const { experience } = useContent();
  const items = experience.data ?? [];
  if (!experience.error && items.length === 0) return null; // optional section: absent until there is content
  return (
    <Section id="experience" eyebrow="04 / Experience" title="Where I’ve worked and contributed" tinted>
      <AsyncState
        loading={experience.loading}
        error={experience.error}
        onRetry={experience.reload}
        label="experience"
        skeleton={<Skeleton className="h-40" />}
      >
        <ol className="relative space-y-10 border-l border-line pl-8">
          {items.map((item, index) => (
            <li key={item.id} className="relative">
              <span aria-hidden="true" className="absolute -left-[2.45rem] top-2 h-3 w-3 rounded-full border-2 border-accent bg-canvas" />
              <Reveal delay={Math.min(index, 3) * 0.05}>
                <p className="font-mono text-sm text-muted">{formatRange(item.startDate, item.endDate, item.current)}</p>
                <h3 className="mt-1 text-xl font-semibold">{item.role}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-muted">
                  <span>
                    {item.company}
                    {item.location ? ` · ${item.location}` : ''}
                  </span>
                  <Badge tone="outline">{TYPE_LABEL[item.type]}</Badge>
                </p>
                <div className="mt-3 max-w-2xl space-y-3">
                  {paragraphs(item.description).map((part, partIndex) => (
                    <p key={partIndex}>{part}</p>
                  ))}
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </AsyncState>
    </Section>
  );
}
