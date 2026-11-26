import type { Profile } from '../../api/types';
import { externalLinkProps, safeExternalUrl } from '../../lib/safeUrl';
import { DevPlaceholder } from '../ui/DevPlaceholder';
import { Icon } from '../ui/Icon';

const itemClass =
  'inline-flex min-h-11 items-center gap-2 rounded-control border border-field px-4 text-[0.9375rem] font-medium text-ink transition-colors hover:bg-surface-2';

/** GitHub, LinkedIn and email, each shown only when the profile has a valid value for it. */
export function SocialLinks({ profile }: { profile: Profile }) {
  const github = safeExternalUrl(profile.githubUrl);
  const linkedin = safeExternalUrl(profile.linkedinUrl);
  const email = profile.publicEmail?.trim() || null;
  return (
    <ul className="flex flex-wrap gap-3">
      {github ? (
        <li>
          <a href={github} className={itemClass} {...externalLinkProps}>
            <Icon name="github" /> GitHub{' '}<span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
      ) : null}
      {linkedin ? (
        <li>
          <a href={linkedin} className={itemClass} {...externalLinkProps}>
            <Icon name="linkedin" /> LinkedIn{' '}<span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
      ) : null}
      {email ? (
        <li>
          <a href={`mailto:${email}`} className={itemClass}>
            <Icon name="mail" /> {email}
          </a>
        </li>
      ) : null}
      {!github && !linkedin && !email ? (
        <li>
          <DevPlaceholder>add GitHub, LinkedIn and email in Admin → Profile</DevPlaceholder>
        </li>
      ) : null}
    </ul>
  );
}
