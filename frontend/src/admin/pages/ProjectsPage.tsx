import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import type { AdminProjectListItem, LinkCheckResult } from '../../api/adminTypes';
import { ApiError } from '../../api/client';
import { useApi } from '../../api/useApi';
import { AsyncState } from '../../components/ui/AsyncState';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { buttonClasses } from '../../components/ui/buttonStyles';
import { Icon } from '../../components/ui/Icon';
import { Skeleton } from '../../components/ui/Skeleton';
import { CATEGORY_LABELS, STATUS_LABELS } from '../../lib/format';
import { usePageTitle } from '../../lib/usePageTitle';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { DataTable, type Column } from '../ui/DataTable';
import { LinkStatusBadge } from '../ui/LinkStatusBadge';
import { useNotify } from '../ui/Notifications';

const message = (error: unknown) => (error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');

export function ProjectsPage() {
  usePageTitle('Projects');
  const notify = useNotify();
  const list = useApi((signal) => adminApi.projects.list(0, 100, signal));
  const [items, setItems] = useState<AdminProjectListItem[]>([]);
  const [deleting, setDeleting] = useState<AdminProjectListItem | null>(null);
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<LinkCheckResult[] | null>(null);

  useEffect(() => {
    if (list.data) setItems(list.data.content);
  }, [list.data]);

  // Reordering sends the complete id list, so it is only offered when every project is on this page.
  const canReorder = (list.data?.totalElements ?? 0) <= items.length;

  async function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    const current = items[index];
    const other = items[target];
    if (!current || !other) return;
    const previous = items;
    const next = [...items];
    next[index] = other;
    next[target] = current;
    setItems(next); // optimistic: the row moves immediately
    try {
      await adminApi.projects.reorder(next.map((project) => project.id));
      notify(`Moved “${current.name}” to position ${target + 1}.`);
    } catch (error) {
      setItems(previous); // roll back so the screen never disagrees with the server
      notify(`Could not reorder: ${message(error)}`, 'error');
    }
  }

  async function checkAll() {
    setChecking(true);
    try {
      setResults(await adminApi.projects.checkAllLinks());
      list.reload();
    } catch (error) {
      notify(`Link check failed: ${message(error)}`, 'error');
    } finally {
      setChecking(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    await adminApi.projects.remove(deleting.id);
    notify(`Deleted “${deleting.name}”.`);
    setDeleting(null);
    list.reload();
  }

  const columns: Column<AdminProjectListItem>[] = [
    {
      header: 'Preview',
      cell: (p) =>
        p.thumbnailUrl ? (
          <img src={p.thumbnailUrl} alt="" width={64} height={40} loading="lazy" className="h-10 w-16 rounded-control border border-line object-cover" />
        ) : (
          <span className="grid h-10 w-16 place-items-center rounded-control bg-surface-2 text-muted">
            <Icon name="image" size={18} />
          </span>
        ),
    },
    {
      header: 'Project',
      cell: (p) => (
        <div>
          <Link to={`/admin/projects/${p.id}`} className="font-medium text-accent-text underline-offset-4 hover:underline">
            {p.name}
          </Link>
          <p className="text-xs text-muted">/{p.slug}</p>
        </div>
      ),
    },
    {
      header: 'Details',
      cell: (p) => (
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={p.published ? 'accent' : 'outline'}>{p.published ? 'Published' : 'Draft'}</Badge>
          {p.featured ? <Badge tone="neutral">Featured</Badge> : null}
          <Badge tone="neutral">{STATUS_LABELS[p.status] ?? p.status}</Badge>
          <Badge tone="neutral">{CATEGORY_LABELS[p.category] ?? p.category}</Badge>
        </div>
      ),
    },
    { header: 'Live link', cell: (p) => <LinkStatusBadge status={p.linkStatus} checkedAt={p.linkCheckedAt} /> },
    {
      header: 'Order',
      cell: (p) => {
        const index = items.findIndex((item) => item.id === p.id);
        return (
          <div className="flex gap-1">
            <Button variant="secondary" className="!min-h-9 !px-2.5" disabled={!canReorder || index === 0} onClick={() => move(index, -1)} aria-label={`Move ${p.name} up`}>
              <Icon name="arrow-up" size={16} />
            </Button>
            <Button variant="secondary" className="!min-h-9 !px-2.5" disabled={!canReorder || index === items.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${p.name} down`}>
              <Icon name="arrow-down" size={16} />
            </Button>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      hideHeader: true,
      cell: (p) => (
        <div className="flex gap-2">
          <Link to={`/admin/projects/${p.id}`} className={buttonClasses('secondary', '!min-h-9 !px-3')} aria-label={`Edit ${p.name}`}>
            <Icon name="edit" size={16} /> Edit
          </Link>
          <Button variant="secondary" className="!min-h-9 !px-3" onClick={() => setDeleting(p)} aria-label={`Delete ${p.name}`}>
            <Icon name="trash" size={16} /> Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Projects</h1>
          <p className="mt-1 text-muted">Drafts are hidden from the public site. Use the arrows to change the order.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={checkAll} disabled={checking}>
            <Icon name="refresh" size={18} /> {checking ? 'Checking links…' : 'Check all links'}
          </Button>
          <Link to="/admin/projects/new" className={buttonClasses('primary')}>
            <Icon name="plus" size={18} /> New project
          </Link>
        </div>
      </div>

      {results ? (
        <section aria-labelledby="link-results" className="card mb-8 p-6">
          <h2 id="link-results" className="mb-3 text-lg font-semibold">
            Link check results
          </h2>
          {results.length === 0 ? (
            <p className="text-muted">No projects have a live URL to check.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {results.map((result) => (
                <li key={result.projectId} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-medium">{result.projectName}</span>
                  <LinkStatusBadge status={result.status} checkedAt={result.checkedAt} />
                  {result.note ? <span className="text-muted">{result.note}</span> : null}
                </li>
              ))}
            </ul>
          )}
          <Button variant="ghost" className="mt-3" onClick={() => setResults(null)}>
            Dismiss results
          </Button>
        </section>
      ) : null}

      {!canReorder ? <p className="mb-4 text-sm text-muted">Reordering is disabled because there are more than 100 projects.</p> : null}

      <AsyncState
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        label="projects"
        skeleton={<Skeleton className="h-48" />}
        isEmpty={items.length === 0}
        empty={<p className="card p-6 text-muted">No projects yet. Create your first one.</p>}
      >
        <DataTable caption="Projects" columns={columns} rows={items} rowKey={(p) => p.id} />
      </AsyncState>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete project?"
        message={deleting ? `“${deleting.name}” and all of its screenshots will be permanently removed. This cannot be undone.` : ''}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
