import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useApi } from '../api/useApi';
import { Gallery } from '../components/projects/Gallery';
import { ProjectLinks } from '../components/projects/ProjectLinks';
import { CategoryBadge, StatusBadge, TechTags } from '../components/projects/ProjectMeta';
import { AsyncState } from '../components/ui/AsyncState';
import { Icon } from '../components/ui/Icon';
import { Skeleton } from '../components/ui/Skeleton';
import { useContent } from '../content/ContentProvider';
import { paragraphs } from '../lib/format';
import { useSeo } from '../lib/useSeo';
import { NotFoundPage } from './NotFoundPage';

function TextBlock({ title, text }: { title: string; text: string | null | undefined }) {
  const parts = paragraphs(text);
  if (parts.length === 0) return null;
  return (
    <div className="card p-6">
      <h2 className="mb-3 text-xl font-semibold">{title}</h2>
      <div className="space-y-3 text-muted">
        {parts.map((part, index) => (
          <p key={index}>{part}</p>
        ))}
      </div>
    </div>
  );
}

export function ProjectPage() {
  const { slug = '' } = useParams();
  const { profile } = useContent();
  const project = useApi((signal) => api.project(slug, signal), [slug]);
  const data = project.data;

  const owner = profile.data?.fullName;
  useSeo({
    title: data ? (owner ? `${data.name} | ${owner}` : data.name) : 'Project',
    description: data?.summary,
    path: `/projects/${slug}`,
    image: data ? (data.images.find((image) => image.thumbnail) ?? data.images[0])?.url : null,
    type: 'article',
  });

  if (project.error?.isNotFound) return <NotFoundPage what="project" />;

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-8">
      <Link to={{ pathname: '/', hash: '#projects' }} className="mb-8 inline-flex min-h-11 items-center gap-2 font-medium text-accent-text underline-offset-4 hover:underline">
        <Icon name="arrow-left" size={18} /> All projects
      </Link>
      <AsyncState
        loading={project.loading}
        error={project.error}
        onRetry={project.reload}
        label="project"
        skeleton={
          <div className="space-y-6">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-96" />
          </div>
        }
      >
        {data ? (
          <article>
            <header className="mb-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={data.status} />
                <CategoryBadge category={data.category} />
              </div>
              <h1 className="text-4xl font-semibold md:text-5xl">{data.name}</h1>
              <p className="max-w-3xl text-xl text-muted">{data.summary}</p>
              <TechTags technologies={data.technologies} />
              <div className="flex flex-wrap gap-3 pt-2">
                <ProjectLinks name={data.name} liveUrl={data.liveUrl} githubUrl={data.githubUrl} />
              </div>
            </header>

            <Gallery images={data.images} />

            <div className="mt-12 grid gap-10 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-7">
                <h2 className="text-2xl font-semibold">About this project</h2>
                {paragraphs(data.description).map((part, index) => (
                  <p key={index} className="text-lg">
                    {part}
                  </p>
                ))}
              </div>
              <div className="space-y-6 lg:col-span-5">
                <TextBlock title="The problem" text={data.problem} />
                <TextBlock title="The solution" text={data.solution} />
                {data.keyFeatures.length > 0 ? (
                  <div className="card p-6">
                    <h2 className="mb-3 text-xl font-semibold">Key features</h2>
                    <ul className="space-y-2">
                      {data.keyFeatures.map((feature) => (
                        <li key={feature} className="flex gap-2 text-muted">
                          <span className="mt-1 text-accent-text">
                            <Icon name="check" size={18} />
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        ) : null}
      </AsyncState>
    </div>
  );
}

export default ProjectPage;
