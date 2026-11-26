import { useContent } from '../../content/ContentProvider';
import { safeExternalUrl } from '../../lib/safeUrl';
import { AsyncState } from '../ui/AsyncState';
import { DevPlaceholder } from '../ui/DevPlaceholder';
import { Icon } from '../ui/Icon';
import { LinkButton } from '../ui/Button';
import { Reveal } from '../ui/Reveal';
import { Skeleton } from '../ui/Skeleton';
import { PortraitCard } from './PortraitCard';

/** "A | B | C" becomes the roles [A, B] and the status line C (the last part reads as a status, e.g. a student year). */
export function splitHeadline(headline: string): { roles: string[]; status: string | null } {
  const parts = headline.split('|').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 3) return { roles: parts.slice(0, -1), status: parts[parts.length - 1] ?? null };
  return { roles: parts, status: null };
}

function HeroSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-16 w-3/4" />
      <Skeleton className="h-16 w-1/2" />
      <Skeleton className="h-20 w-full max-w-xl" />
    </div>
  );
}

export function Hero() {
  const { profile } = useContent();
  return (
    <section id="top" aria-labelledby="hero-heading" className="bg-hero">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 md:pt-20 lg:grid-cols-12 lg:gap-8 lg:pb-32">
        <div className="lg:col-span-7">
          <AsyncState
            loading={profile.loading}
            error={profile.error}
            onRetry={profile.reload}
            label="profile"
            skeleton={<HeroSkeleton />}
          >
            {profile.data ? <HeroText profile={profile.data} /> : null}
          </AsyncState>
        </div>
        <div className="mx-auto w-full max-w-sm pr-3 lg:col-span-5 lg:mx-0 lg:max-w-none lg:translate-y-10">
          {profile.data ? (
            <Reveal delay={0.15}>
              <PortraitCard profile={profile.data} />
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function HeroText({ profile }: { profile: NonNullable<ReturnType<typeof useContent>['profile']['data']> }) {
  const { roles, status } = splitHeadline(profile.headline);
  const [first = '', ...rest] = profile.fullName.split(' ');
  const cv = safeExternalUrl(profile.cvUrl) ?? (profile.cvUrl?.startsWith('/') ? profile.cvUrl : null);
  return (
    <Reveal>
      {status ? <p className="eyebrow mb-5">{status}</p> : null}
      <h1 id="hero-heading" className="text-5xl font-semibold sm:text-6xl lg:text-7xl">
        <span className="block">{first}</span>{' '}
        {rest.length > 0 ? <span className="block text-accent-text">{rest.join(' ')}</span> : null}
      </h1>
      {roles.length > 0 ? (
        <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-sm text-muted">
          {roles.map((role, index) => (
            <span key={role} className="inline-flex items-center gap-4">
              {index > 0 ? <span aria-hidden="true" className="h-4 w-px bg-line" /> : null}
              {role}
            </span>
          ))}
        </p>
      ) : null}
      <p className="mt-6 max-w-xl text-lg text-muted md:text-xl">{profile.intro}</p>
      <div className="mt-9 flex flex-wrap items-center gap-3">
        <LinkButton href="#projects">View Projects</LinkButton>
        <LinkButton href="#contact" variant="secondary">
          Contact Me
        </LinkButton>
        {cv ? (
          <LinkButton href={cv} variant="ghost" download>
            <Icon name="download" /> Download CV
          </LinkButton>
        ) : (
          <DevPlaceholder>upload your CV (PDF) in Admin → Profile to show “Download CV”</DevPlaceholder>
        )}
      </div>
    </Reveal>
  );
}
