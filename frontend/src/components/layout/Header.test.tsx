import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { experience } from '../../test/fixtures';
import { mockContentApis, renderApp } from '../../test/render';
import { Header } from './Header';

describe('Header', () => {
  it('toggles the theme with an accurate accessible name', async () => {
    mockContentApis();
    renderApp(<Header />, { withContent: true });

    await userEvent.click(await screen.findByRole('button', { name: 'Switch to dark theme' }));

    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
  });

  it('opens and closes the mobile menu with aria-expanded and the Escape key', async () => {
    mockContentApis();
    renderApp(<Header />, { withContent: true });

    const toggle = screen.getByRole('button', { name: 'Open menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Primary mobile' })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('navigation', { name: 'Primary mobile' })).not.toBeInTheDocument();
  });

  it('lists only sections that exist: Experience appears only once there is data', async () => {
    mockContentApis({ experience: [] });
    const { unmount } = renderApp(<Header />, { withContent: true });
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/#projects');
    expect(within(nav).queryByRole('link', { name: 'Experience' })).not.toBeInTheDocument();
    unmount();

    mockContentApis({ experience });
    renderApp(<Header />, { withContent: true });
    expect(await within(screen.getByRole('navigation', { name: 'Primary' })).findByRole('link', { name: 'Experience' })).toBeInTheDocument();
  });
});
