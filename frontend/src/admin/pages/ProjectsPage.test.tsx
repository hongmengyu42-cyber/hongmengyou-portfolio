import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { adminApi } from '../../api/admin';
import { ApiError } from '../../api/client';
import { listItem, page } from '../../test/adminFixtures';
import { expectNoAxeViolations, renderAdmin } from '../../test/render';
import { ProjectsPage } from './ProjectsPage';

const three = () => [listItem({ id: 1, name: 'Alpha' }), listItem({ id: 2, slug: 'beta', name: 'Beta', published: false }), listItem({ id: 3, slug: 'gamma', name: 'Gamma', featured: true })];
const rowNames = () => within(screen.getByRole('table')).getAllByRole('link', { name: /^(Alpha|Beta|Gamma)$/ }).map((a) => a.textContent);

describe('ProjectsPage', () => {
  it('lists projects with draft/featured/link status spelled out in words', async () => {
    vi.spyOn(adminApi.projects, 'list').mockResolvedValue(page(three()));
    const { container } = renderAdmin(<ProjectsPage />);

    expect(await screen.findByRole('link', { name: 'Alpha' })).toHaveAttribute('href', '/admin/projects/1');
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(screen.getAllByText('Not checked')).toHaveLength(3);
    await expectNoAxeViolations(container);
  });

  it('shows empty and error states', async () => {
    vi.spyOn(adminApi.projects, 'list').mockRejectedValueOnce(new ApiError(500, 'Down')).mockResolvedValueOnce(page([]));
    renderAdmin(<ProjectsPage />);

    await userEvent.click(within(await screen.findByRole('alert')).getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('No projects yet. Create your first one.')).toBeInTheDocument();
  });

  it('reorders with the arrow buttons: sends the complete id list and moves the row immediately', async () => {
    vi.spyOn(adminApi.projects, 'list').mockResolvedValue(page(three()));
    const reorder = vi.spyOn(adminApi.projects, 'reorder').mockResolvedValue();
    renderAdmin(<ProjectsPage />);
    await screen.findByRole('link', { name: 'Alpha' });
    expect(screen.getByRole('button', { name: 'Move Alpha up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Gamma down' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Move Beta up' }));

    expect(reorder).toHaveBeenCalledWith([2, 1, 3]);
    expect(rowNames()).toEqual(['Beta', 'Alpha', 'Gamma']);
    expect(await screen.findByText('Moved “Beta” to position 1.')).toBeInTheDocument();
  });

  it('rolls the order back and shows an error if the server rejects the reorder', async () => {
    vi.spyOn(adminApi.projects, 'list').mockResolvedValue(page(three()));
    vi.spyOn(adminApi.projects, 'reorder').mockRejectedValue(new ApiError(409, 'The id list must contain every project exactly once.'));
    renderAdmin(<ProjectsPage />);
    await screen.findByRole('link', { name: 'Alpha' });

    await userEvent.click(screen.getByRole('button', { name: 'Move Beta up' }));

    expect(await screen.findByText(/Could not reorder: The id list must contain/)).toBeInTheDocument();
    expect(rowNames()).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('disables reordering when not every project is on the page', async () => {
    vi.spyOn(adminApi.projects, 'list').mockResolvedValue(page(three(), { totalElements: 150 }));
    renderAdmin(<ProjectsPage />);
    await screen.findByRole('link', { name: 'Alpha' });
    expect(screen.getByRole('button', { name: 'Move Beta up' })).toBeDisabled();
    expect(screen.getByText(/Reordering is disabled/)).toBeInTheDocument();
  });

  it('checks all links, shows each result with its note, and refreshes the list', async () => {
    const list = vi.spyOn(adminApi.projects, 'list').mockResolvedValue(page(three()));
    vi.spyOn(adminApi.projects, 'checkAllLinks').mockResolvedValue([
      { projectId: 1, projectName: 'Alpha', status: 'OK', checkedAt: '2026-02-03T10:00:00Z', httpStatus: 200, note: 'HTTP 200' },
      { projectId: 2, projectName: 'Beta', status: 'BLOCKED', checkedAt: '2026-02-03T10:00:00Z', note: 'The host resolves to a non-public address.' },
    ]);
    renderAdmin(<ProjectsPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Check all links' }));

    const results = await screen.findByRole('region', { name: 'Link check results' });
    expect(within(results).getByText('Link OK')).toBeInTheDocument();
    expect(within(results).getByText('Link blocked')).toBeInTheDocument();
    expect(within(results).getByText('The host resolves to a non-public address.')).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('reports a failed link check instead of failing silently', async () => {
    vi.spyOn(adminApi.projects, 'list').mockResolvedValue(page(three()));
    vi.spyOn(adminApi.projects, 'checkAllLinks').mockRejectedValue(new ApiError(0, 'Network error.'));
    renderAdmin(<ProjectsPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Check all links' }));
    expect(await screen.findByText('Link check failed: Network error.')).toBeInTheDocument();
  });

  it('confirms before deleting a project', async () => {
    vi.spyOn(adminApi.projects, 'list').mockResolvedValue(page(three()));
    const remove = vi.spyOn(adminApi.projects, 'remove').mockResolvedValue();
    renderAdmin(<ProjectsPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Delete Beta' }));
    expect(screen.getByRole('dialog', { name: 'Delete project?' })).toHaveTextContent('all of its screenshots');
    expect(remove).not.toHaveBeenCalled();

    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
    expect(remove).toHaveBeenCalledWith(2);
  });
});
