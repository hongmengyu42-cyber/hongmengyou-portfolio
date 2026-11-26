import { adminApi } from '../../api/admin';
import type { Certification, Education } from '../../api/types';
import { formatMonthYear, formatRange } from '../../lib/format';
import { usePageTitle } from '../../lib/usePageTitle';
import { CrudPage, type CrudConfig } from '../CrudPage';
import { blankToNull, endNotBeforeStart, text, type FieldSpec, type Values } from '../ui/formSpec';

const educationSpecs: FieldSpec[] = [
  { name: 'degree', label: 'Degree or programme', kind: 'text', required: true, max: 150 },
  { name: 'institution', label: 'Institution', kind: 'text', required: true, max: 150 },
  { name: 'fieldOfStudy', label: 'Field of study', kind: 'text', max: 150 },
  { name: 'startDate', label: 'Start date', kind: 'date', required: true },
  { name: 'endDate', label: 'End date', kind: 'date', hint: 'Leave empty if you are still studying.' },
  { name: 'description', label: 'Description', kind: 'textarea', rows: 4, max: 5000 },
];

const certificationSpecs: FieldSpec[] = [
  { name: 'name', label: 'Certification name', kind: 'text', required: true, max: 150 },
  { name: 'issuer', label: 'Issuer', kind: 'text', required: true, max: 120 },
  { name: 'issuedOn', label: 'Date issued', kind: 'date', required: true },
  { name: 'credentialUrl', label: 'Credential link', kind: 'url', hint: 'Optional. Must start with http:// or https://.' },
];

const educationConfig: CrudConfig<Education> = {
  title: 'Education',
  singular: 'Education',
  idPrefix: 'education',
  specs: educationSpecs,
  columns: [
    { header: 'Degree', cell: (e) => <span className="font-medium">{e.degree}</span> },
    { header: 'Institution', cell: (e) => e.institution },
    { header: 'Period', cell: (e) => formatRange(e.startDate, e.endDate, !e.endDate) },
  ],
  load: (signal) => adminApi.education.list(signal),
  create: (v: Values) => adminApi.education.create(toEducation(v)),
  update: (id, v) => adminApi.education.update(id, toEducation(v)),
  remove: (id) => adminApi.education.remove(id),
  toForm: (e) => ({
    degree: e?.degree ?? '', institution: e?.institution ?? '', fieldOfStudy: e?.fieldOfStudy ?? '',
    startDate: e?.startDate ?? '', endDate: e?.endDate ?? '', description: e?.description ?? '',
  }),
  crossValidate: (v) => endNotBeforeStart(v),
  label: (e) => `${e.degree}, ${e.institution}`,
  emptyMessage: 'No education entries yet.',
};

function toEducation(v: Values) {
  return {
    degree: text(v, 'degree').trim(), institution: text(v, 'institution').trim(),
    fieldOfStudy: blankToNull(text(v, 'fieldOfStudy')), startDate: text(v, 'startDate'),
    endDate: blankToNull(text(v, 'endDate')), description: text(v, 'description').trim(),
  };
}

const certificationConfig: CrudConfig<Certification> = {
  title: 'Certifications',
  singular: 'Certification',
  idPrefix: 'certification',
  specs: certificationSpecs,
  columns: [
    { header: 'Name', cell: (c) => <span className="font-medium">{c.name}</span> },
    { header: 'Issuer', cell: (c) => c.issuer },
    { header: 'Issued', cell: (c) => formatMonthYear(c.issuedOn) },
  ],
  load: (signal) => adminApi.certifications.list(signal),
  create: (v) => adminApi.certifications.create(toCertification(v)),
  update: (id, v) => adminApi.certifications.update(id, toCertification(v)),
  remove: (id) => adminApi.certifications.remove(id),
  toForm: (c) => ({ name: c?.name ?? '', issuer: c?.issuer ?? '', issuedOn: c?.issuedOn ?? '', credentialUrl: c?.credentialUrl ?? '' }),
  label: (c) => c.name,
  emptyMessage: 'No certifications yet.',
};

function toCertification(v: Values) {
  return {
    name: text(v, 'name').trim(), issuer: text(v, 'issuer').trim(), issuedOn: text(v, 'issuedOn'),
    credentialUrl: blankToNull(text(v, 'credentialUrl')),
  };
}

export function EducationPage() {
  usePageTitle('Education');
  return (
    <div className="space-y-14">
      <CrudPage config={educationConfig} level={1} />
      <CrudPage config={certificationConfig} level={2} />
    </div>
  );
}
