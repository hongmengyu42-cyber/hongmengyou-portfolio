import { externalLinkProps, safeExternalUrl } from '../../lib/safeUrl';
import { LinkButton } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface Props {
  name: string;
  liveUrl?: string | null;
  githubUrl?: string | null;
}

/**
 * "Live Demo" opens the deployed site in a new tab with noopener/noreferrer (so the other site cannot reach
 * back into this window). "Source Code" is only rendered when a repository URL exists. Both buttons pass
 * through safeExternalUrl, so a non-http(s) value is never turned into a link.
 */
export function ProjectLinks({ name, liveUrl, githubUrl }: Props) {
  const live = safeExternalUrl(liveUrl);
  const source = safeExternalUrl(githubUrl);
  if (!live && !source) return null;
  return (
    <>
      {live ? (
        <LinkButton href={live} aria-label={`Live Demo of ${name} (opens in a new tab)`} {...externalLinkProps}>
          Live Demo <Icon name="arrow-up-right" size={18} />
        </LinkButton>
      ) : null}
      {source ? (
        <LinkButton href={source} variant="secondary" aria-label={`Source Code of ${name} (opens in a new tab)`} {...externalLinkProps}>
          <Icon name="github" size={18} /> Source Code
        </LinkButton>
      ) : null}
    </>
  );
}
