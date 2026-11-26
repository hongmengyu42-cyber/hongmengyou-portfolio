import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import type { AdminProjectDetail, ProjectRequest } from '../../api/adminTypes';
import { ApiError } from '../../api/client';
import type { ProjectCategory, ProjectStatus } from '../../api/types';
import { useApi } from '../../api/useApi';
import { AsyncState } from '../../components/ui/AsyncState';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Skeleton } from '../../components/ui/Skeleton';
import { CATEGORY_LABELS, STATUS_LABELS } from '../../lib/format';
import { usePageTitle } from '../../lib/usePageTitle';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { ImageManager } from '../ImageManager';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { blankToNull, flag, text, type Errors, type FieldSpec, type Values } from '../ui/formSpec';
import { LinkStatusBadge } from '../ui/LinkStatusBadge';
import { useNotify } from '../ui/Notifications';
import { ResourceForm } from '../ui/ResourceForm';

const options = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));

const specs: FieldSpec[] = [
  { name: 'name', label: 'Name', kind: 'text', required: true, max: 120 },
  { name: 'slug', label: 'URL slug', kind: 'text', max: 140, hint: 'Lowercase letters, digits and hyphens. Leave empty to generate it from the name (or keep the current one).' },
  { name: 'summary', label: 'Short summary', kind: 'text', required: true, max: 300, hint: 'Shown on the project card.' },
  { name: 'description', label: 'Full description', kind: 'textarea', rows: 8, required: true, max: 20000, hint: 'Plain text. Leave a blank line between paragraphs.' },
  { name: 'problem', label: 'The problem', kind: 'textarea', rows: 3, max: 5000 },
  { name: 'solution', label: 'The solution', kind: 'textarea', rows: 3, max: 5000 },
  { name: 'keyFeatures', label: 'Key features', kind: 'textarea', rows: 4, hint: 'One feature per line (up to 20, each up to 200 characters).' },
  { name: 'technologies', label: 'Technologies', kind: 'text', hint: 'Comma-separated, e.g. Java, Spring Boot, PostgreSQL (up to 30).' },
  { name: 'category', label: 'Category', kind: 'select', required: true, options: options(CATEGORY_LABELS) },
  { name: 'status', label: 'Status', kind: 'select', required: true, options: options(STATUS_LABELS) },
  { name: 'liveUrl', label: 'Live demo URL', kind: 'url', hint: 'The deployed site. Opens in a new tab. Must start with http:// or https://.' },
  { name: 'githubUrl', label: 'Source code URL', kind: 'url', hint: 'Optional. The “Source Code” button only appears when this is set.' },
  { name: 'featured', label: 'Featured', kind: 'checkbox', hint: 'Shown as a large card at the top of the grid.' },
  { name: 'published', label: 'Published', kind: 'checkbox', hint: 'Unpublished projects are hidden from the public site.' },
];

const splitLines = (value: string) => value.split('\n').map((line) => line.trim()).filter(Boolean);
const splitComma = (value: string) => value.split(',').map((part) => part.trim()).filter(Boolean);

export function toForm(project: AdminProjectDetail | null): Values {
  return {
    name: project?.name ?? '', slug: project?.slug ?? '', summary: project?.summary ?? '', description: project?.description ?? '',
    problem: project?.problem ?? '', solution: project?.solution ?? '', keyFeatures: (project?.keyFeatures ?? []).join('\n'),
    technologies: (project?.technologies ?? []).join(', '),
    category: project?.category ?? 'WEB_APP', status: project?.status ?? 'IN_DEVELOPMENT',
    liveUrl: project?.liveUrl ?? '', githubUrl: project?.githubUrl ?? '',
    featured: project?.featured ?? false, published: project?.published ?? false,
  };
}

export function toRequest(v: Values): ProjectRequest {
  return {
    name: text(v, 'name').trim(), slug: blankToNull(text(v, 'slug')), summary: text(v, 'summary').trim(),
    description: text(v, 'description').trim(), problem: blankToNull(text(v, 'problem')), solution: blankToNull(text(v, 'solution')),
    keyFeatures: splitLines(text(v, 'keyFeatures')), category: text(v, 'category') as ProjectCategory,
    status: text(v, 'status') as ProjectStatus, liveUrl: blankToNull(text(v, 'liveUrl')), githubUrl: blankToNull(text(v, 'githubUrl')),
    featured: flag(v, 'featured'), published: flag(v, 'published'), technologies: splitComma(text(v, 'technologies')),
  };
}

