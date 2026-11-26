import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent, useVisibleSections } from '../../content/ContentProvider';
import { initials } from '../../lib/format';
import { useTheme } from '../../theme/ThemeProvider';
import { Icon } from '../ui/Icon';

export function Header() {
  const { profile } = useContent();
  const sections = useVisibleSections();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const name = profile.data?.fullName ?? 'Portfolio';

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const linkClass = 'rounded-control px-3 py-2 text-[0.9375rem] font-medium text-muted transition-colors hover:text-ink';

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-3 font-semibold" aria-label={`${name}, home`}>
          <span className="grid h-9 w-9 place-items-center rounded-control bg-btn font-mono text-sm text-btn-fg" aria-hidden="true">
            {initials(name)}
          </span>
          <span className="hidden sm:inline">{name}</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {sections.map((section) => (
            <Link key={section.id} to={{ pathname: '/', hash: `#${section.id}` }} className={linkClass}>
              {section.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="grid h-11 w-11 place-items-center rounded-control text-ink transition-colors hover:bg-surface-2"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="grid h-11 w-11 place-items-center rounded-control text-ink transition-colors hover:bg-surface-2 md:hidden"
          >
            <Icon name={menuOpen ? 'x' : 'menu'} />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav id="mobile-nav" aria-label="Primary mobile" className="border-t border-line bg-canvas md:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col px-5 py-3 sm:px-8">
            {sections.map((section) => (
              <li key={section.id}>
                <Link
                  to={{ pathname: '/', hash: `#${section.id}` }}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-control px-3 py-3 text-lg font-medium"
                >
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
