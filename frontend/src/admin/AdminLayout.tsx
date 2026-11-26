import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { adminApi } from '../api/admin';
import { Icon } from '../components/ui/Icon';
import { SkipLink } from '../components/layout/SkipLink';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from './AuthProvider';

interface Shell {
  /** Unread contact messages, or null until known. */
  unread: number | null;
  refreshUnread: () => void;
}

const ShellContext = createContext<Shell>({ unread: null, refreshUnread: () => undefined });
export const useAdminShell = (): Shell => useContext(ShellContext);

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/projects', label: 'Projects' },
  { to: '/admin/skills', label: 'Skills' },
  { to: '/admin/experience', label: 'Experience' },
  { to: '/admin/education', label: 'Education' },
  { to: '/admin/profile', label: 'Profile' },
  { to: '/admin/messages', label: 'Messages' },
];

export function AdminLayout() {
  const { email, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState<number | null>(null);

  const refreshUnread = useCallback(() => {
    adminApi.messages
      .unreadCount()
      .then((result) => setUnread(result.count))
      .catch((error: unknown) => console.warn('Could not load the unread message count:', error)); // badge is a nicety; the Messages page reports real errors
  }, []);
  useEffect(refreshUnread, [refreshUnread]);

  // The dashboard is private: keep it out of search results (robots.txt already disallows /admin).
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const shell = useMemo(() => ({ unread, refreshUnread }), [unread, refreshUnread]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-11 items-center justify-between rounded-control px-3 text-[0.9375rem] transition-colors ${
      isActive ? 'bg-surface-2 font-semibold text-ink' : 'text-muted hover:bg-surface-2 hover:text-ink'
    }`;

  return (
    <ShellContext.Provider value={shell}>
      <SkipLink />
      <div className="min-h-screen bg-canvas md:grid md:grid-cols-[15rem_1fr]">
        <aside className="border-b border-line bg-surface md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
          <div className="flex h-16 items-center justify-between px-4">
            <Link to="/admin" className="font-semibold">
              Admin
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="admin-nav"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="grid h-11 w-11 place-items-center rounded-control hover:bg-surface-2 md:hidden"
            >
              <Icon name={menuOpen ? 'x' : 'menu'} />
            </button>
          </div>
          <nav id="admin-nav" aria-label="Admin" className={`${menuOpen ? 'block' : 'hidden'} px-3 pb-4 md:block`}>
            <ul className="space-y-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className={linkClass} onClick={() => setMenuOpen(false)}>
                    {item.label}
                    {item.label === 'Messages' && unread ? (
                      <span className="ml-2 rounded-full bg-btn px-2 py-0.5 text-xs font-medium text-btn-fg">
                        {unread}
                        {' '}
                        <span className="sr-only">unread</span>
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="min-w-0">
          <header className="flex h-16 items-center justify-end gap-2 border-b border-line px-5 md:px-8">
            <span className="mr-auto hidden text-sm text-muted sm:inline">{email}</span>
            <Link to="/" className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-medium hover:bg-surface-2">
              View site
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="grid h-11 w-11 place-items-center rounded-control hover:bg-surface-2"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <button
              type="button"
              onClick={() => logout().then(() => navigate('/admin/login', { replace: true }))}
              className="inline-flex min-h-11 items-center gap-2 rounded-control border border-field px-4 text-sm font-medium hover:bg-surface-2"
            >
              <Icon name="log-out" size={18} /> Log out
            </button>
          </header>
          <main id="main" tabIndex={-1} className="mx-auto max-w-6xl p-5 outline-none md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ShellContext.Provider>
  );
}
