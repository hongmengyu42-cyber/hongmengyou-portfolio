import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { adminApi } from '../../api/admin';
import { listItem, page } from '../../test/adminFixtures';
import { expectNoAxeViolations, renderAdmin } from '../../test/render';
import { DashboardPage } from './DashboardPage';

const items = () => [
  listItem({ id: 1, linkStatus: 'OK' }),
  listItem({ id: 2, slug: 'b', name: 'Beta', published: false, linkStatus: 'BROKEN' }),
  listItem({ id: 3, slug: 'c', name: 'Gamma', linkStatus: 'BLOCKED' }),
  listItem({ id: 4, slug: 'd', name: 'Delta' }),
];

describe('DashboardPage', () => {
  it('summarises projects and live-link health in words', async () => {
    vi.spyOn(adminApi.projects, 'list').mockResolvedValue(page(items()));
    const { container } = renderAdmin(<DashboardPage />);

    expect(await screen.findByText('4')).toBeInTheDocument();
    expect(screen.getByText('3 published')).toBeInTheDocument();
    expect(screen.getByText('1 OK')).toBeInTheDocument();
    expect(screen.getByText('1 broken · 1 blocked · 1 not checked')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('runs a link check from the quick actions and refreshes the numbers', async () => {
    const list = vi.spyOn(adminApi.projects, 'list').mockResolvedValue(page(items()));
    const check = vi.spyOn(adminApi.projects, 'checkAllLinks').mockResolvedValue([]);
    renderAdmin(<DashboardPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Check all links' }));

    expect(check).toHaveBeenCalled();
    expect(await screen.findByText('All live links checked.')).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
  });
});
