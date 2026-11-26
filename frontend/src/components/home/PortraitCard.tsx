import type { Profile } from '../../api/types';
import { initials } from '../../lib/format';
import { DevPlaceholder } from '../ui/DevPlaceholder';

/**
 * The hero's visual: the owner's photo filling a portrait-shaped card. People hire people, so a clear face beats
 * decoration. Without a photo it shows a same-size monogram tile, so the layout never shifts when one is added.
 */
export function PortraitCard({ profile }: { profile: Profile }) {
  return (
    <div>
      <div className="relative">
        {/* Offset outline: a quiet depth cue that makes the photo feel placed rather than pasted. */}
        <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 rounded-card border border-field/60 sm:translate-x-4 sm:translate-y-4" />
        <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface-2 shadow-lift ring-1 ring-line">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.avatarAlt || profile.fullName}
              width={640}
              height={800}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div aria-hidden="true" className="grid h-full w-full place-items-center bg-btn font-mono text-7xl text-btn-fg">
              {initials(profile.fullName)}
            </div>
          )}
        </div>
      </div>
      {!profile.avatarUrl ? (
        <div className="mt-6">
          <DevPlaceholder>upload your photo in Admin → Profile</DevPlaceholder>
        </div>
      ) : null}
    </div>
  );
}
