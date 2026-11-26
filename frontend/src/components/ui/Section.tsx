import type { ReactNode } from 'react';

interface SectionProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  tinted?: boolean;
}

/** Shared page-section frame: consistent spacing, heading hierarchy (h2) and anchor target. */
export function Section({ id, eyebrow, title, description, children, tinted = false }: SectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className={tinted ? 'bg-surface-2' : ''}>
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
        <header className="mb-12 max-w-2xl">
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h2 id={headingId} className="text-3xl font-semibold md:text-4xl">
            {title}
          </h2>
          {description ? <p className="mt-4 text-lg text-muted">{description}</p> : null}
        </header>
        {children}
      </div>
    </section>
  );
}
