import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { adminApi } from '../../api/admin';
import { ApiError } from '../../api/client';
import { message, page } from '../../test/adminFixtures';
import { expectNoAxeViolations, renderAdmin } from '../../test/render';
import { MessagesPage } from './MessagesPage';

describe('MessagesPage', () => {
  it('lists messages with read state and reveals the body only on request', async () => {
    vi.spyOn(adminApi.messages, 'list').mockResolvedValue(page([message(1), message(2, { read: true })]));
    const { container } = renderAdmin(<MessagesPage />);

    expect(await screen.findByRole('heading', { name: 'Subject 1' })).toBeInTheDocument();
    expect(screen.getByText('Unread')).toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.queryByText('Body 1')).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: 'Read message: Subject 1' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(screen.getByText('Body 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide message: Subject 1' })).toHaveAttribute('aria-expanded', 'true');
    await expectNoAxeViolations(container);
  });

  it('renders visitor-supplied text as text, never as HTML', async () => {
    vi.spyOn(adminApi.messages, 'list').mockResolvedValue(page([message(1, { message: '<img src=x onerror=alert(1)> hi' })]));
    const { container } = renderAdmin(<MessagesPage />);
    await userEvent.click(await screen.findByRole('button', { name: /Read message/ }));
    expect(screen.getByText('<img src=x onerror=alert(1)> hi')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('filters to unread messages and goes back to the first page', async () => {
    const list = vi.spyOn(adminApi.messages, 'list').mockResolvedValue(page([message(1)]));
    renderAdmin(<MessagesPage />);
    await screen.findByRole('heading', { name: 'Subject 1' });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Unread only' }));

    expect(list).toHaveBeenLastCalledWith({ unreadOnly: true, page: 0, size: 20 }, expect.anything());
  });

  it('shows different empty messages for all and unread-only', async () => {
    vi.spyOn(adminApi.messages, 'list').mockResolvedValue(page([]));
    renderAdmin(<MessagesPage />);
    expect(await screen.findByText('No messages yet.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Unread only' }));
    expect(await screen.findByText('No unread messages.')).toBeInTheDocument();
  });

  it('marks a message read or unread and refreshes the list', async () => {
    const list = vi.spyOn(adminApi.messages, 'list').mockResolvedValue(page([message(1)]));
    const setRead = vi.spyOn(adminApi.messages, 'setRead').mockResolvedValue(message(1, { read: true }));
    renderAdmin(<MessagesPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Mark as read: Subject 1' }));

    expect(setRead).toHaveBeenCalledWith(1, true);
    expect(await screen.findByText('Marked as read.')).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('reports a failed update instead of pretending it worked', async () => {
    vi.spyOn(adminApi.messages, 'list').mockResolvedValue(page([message(1)]));
    vi.spyOn(adminApi.messages, 'setRead').mockRejectedValue(new ApiError(404, 'Message not found: 1'));
    renderAdmin(<MessagesPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Mark as read: Subject 1' }));
    expect(await screen.findByText(/Could not update the message: Message not found/)).toBeInTheDocument();
  });

  it('deletes only after confirmation', async () => {
    vi.spyOn(adminApi.messages, 'list').mockResolvedValue(page([message(1)]));
    const remove = vi.spyOn(adminApi.messages, 'remove').mockResolvedValue();
    renderAdmin(<MessagesPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Delete: Subject 1' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete message?' });
    expect(dialog).toHaveTextContent('Subject 1');
    expect(remove).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(remove).toHaveBeenCalledWith(1);
    expect(await screen.findByText('Message deleted.')).toBeInTheDocument();
  });

  it('paginates', async () => {
    const list = vi.spyOn(adminApi.messages, 'list').mockResolvedValue(page([message(1)], { totalPages: 3 }));
    renderAdmin(<MessagesPage />);
    await screen.findByRole('heading', { name: 'Subject 1' });
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(list).toHaveBeenLastCalledWith({ unreadOnly: false, page: 1, size: 20 }, expect.anything());
  });
});