export function crossValidate(v: Values): Errors {
  const errors: Errors = {};
  const features = splitLines(text(v, 'keyFeatures'));
  if (features.length > 20) errors.keyFeatures = 'Add at most 20 key features.';
  else if (features.some((feature) => feature.length > 200)) errors.keyFeatures = 'Each feature must be 200 characters or fewer.';
  const tags = splitComma(text(v, 'technologies'));
  if (tags.length > 30) errors.technologies = 'Add at most 30 technologies.';
  else if (tags.some((tag) => tag.length > 50)) errors.technologies = 'Each technology must be 50 characters or fewer.';
  const slug = text(v, 'slug').trim();
  if (slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errors.slug = 'Use lowercase letters, digits and single hyphens only.';
  return errors;
}

export function ProjectEditPage() {
  const { id } = useParams();
  const isNew = id === undefined;
  const projectId = Number(id);
  usePageTitle(isNew ? 'New project' : 'Edit project');
  const navigate = useNavigate();
  const notify = useNotify();
  const detail = useApi((signal) => (isNew ? Promise.resolve(null) : adminApi.projects.get(projectId, signal)), [id]);
  const [deleting, setDeleting] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!isNew && !Number.isInteger(projectId)) return <NotFoundPage what="project" />;
  if (detail.error?.isNotFound) return <NotFoundPage what="project" />;

  const project = detail.data;

  async function save(values: Values) {
    const request = toRequest(values);
    if (isNew) {
      const created = await adminApi.projects.create(request);
      notify('Project created. Now add screenshots.');
      navigate(`/admin/projects/${created.id}`);
    } else {
      await adminApi.projects.update(projectId, request);
      notify('Project saved.');
      detail.reload();
    }
  }

  async function checkLink() {
    setChecking(true);
    try {
      const result = await adminApi.projects.checkLink(projectId);
      notify(`Link check: ${result.note ?? result.status}.`, result.status === 'OK' ? 'success' : 'error');
      detail.reload();
    } catch (error) {
      notify(`Link check failed: ${error instanceof ApiError ? error.message : 'try again'}`, 'error');
    } finally {
      setChecking(false);
    }
  }

  async function confirmDelete() {
    await adminApi.projects.remove(projectId);
    notify('Project deleted.');
    navigate('/admin/projects', { replace: true });
  }

  return (
    <div className="space-y-8">
      <div>
        <button type="button" onClick={() => navigate('/admin/projects')} className="mb-3 inline-flex min-h-11 items-center gap-2 font-medium text-accent-text underline-offset-4 hover:underline">
          <Icon name="arrow-left" size={18} /> All projects
        </button>
        <h1 className="text-3xl font-semibold">{isNew ? 'New project' : (project?.name ?? 'Edit project')}</h1>
      </div>

      <AsyncState loading={!isNew && detail.loading} error={detail.error} onRetry={detail.reload} label="project" skeleton={<Skeleton className="h-96" />}>
        <section aria-labelledby="details-heading" className="card p-6">
          <h2 id="details-heading" className="mb-5 text-xl font-semibold">
            Details
          </h2>
          <ResourceForm
            key={project?.updatedAt ?? 'new'}
            idPrefix="project"
            specs={specs}
            initial={toForm(project)}
            submitLabel={isNew ? 'Create project' : 'Save changes'}
            onSubmit={save}
            crossValidate={crossValidate}
          />
        </section>

        {project ? (
          <>
            <section aria-labelledby="link-heading" className="card flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <h2 id="link-heading" className="mb-2 text-xl font-semibold">
                  Live link
                </h2>
                <LinkStatusBadge status={project.linkStatus} checkedAt={project.linkCheckedAt} />
              </div>
              <Button variant="secondary" onClick={checkLink} disabled={checking || !project.liveUrl}>
                <Icon name="refresh" size={18} /> {checking ? 'Checking…' : 'Check link now'}
              </Button>
            </section>

            <ImageManager key={project.id} projectId={project.id} initialImages={project.images} />

            <section aria-labelledby="danger-heading" className="card p-6">
              <h2 id="danger-heading" className="mb-2 text-xl font-semibold">
                Delete project
              </h2>
              <p className="mb-4 text-muted">Permanently removes this project and its screenshots.</p>
              <Button variant="secondary" onClick={() => setDeleting(true)}>
                <Icon name="trash" size={18} /> Delete this project
              </Button>
            </section>
          </>
        ) : null}
      </AsyncState>

      <ConfirmDialog
        open={deleting}
        title="Delete project?"
        message={project ? `“${project.name}” and all of its screenshots will be permanently removed. This cannot be undone.` : ''}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(false)}
      />
    </div>
  );
}
