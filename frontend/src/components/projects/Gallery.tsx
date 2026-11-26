import type { ProjectImage as ProjectImageData } from '../../api/types';

/** Screenshots at their natural proportions. The first is the page's likely largest paint, so it loads eagerly. */
export function Gallery({ images }: { images: ProjectImageData[] }) {
  if (images.length === 0) return null;
  const [first, ...rest] = images;
  if (!first) return null;
  return (
    <div className="space-y-6">
      <figure className="overflow-hidden rounded-card border border-line bg-surface-2 shadow-soft">
        <img src={first.url} alt={first.altText} width={first.width} height={first.height} loading="eager" decoding="async" fetchPriority="high" className="h-auto w-full" />
      </figure>
      {rest.length > 0 ? (
        <ul className="grid gap-6 sm:grid-cols-2">
          {rest.map((image) => (
            <li key={image.id}>
              <figure className="overflow-hidden rounded-card border border-line bg-surface-2 shadow-soft">
                <img src={image.url} alt={image.altText} width={image.width} height={image.height} loading="lazy" decoding="async" className="h-auto w-full" />
              </figure>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
