import { useMemo, useState } from 'react';
import { api } from '../../api/client';
import type { ProjectCategory } from '../../api/types';
import { useApi } from '../../api/useApi';
import { CATEGORY_LABELS } from '../../lib/format';
import { ProjectCard } from '../projects/ProjectCard';
import { AsyncState } from '../ui/AsyncState';
import { DevPlaceholder } from '../ui/DevPlaceholder';
import { Reveal } from '../ui/Reveal';
import { Section } from '../ui/Section';
import { Skeleton } from '../ui/Skeleton';

type Filter = 'ALL' | ProjectCategory;

export function Projects() {
  // One request for all published projects (50 is the backend's page-size cap); filtering is then instant
  // and needs no extra round trips. Revisit with server-side filtering if you ever exceed 50 projects.
  const projects = useApi((signal) => api.projects({}, signal));
  const [filter, setFilter] = useState<Filter>('ALL');

  const all = projects.data?.content ?? [];
  const categories = useMemo(() => [...new Set(all.map((project) => project.category))], [all]);
  const visible = filter === 'ALL' ? all : all.filter((project) => project.category === filter);

  return (
    <Section
      id="projects"
      eyebrow="03 / Projects"
      title="Selected work"
      description="Deployed projects you can open and try. Each one links to a live demo."
    >
      <AsyncState
        loading={projects.loading}
        error={projects.error}
        onRetry={projects.reload}
        label="projects"
        skeleton={
          <div className="grid gap-8 md:grid-cols-2">
            <Skeleton className="h-96 md:col-span-2" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        }
        isEmpty={all.length === 0}
        empty={
          <div className="card p-8">
            <p className="font-medium">Projects will appear here soon.</p>
            <div className="mt-3">
              <DevPlaceholder>add and publish projects in Admin → Projects</DevPlaceholder>
            </div>
          </div>
        }
      >
        {categories.length > 1 ? (
          <div role="group" aria-label="Filter projects by category" className="mb-8 flex flex-wrap gap-2">
            {(['ALL', ...categories] as Filter[]).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={filter === option}
                onClick={() => setFilter(option)}
                className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors ${
                  filter === option ? 'border-transparent bg-btn text-btn-fg' : 'border-field text-ink hover:bg-surface-2'
                }`}
              >
                {option === 'ALL' ? 'All' : (CATEGORY_LABELS[option] ?? option)}
              </button>
            ))}
          </div>
        ) : null}
        <p className="sr-only" role="status" aria-live="polite">
          Showing {visible.length} {visible.length === 1 ? 'project' : 'projects'}
        </p>
        <ul className="grid gap-8 md:grid-cols-2">
          {visible.map((project, index) => (
            <li key={project.id} className={project.featured ? 'md:col-span-2' : ''}>
              <Reveal delay={Math.min(index, 3) * 0.05} className="h-full">
                <ProjectCard project={project} large={project.featured} />
              </Reveal>
            </li>
          ))}
        </ul>
      </AsyncState>
    </Section>
  );
}
