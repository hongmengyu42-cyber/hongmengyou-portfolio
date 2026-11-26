import { Link } from 'react-router-dom';
import type { ProjectSummary } from '../../api/types';
import { buttonClasses } from '../ui/buttonStyles';
import { ProjectImage } from './ProjectImage';
import { ProjectLinks } from './ProjectLinks';
import { CategoryBadge, StatusBadge, TechTags } from './ProjectMeta';

/** The screenshot is the visual focus. A featured project spans the full row with the image beside the text. */
export function ProjectCard({ project, large = false }: { project: ProjectSummary; large?: boolean }) {
  const detailPath = `/projects/${project.slug}`;
  return (
    <article className={`card card-hover flex h-full overflow-hidden ${large ? 'flex-col md:flex-row' : 'flex-col'}`}>
      {/* Mouse-only shortcut; keyboard and screen-reader users get the title link below, so it is skipped here. */}
      <Link
        to={detailPath}
        tabIndex={-1}
        aria-hidden="true"
        className={`block shrink-0 overflow-hidden bg-surface-2 ${large ? 'md:w-[58%]' : ''}`}
      >
        <div className={`aspect-[16/10] ${large ? 'md:aspect-auto md:h-full md:min-h-[22rem]' : ''}`}>
          <ProjectImage image={project.thumbnail} projectName={project.name} className="transition-transform duration-500 hover:scale-[1.02]" />
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={project.status} />
          <CategoryBadge category={project.category} />
        </div>
        <h3 className={`font-semibold ${large ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
          <Link to={detailPath} className="hover:text-accent-text">
            {project.name}
          </Link>
        </h3>
        <p className="text-muted">{project.summary}</p>
        <TechTags technologies={project.technologies} />
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
          <ProjectLinks name={project.name} liveUrl={project.liveUrl} githubUrl={project.githubUrl} />
          <Link to={detailPath} className={buttonClasses('ghost')}>
            View details{' '}
            <span className="sr-only">of {project.name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
