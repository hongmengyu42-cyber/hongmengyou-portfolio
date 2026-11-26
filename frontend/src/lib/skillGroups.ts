import type { Skill, SkillCategory } from '../api/types';

/** Fixed display order and labels for the five skill groups. */
export const SKILL_GROUPS: ReadonlyArray<{ id: SkillCategory; label: string }> = [
  { id: 'LANGUAGES', label: 'Languages' },
  { id: 'BACKEND', label: 'Backend' },
  { id: 'FRONTEND', label: 'Frontend' },
  { id: 'DATABASES', label: 'Databases' },
  { id: 'DEVOPS', label: 'DevOps' },
];

export interface SkillGroup {
  id: SkillCategory;
  label: string;
  skills: Skill[];
}

/** Groups skills for display. Empty groups are dropped so the page never shows an empty card. */
export function groupSkills(skills: readonly Skill[]): SkillGroup[] {
  return SKILL_GROUPS.map(({ id, label }) => ({
    id,
    label,
    skills: skills
      .filter((skill) => skill.category === id)
      .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)),
  })).filter((group) => group.skills.length > 0);
}
