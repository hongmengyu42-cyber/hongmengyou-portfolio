import { Link } from 'react-router-dom';
import { useSeo } from '../lib/useSeo';
import { buttonClasses } from '../components/ui/buttonStyles';

export function NotFoundPage({ what = 'page' }: { what?: string }) {
  useSeo({ title: `${what[0]?.toUpperCase() ?? ''}${what.slice(1)} not found` });
  return (
    <section aria-labelledby="not-found-heading" className="mx-auto max-w-2xl px-5 py-28 text-center sm:px-8">
      <p className="eyebrow mb-3">404</p>
      <h1 id="not-found-heading" className="text-4xl font-semibold">
        We couldn’t find that {what}.
      </h1>
      <p className="mt-4 text-lg text-muted">It may have been moved, unpublished or never existed.</p>
      <Link to="/" className={`${buttonClasses('primary')} mt-8`}>
        Back to home
      </Link>
    </section>
  );
}

export default NotFoundPage;
