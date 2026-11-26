import { adminApi } from '../../api/admin';
import type { Skill, SkillCategory } from '../../api/types';
import { SKILL_GROUPS } from '../../lib/skillGroups';
import { usePageTitle } from '../../lib/usePageTitle';
import { CrudPage, type CrudConfig } from '../CrudPage';
import { text, type FieldSpec, type Values } from '../ui/formSpec';

const specs: FieldSpec[] = [
  { name: 'name', label: 'Name', kind: 'text', required: true, max: 60 },
  { name: 'category', label: 'Group', kind: 'select', required: true, options: SKILL_GROUPS.map((g) => ({ value: g.id, label: g.label })) },
  { name: 'level', label: 'Proficiency (1–5)', kind: 'number', min: 1, max: 5, hint: 'Optional. The public site shows grouped skills, not levels.' },
  { name: 'displayOrder', label: 'Display order', kind: 'number', required: true, min: 0, max: 9999, hint: 'Lower numbers appear first within their group.' },
];

const toRequest = (v: Values) => ({
  name: text(v, 'name').trim(),
  category: text(v, 'category') as SkillCategory,
  level: text(v, 'level').trim() === '' ? null : Number(text(v, 'level')),
  displayOrder: Number(text(v, 'displayOrder')),
});

const config: CrudConfig<Skill> = {
  title: 'Skills',
  singular: 'Skill',
  description: 'Shown on the public site as grouped cards.',
  idPrefix: 'skill',
  specs,
  columns: [
    { header: 'Name', cell: (s) => <span className="font-medium">{s.name}</span> },
    { header: 'Group', cell: (s) => SKILL_GROUPS.find((g) => g.id === s.category)?.label ?? s.category },
    { header: 'Order', cell: (s) => s.displayOrder },
  ],
  load: (signal) => adminApi.skills.list(signal),
  create: (v) => adminApi.skills.create(toRequest(v)),
  update: (id, v) => adminApi.skills.update(id, toRequest(v)),
  remove: (id) => adminApi.skills.remove(id),
  toForm: (s) => ({ name: s?.name ?? '', category: s?.category ?? 'LANGUAGES', level: s?.level == null ? '' : String(s.level), displayOrder: String(s?.displayOrder ?? 0) }),
  label: (s) => s.name,
  emptyMessage: 'No skills yet. Add your first one.',
};

export function SkillsPage() {
  usePageTitle('Skills');
  return <CrudPage config={config} />;
}
