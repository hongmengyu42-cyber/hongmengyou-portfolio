import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { api, ApiError } from '../api/client';
import { projectDetail } from '../test/fixtures';
import { expectNoAxeViolations, mockContentApis, renderApp } from '../test/render';
import { ProjectPage } from './ProjectPage';

const renderAt = (slug: string) =>
  renderApp(
    <Routes>
      <Route path="projects/:slug" element={<ProjectPage />} />
    </Routes>,
    { route: `/projects/${slug}`, withContent: true },
  );

describe('ProjectPage', () => {
  it('renders the full detail: gallery with alt text, problem/solution, features and links', async () => {
    mockContentApis();
    vi.spyOn(api, 'project').mockResolvedValue(projectDetail());
    const { container } = renderAt('alpha');

    expect(await screen.findByRole('heading', { level: 1, name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Dashboard screenshot' })).toHaveAttribute('loading', 'eager');
    expect(screen.getByRole('img', { name: 'Settings screenshot' })).toHaveAttribute('loading', 'lazy');
    expect(screen.getByRole('heading', { name: 'The problem' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'The solution' })).toBeInTheDocument();
    expect(screen.getByText('Feature two')).toBeInTheDocument();

    const live = screen.getByRole('link', { name: /Live Demo of Alpha/ });
    expect(live).toHaveAttribute('target', '_blank');
    expect(live.getAttribute('rel')).toContain('noopener');
    expect(screen.queryByRole('link', { name: /Source Code/ })).not.toBeInTheDocument(); // githubUrl is null

    await expectNoAxeViolations(container);
  });

  it('renders user text as text, never as HTML', async () => {
    mockContentApis();
    vi.spyOn(api, 'project').mockResolvedValue(projectDetail());
    const { container } = renderAt('alpha');

    expect(await screen.findByText(/Second paragraph with <b>markup<\/b>/)).toBeInTheDocument();
    expect(container.querySelector('b')).toBeNull();
  });

  it('updates the document title for the route', async () => {
    mockContentApis();
    vi.spyOn(api, 'project').mockResolvedValue(projectDetail());
    renderAt('alpha');
    await screen.findByRole('heading', { level: 1, name: 'Alpha' });
    expect(document.title).toBe('Alpha | Test Person');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${window.location.origin}/projects/alpha`);
  });

  it('shows a not-found state for an unknown or unpublished slug', async () => {
    mockContentApis();
    vi.spyOn(api, 'project').mockRejectedValue(new ApiError(404, 'Project not found: nope'));
    renderAt('nope');
    expect(await screen.findByRole('heading', { name: /couldn’t find that project/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
  });

  it('shows other failures with a retry that recovers', async () => {
    mockContentApis();
    const spy = vi.spyOn(api, 'project').mockRejectedValueOnce(new ApiError(500, 'Boom')).mockResolvedValueOnce(projectDetail());
    renderAt('alpha');

    const alert = await screen.findByRole('alert');
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Alpha' })).toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('links back to the projects section of the home page', async () => {
    mockContentApis();
    vi.spyOn(api, 'project').mockResolvedValue(projectDetail());
    renderAt('alpha');
    expect(await screen.findByRole('link', { name: /All projects/ })).toHaveAttribute('href', '/#projects');
  });
});
