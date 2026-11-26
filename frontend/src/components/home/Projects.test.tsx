import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { api, ApiError } from '../../api/client';
import type { PageResponse, ProjectSummary } from '../../api/types';
import { project } from '../../test/fixtures';
import { renderApp } from '../../test/render';
import { Projects } from './Projects';

const page = (content: ProjectSummary[]): PageResponse<ProjectSummary> => ({ content, page: 0, size: 50, totalElements: content.length, totalPages: 1 });

describe('Projects section', () => {
  it('announces loading, then shows the projects', async () => {
    vi.spyOn(api, 'projects').mockResolvedValue(page([project(), project({ id: 2, slug: 'beta', name: 'Beta' })]));
    renderApp(<Projects />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(await screen.findByRole('heading', { level: 3, name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Beta' })).toBeInTheDocument();
  });

  it('filters by category and reports the pressed state', async () => {
    vi.spyOn(api, 'projects').mockResolvedValue(
      page([project(), project({ id: 2, slug: 'beta', name: 'Beta', category: 'API' }), project({ id: 3, slug: 'gamma', name: 'Gamma', category: 'API' })]),
    );
    renderApp(<Projects />);
    await screen.findByRole('heading', { name: 'Alpha' });

    const group = screen.getByRole('group', { name: /filter projects/i });
    expect(within(group).getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(within(group).getByRole('button', { name: 'API' }));

    expect(within(group).getByRole('button', { name: 'API' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('heading', { name: 'Alpha' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Beta' })).toBeInTheDocument();
    expect(screen.getByText('Showing 2 projects')).toBeInTheDocument();
  });

  it('hides the filter when there is only one category', async () => {
    vi.spyOn(api, 'projects').mockResolvedValue(page([project(), project({ id: 2, slug: 'b', name: 'B' })]));
    renderApp(<Projects />);
    await screen.findByRole('heading', { name: 'Alpha' });
    expect(screen.queryByRole('group', { name: /filter projects/i })).not.toBeInTheDocument();
  });

  it('shows an error with a working retry instead of failing silently', async () => {
    const spy = vi.spyOn(api, 'projects').mockRejectedValueOnce(new ApiError(500, 'Server exploded')).mockResolvedValueOnce(page([project()]));
    renderApp(<Projects />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('couldn’t load the projects');
    expect(alert).toHaveTextContent('Server exploded');

    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Alpha' })).toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('shows a friendly empty state', async () => {
    vi.spyOn(api, 'projects').mockResolvedValue(page([]));
    renderApp(<Projects />);
    expect(await screen.findByText('Projects will appear here soon.')).toBeInTheDocument();
  });

  it('lets a featured project span the full row', async () => {
    vi.spyOn(api, 'projects').mockResolvedValue(page([project({ featured: true }), project({ id: 2, slug: 'b', name: 'B' })]));
    renderApp(<Projects />);
    const featured = (await screen.findByRole('heading', { name: 'Alpha' })).closest('li');
    expect(featured).toHaveClass('md:col-span-2');
  });
});
