import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { adminApi } from '../api/admin';
import { ApiError } from '../api/client';
import { expectNoAxeViolations, renderApp } from '../test/render';
import { listItem, page } from '../test/adminFixtures';
import { AdminApp } from './AdminApp';

const me = { email: 'admin@example.test', roles: ['ROLE_ADMIN'] };
const renderAt = (route: string) =>
  renderApp(
    <Routes>
      <Route path="admin/*" element={<AdminApp />} />
    </Routes>,
    { route },
  );

function mockShell({ authenticated = true } = {}) {
  const meSpy = vi.spyOn(adminApi, 'me');
  if (authenticated) meSpy.mockResolvedValue(me);
  else meSpy.mockRejectedValueOnce(new ApiError(401, 'Unauthorized')).mockResolvedValue(me);
  vi.spyOn(adminApi.messages, 'unreadCount').mockResolvedValue({ count: 3 });
  vi.spyOn(adminApi.projects, 'list').mockResolvedValue(page([listItem()]));
}

describe('admin authentication', () => {
  it('sends an anonymous visitor to the login page and fetches no admin data', async () => {
    mockShell({ authenticated: false });
    renderAt('/admin/projects');

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(adminApi.projects.list).not.toHaveBeenCalled();
  });

  it('signs in, then lands on the page the visitor originally asked for', async () => {
    mockShell({ authenticated: false });
    const login = vi.spyOn(adminApi, 'login').mockResolvedValue();
    renderAt('/admin/projects');

    await userEvent.type(await screen.findByLabelText('Email'), 'admin@example.test');
    await userEvent.type(screen.getByLabelText('Password'), 'correct horse battery');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(login).toHaveBeenCalledWith('admin@example.test', 'correct horse battery');
    expect(await screen.findByRole('heading', { level: 1, name: 'Projects' })).toBeInTheDocument();
  });

  it('shows one generic message for a failed login and clears the password field', async () => {
    mockShell({ authenticated: false });
    vi.spyOn(adminApi, 'login').mockRejectedValue(new ApiError(401, 'Invalid email or password.'));
    renderAt('/admin/login');

    await userEvent.type(await screen.findByLabelText('Email'), 'admin@example.test');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });

  it('explains rate limiting and requires both fields', async () => {
    mockShell({ authenticated: false });
    vi.spyOn(adminApi, 'login').mockRejectedValue(new ApiError(429, 'Too many login attempts.'));
    renderAt('/admin/login');

    await userEvent.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your email and password.');
    expect(adminApi.login).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Email'), 'a@b.test');
    await userEvent.type(screen.getByLabelText('Password'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts');
  });

  it('returns to the login page when the session expires mid-use (401 from any admin request)', async () => {
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/auth/me')) return json(me);
        if (url.includes('unread-count')) return json({ count: 0 });
        return json({ title: 'Unauthorized', status: 401 }, 401); // the session has expired
      }),
    );
    renderAt('/admin');

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('redirects a signed-in user away from the login page', async () => {
    mockShell();
    renderAt('/admin/login');
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
  });

  it('logs out and returns to the login page', async () => {
    mockShell();
    const logout = vi.spyOn(adminApi, 'logout').mockResolvedValue();
    renderAt('/admin');

    await userEvent.click(await screen.findByRole('button', { name: 'Log out' }));

    expect(logout).toHaveBeenCalled();
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows the shell: current page, unread badge and an owner-only noindex marker', async () => {
    mockShell();
    renderAt('/admin/projects');
    const nav = await screen.findByRole('navigation', { name: 'Admin' });

    expect(within(nav).getByRole('link', { name: 'Projects' })).toHaveAttribute('aria-current', 'page');
    expect(await within(nav).findByRole('link', { name: /Messages/ })).toHaveTextContent('3 unread');
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  });

  it('has no structural accessibility violations on the login page', async () => {
    mockShell({ authenticated: false });
    const { container } = renderAt('/admin/login');
    await screen.findByRole('heading', { name: 'Sign in' });
    await expectNoAxeViolations(container);
  });
});
