import type { SkillCategory } from '../../api/types';
import { useContent } from '../../content/ContentProvider';
import { groupSkills } from '../../lib/skillGroups';
import { AsyncState } from '../ui/AsyncState';
import { DevPlaceholder } from '../ui/DevPlaceholder';
import { Icon, type IconName } from '../ui/Icon';
import { Reveal } from '../ui/Reveal';
import { Section } from '../ui/Section';
import { Skeleton } from '../ui/Skeleton';

const ICONS: Record<SkillCategory, IconName> = {
  LANGUAGES: 'code',
  BACKEND: 'server',
  FRONTEND: 'layout',
  DATABASES: 'database',
  DEVOPS: 'terminal',
};

/** Backend gets the widest card: it is the strongest focus and holds the most skills. Asymmetric on purpose. */
const SPAN: Record<SkillCategory, string> = {
  LANGUAGES: 'lg:col-span-2',
  BACKEND: 'lg:col-span-4',
  FRONTEND: 'lg:col-span-2',
  DATABASES: 'lg:col-span-2',
  DEVOPS: 'lg:col-span-2',
};

export function Skills() {
  const { skills } = useContent();
  const groups = groupSkills(skills.data ?? []);
  return (
    <Section id="skills" eyebrow="02 / Skills" title="Tools I work with" description="Grouped by where they sit in the stack." tinted>
      <AsyncState
        loading={skills.loading}
        error={skills.error}
        onRetry={skills.reload}
        label="skills"
        skeleton={
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-6">
            <Skeleton className="h-40 lg:col-span-2" />
            <Skeleton className="h-40 lg:col-span-4" />
            <Skeleton className="h-40 lg:col-span-2" />
          </div>
        }
        isEmpty={groups.length === 0}
        empty={<DevPlaceholder>add skills in Admin → Skills</DevPlaceholder>}
      >
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-6">
          {groups.map((group, index) => (
            <li key={group.id} className={SPAN[group.id]}>
              <Reveal delay={index * 0.05} className="h-full">
                <article className="card card-hover h-full p-6" aria-labelledby={`skills-${group.id}`}>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-control bg-surface-2 text-accent-text">
                      <Icon name={ICONS[group.id]} />
                    </span>
                    <h3 id={`skills-${group.id}`} className="text-lg font-semibold">
                      {group.label}
                    </h3>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {group.skills.map((skill) => (
                      <li key={skill.id} className="rounded-control border border-line bg-surface-2 px-3 py-1.5 font-mono text-sm">
                        {skill.name}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </AsyncState>
    </Section>
  );
}
