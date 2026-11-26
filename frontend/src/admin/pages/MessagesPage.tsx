import { useState } from 'react';
import { adminApi } from '../../api/admin';
import type { AdminContactMessage } from '../../api/adminTypes';
import { ApiError } from '../../api/client';
import { useApi } from '../../api/useApi';
import { AsyncState } from '../../components/ui/AsyncState';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDateTime } from '../../lib/format';
import { usePageTitle } from '../../lib/usePageTitle';
import { useAdminShell } from '../AdminLayout';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useNotify } from '../ui/Notifications';

const PAGE_SIZE = 20;

export function MessagesPage() {
  usePageTitle('Messages');
  const notify = useNotify();
  const { refreshUnread } = useAdminShell();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<AdminContactMessage | null>(null);
  const list = useApi((signal) => adminApi.messages.list({ unreadOnly, page, size: PAGE_SIZE }, signal), [unreadOnly, page]);

  const messages = list.data?.content ?? [];
  const totalPages = list.data?.totalPages ?? 0;

  async function toggleRead(item: AdminContactMessage) {
    try {
      await adminApi.messages.setRead(item.id, !item.read);
      notify(item.read ? 'Marked as unread.' : 'Marked as read.');
      list.reload();
      refreshUnread();
    } catch (error) {
      notify(`Could not update the message: ${error instanceof ApiError ? error.message : 'try again'}`, 'error');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    await adminApi.messages.remove(deleting.id);
    notify('Message deleted.');
    setDeleting(null);
    if (messages.length === 1 && page > 0) setPage(page - 1); // do not strand the user on an empty page
    else list.reload();
    refreshUnread();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Messages</h1>
          <p className="mt-1 text-muted">Sent through the contact form on your site.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="unread-only"
            type="checkbox"
            checked={unreadOnly}
            onChange={(event) => {
              setUnreadOnly(event.target.checked);
              setPage(0);
            }}
            className="h-5 w-5 accent-accent"
          />
          <label htmlFor="unread-only" className="text-sm font-medium">
            Unread only
          </label>
        </div>
      </div>

      <AsyncState
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        label="messages"
        skeleton={<Skeleton className="h-40" />}
        isEmpty={messages.length === 0}
        empty={<p className="card p-6 text-muted">{unreadOnly ? 'No unread messages.' : 'No messages yet.'}</p>}
      >
        <ul className="space-y-4">
          {messages.map((item) => {
            const open = openId === item.id;
            return (
              <li key={item.id}>
                <article className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold">{item.subject}</h2>
                      <p className="text-sm text-muted">
                        {item.name} ·{' '}
                        <a href={`mailto:${item.email}`} className="text-accent-text underline-offset-4 hover:underline">
                          {item.email}
                        </a>{' '}
                        · {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                    <Badge tone={item.read ? 'outline' : 'accent'}>{item.read ? 'Read' : 'Unread'}</Badge>
                  </div>

                  {open ? <p className="mt-4 whitespace-pre-wrap rounded-control bg-surface-2 p-4">{item.message}</p> : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="secondary" className="!min-h-9 !px-3" aria-expanded={open} onClick={() => setOpenId(open ? null : item.id)}>
                      {open ? 'Hide message' : 'Read message'}
                      <span className="sr-only">: {item.subject}</span>
                    </Button>
                    <Button variant="secondary" className="!min-h-9 !px-3" onClick={() => toggleRead(item)}>
                      {item.read ? 'Mark as unread' : 'Mark as read'}
                      <span className="sr-only">: {item.subject}</span>
                    </Button>
                    <Button variant="secondary" className="!min-h-9 !px-3" onClick={() => setDeleting(item)}>
                      Delete<span className="sr-only">: {item.subject}</span>
                    </Button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        {totalPages > 1 ? (
          <nav aria-label="Message pages" className="mt-6 flex items-center justify-between">
            <Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted">
              Page {page + 1} of {totalPages}
            </span>
            <Button variant="secondary" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </nav>
        ) : null}
      </AsyncState>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete message?"
        message={deleting ? `The message “${deleting.subject}” from ${deleting.name} will be permanently deleted.` : ''}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
