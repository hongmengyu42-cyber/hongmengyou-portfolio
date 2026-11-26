import { hasAboutContent, useContent } from '../../content/ContentProvider';
import { paragraphs } from '../../lib/format';
import { DevPlaceholder } from '../ui/DevPlaceholder';
import { Reveal } from '../ui/Reveal';
import { Section } from '../ui/Section';

function Block({ title, text }: { title: string; text: string }) {
  const parts = paragraphs(text);
  if (parts.length === 0) return null;
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <div className="space-y-4 text-muted">
        {parts.map((part, index) => (
          <p key={index}>{part}</p>
        ))}
      </div>
    </div>
  );
}

export function About() {
  const { profile } = useContent();
  const data = profile.data;
  if (!data) return null;
  const summary = paragraphs(data.professionalSummary);
  return (
    <Section id="about" eyebrow="01 / About" title="Background and goals">
      <Reveal>
        {hasAboutContent(data) ? (
          <div className="grid gap-12 lg:grid-cols-12">
            {summary.length > 0 ? (
              <div className="space-y-5 text-xl leading-relaxed lg:col-span-7">
                {summary.map((part, index) => (
                  <p key={index}>{part}</p>
                ))}
              </div>
            ) : null}
            <div className="space-y-8 lg:col-span-5">
              <Block title="Background" text={data.background} />
              <Block title="Career goals" text={data.careerGoals} />
            </div>
          </div>
        ) : (
          <DevPlaceholder>write your background, goals and summary in Admin → Profile</DevPlaceholder>
        )}
      </Reveal>
    </Section>
  );
}
