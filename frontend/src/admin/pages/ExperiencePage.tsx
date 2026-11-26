import { adminApi } from '../../api/admin';
import type { Experience, ExperienceType } from '../../api/types';
import { formatRange } from '../../lib/format';
import { usePageTitle } from '../../lib/usePageTitle';
import { CrudPage, type CrudConfig } from '../CrudPage';
import { blankToNull, endNotBeforeStart, text, type FieldSpec, type Values } from '../ui/formSpec';

const specs: FieldSpec[] = [
  { name: 'role', label: 'Role', kind: 'text', required: true, max: 120 },
  { name: 'company', label: 'Company or organisation', kind: 'text', required: true, max: 120 },
  { name: 'location', label: 'Location', kind: 'text', max: 120 },
  {
    name: 'type', label: 'Type', kind: 'select', required: true,
    options: [{ value: 'WORK', label: 'Work' }, { value: 'INTERNSHIP', label: 'Internship' }, { value: 'ACTIVITY', label: 'Activity' }],
  },
  { name: 'startDate', label: 'Start date', kind: 'date', required: true },
  { name: 'endDate', label: 'End date', kind: 'date', hint: 'Leave empty if this is current.' },
  { name: 'description', label: 'Description', kind: 'textarea', rows: 5, max: 5000, hint: 'Plain text. Leave a blank line between paragraphs.' },
];

const toRequest = (v: Values) => ({
  role: text(v, 'role').trim(),
  company: text(v, 'company').trim(),
  location: blankToNull(text(v, 'location')),
  type: text(v, 'type') as ExperienceType,
  startDate: text(v, 'startDate'),
  endDate: blankToNull(text(v, 'endDate')),
  description: text(v, 'description').trim(),
});

const config: CrudConfig<Experience> = {
  title: 'Experience',
  singular: 'Experience',
  description: 'Work, internships and relevant activities, newest first on the site.',
  idPrefix: 'experience',
  specs,
  columns: [
    { header: 'Role', cell: (e) => <span className="font-medium">{e.role}</span> },
    { header: 'Organisation', cell: (e) => e.company },
    { header: 'Period', cell: (e) => formatRange(e.startDate, e.endDate, e.current) },
  ],
  load: (signal) => adminApi.experience.list(signal),
  create: (v) => adminApi.experience.create(toRequest(v)),
  update: (id, v) => adminApi.experience.update(id, toRequest(v)),
  remove: (id) => adminApi.experience.remove(id),
  toForm: (e) => ({
    role: e?.role ?? '', company: e?.company ?? '', location: e?.location ?? '', type: e?.type ?? 'WORK',
    startDate: e?.startDate ?? '', endDate: e?.endDate ?? '', description: e?.description ?? '',
  }),
  crossValidate: (v) => endNotBeforeStart(v),
  label: (e) => `${e.role} at ${e.company}`,
  emptyMessage: 'No experience yet. Until you add some, this section stays hidden on the public site.',
};

export function ExperiencePage() {
  usePageTitle('Experience');
  return <CrudPage config={config} />;
}
