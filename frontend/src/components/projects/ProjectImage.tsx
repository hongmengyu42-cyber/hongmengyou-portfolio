import type { ProjectImage as ProjectImageData } from '../../api/types';
import { initials } from '../../lib/format';
import { Icon } from '../ui/Icon';

interface Props {
  image: ProjectImageData | null | undefined;
  projectName: string;
  /** Eager-load only the one image that is likely the largest paint on screen. */
  priority?: boolean;
  className?: string;
}

/**
 * A project screenshot. width/height come from the API so the browser reserves the space before the image
 * arrives (no layout shift); lazy loading keeps off-screen screenshots from slowing the first paint.
 */
export function ProjectImage({ image, projectName, priority = false, className = '' }: Props) {
  if (!image) {
    return (
      <div className={`grid place-items-center bg-surface-2 text-muted ${className}`}>
        <div className="flex flex-col items-center gap-2">
          <Icon name="image" size={32} />
          <span className="font-mono text-sm" aria-hidden="true">
            {initials(projectName)}
          </span>
        </div>
      </div>
    );
  }
  return (
    <img
      src={image.url}
      alt={image.altText}
      width={image.width}
      height={image.height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      {...(priority ? { fetchPriority: 'high' as const } : {})}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
