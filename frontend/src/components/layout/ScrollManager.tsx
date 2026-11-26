import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useVisibleSections } from '../../content/ContentProvider';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion';

/**
 * React Router does not scroll to #hash targets or reset scroll on navigation. Sections appear after their data
 * loads, so the effect also re-runs when the set of visible sections changes.
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation();
  const reduced = usePrefersReducedMotion();
  const sectionKey = useVisibleSections().map((section) => section.id).join(',');

  useEffect(() => {
    const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth';
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) target.scrollIntoView({ behavior });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash, sectionKey, reduced]);

  return null;
}
