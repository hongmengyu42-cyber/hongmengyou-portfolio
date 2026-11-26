import { useContent } from '../../content/ContentProvider';
import { SocialLinks } from './SocialLinks';

export function Footer() {
  const { profile } = useContent();
  return (
    <footer className="border-t border-line bg-surface-2">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted">
          © {new Date().getFullYear()} {profile.data?.fullName ?? ''}. All rights reserved.
        </p>
        {profile.data ? <SocialLinks profile={profile.data} /> : null}
        <a href="#main" className="text-sm font-medium text-accent-text underline-offset-4 hover:underline">
          Back to top
        </a>
      </div>
    </footer>
  );
}
