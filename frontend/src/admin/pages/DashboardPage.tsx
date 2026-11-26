import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import type { LinkStatus } from '../../api/adminTypes';
import { ApiError } from '../../api/client';
import { useApi } from '../../api/useApi';
import { AsyncState } from '../../components/ui/AsyncState';
import { Button } from '../../components/ui/Button';
import { buttonClasses } from '../../components/ui/buttonStyles';
import { Icon } from '../../components/ui/Icon';
import { Skeleton } from '../../components/ui/Skeleton';
import { usePageTitle } from '../../lib/usePageTitle';
import { useAdminShell } from '../AdminLayout';
import { useNotify } from '../ui/Notifications';

function Stat({ label, value, detail, to }: { label: string; value: string; detail?: string; to?: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
      {detail ? <p className="mt-1 text-sm text-muted">{detail}</p> : null}
      {to ? (
        <Link to={to} className="mt-3 inline-block text-sm font-medium text-accent-text underline-offset-4 hover:underline">
          Open{' '}
          <span className="sr-only">{label}</span>
        </Link>
      ) : null}
    </div>
  );
}

export function DashboardPage() {
  usePageTitle('Dashboard');
  const notify = useNotify();
  const { unread } = useAdminShell();
  const projects = useApi((signal) => adminApi.projects.list(0, 100, signal));
  const [checking, setChecking] = useState(false);

  const items = projects.data?.content ?? [];
  const count = (status: LinkStatus) => items.filter((project) => project.linkStatus === status).length;

  async function checkAll() {
    setChecking(true);
    try {
      await adminApi.projects.checkAllLinks();
      notify('All live links checked.');
      projects.reload();
    } catch (error) {
      notify(`Link check failed: ${error instanceof ApiError ? error.message : 'try again'}`, 'error');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Dashboard</h1>

      <AsyncState loading={projects.loading} error={projects.error} onRetry={projects.reload} label="dashboard" skeleton={<Skeleton className="h-32" />}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Projects" value={String(items.length)} detail={`${items.filter((p) => p.published).length} published`} to="/admin/projects" />
          <Stat label="Unread messages" value={unread === null ? '–' : String(unread)} to="/admin/messages" />
          <Stat
            label="Live links"
            value={`${count('OK')} OK`}
            detail={`${count('BROKEN')} broken · ${count('BLOCKED')} blocked · ${count('UNKNOWN')} not checked`}
          />
        </div>
      </AsyncState>

      <section aria-labelledby="quick-heading" className="card p-6">
        <h2 id="quick-heading" className="mb-4 text-xl font-semibold">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/projects/new" className={buttonClasses('primary')}>
            <Icon name="plus" size={18} /> New project
          </Link>
          <Button variant="secondary" onClick={checkAll} disabled={checking}>
            <Icon name="refresh" size={18} /> {checking ? 'Checking links…' : 'Check all links'}
          </Button>
          <Link to="/admin/profile" className={buttonClasses('secondary')}>
            Edit profile
          </Link>
        </div>
      </section>
    </div>
  );
}
