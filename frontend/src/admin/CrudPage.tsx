import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useApi } from '../api/useApi';
import { AsyncState } from '../components/ui/AsyncState';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { DataTable, type Column } from './ui/DataTable';
import type { Errors, FieldSpec, Values } from './ui/formSpec';
import { useNotify } from './ui/Notifications';
import { ResourceForm } from './ui/ResourceForm';

export interface CrudConfig<E extends { id: number }> {
  title: string;
  singular: string;
  description?: string;
  idPrefix: string;
  specs: FieldSpec[];
  columns: Column<E>[];
  load: (signal: AbortSignal) => Promise<E[]>;
  create: (values: Values) => Promise<unknown>;
  update: (id: number, values: Values) => Promise<unknown>;
  remove: (id: number) => Promise<void>;
  toForm: (entity: E | null) => Values;
  crossValidate?: (values: Values) => Errors;
  /** Short name used in the delete confirmation and the row button labels. */
  label: (entity: E) => string;
  emptyMessage: string;
}

/**
 * One list + editor + delete-confirmation screen, configured per resource. Skills, experience, education and
 * certifications all use it, so loading, error, empty, validation and confirmation behave identically everywhere.
 */
export function CrudPage<E extends { id: number }>({ config, level = 1 }: { config: CrudConfig<E>; level?: 1 | 2 }) {
  const list = useApi(config.load);
  const notify = useNotify();
  const [editing, setEditing] = useState<E | 'new' | null>(null);
  const [deleting, setDeleting] = useState<E | null>(null);
  const editorHeading = useRef<HTMLHeadingElement>(null);
  const Heading = level === 1 ? 'h1' : 'h2';
  const SubHeading = level === 1 ? 'h2' : 'h3';

  useEffect(() => {
    if (editing) editorHeading.current?.focus(); // move keyboard focus into the editor when it opens
  }, [editing]);

  const rows = list.data ?? [];
  const columns: Column<E>[] = [
    ...config.columns,
    {
      header: 'Actions',
      hideHeader: true,
      cell: (entity) => (
        <div className="flex gap-2">
          <Button variant="secondary" className="!min-h-9 !px-3" onClick={() => setEditing(entity)} aria-label={`Edit ${config.label(entity)}`}>
            <Icon name="edit" size={16} /> Edit
          </Button>
          <Button variant="secondary" className="!min-h-9 !px-3" onClick={() => setDeleting(entity)} aria-label={`Delete ${config.label(entity)}`}>
            <Icon name="trash" size={16} /> Delete
          </Button>
        </div>
      ),
    },
  ];

  async function save(values: Values) {
    if (editing === 'new') await config.create(values);
    else if (editing) await config.update(editing.id, values);
    notify(`${config.singular} saved.`);
    setEditing(null);
    list.reload();
  }

  async function confirmDelete() {
    if (!deleting) return;
    await config.remove(deleting.id);
    notify(`${config.singular} deleted.`);
    setDeleting(null);
    list.reload();
  }

  let panel: ReactNode = null;
  if (editing) {
    panel = (
      <section aria-labelledby={`${config.idPrefix}-editor`} className="card mb-8 p-6">
        <SubHeading id={`${config.idPrefix}-editor`} ref={editorHeading} tabIndex={-1} className="mb-5 text-xl font-semibold outline-none">
          {editing === 'new' ? `New ${config.singular.toLowerCase()}` : `Edit ${config.label(editing)}`}
        </SubHeading>
        <ResourceForm
          key={editing === 'new' ? 'new' : editing.id}
          idPrefix={config.idPrefix}
          specs={config.specs}
          initial={config.toForm(editing === 'new' ? null : editing)}
          submitLabel={`Save ${config.singular.toLowerCase()}`}
          onSubmit={save}
          onCancel={() => setEditing(null)}
          crossValidate={config.crossValidate}
        />
      </section>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Heading className="text-3xl font-semibold">{config.title}</Heading>
          {config.description ? <p className="mt-1 text-muted">{config.description}</p> : null}
        </div>
        <Button onClick={() => setEditing('new')}>
          <Icon name="plus" size={18} /> Add {config.singular.toLowerCase()}
        </Button>
      </div>

      {panel}

      <AsyncState
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        label={config.title.toLowerCase()}
        skeleton={<Skeleton className="h-40" />}
        isEmpty={rows.length === 0}
        empty={<p className="card p-6 text-muted">{config.emptyMessage}</p>}
      >
        <DataTable caption={config.title} columns={columns} rows={rows} rowKey={(entity) => entity.id} />
      </AsyncState>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${config.singular.toLowerCase()}?`}
        message={deleting ? `“${config.label(deleting)}” will be permanently removed from your site. This cannot be undone.` : ''}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
