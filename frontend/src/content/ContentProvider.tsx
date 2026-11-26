import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { api } from '../api/client';
import type { Certification, Education, Experience, Profile, Skill } from '../api/types';
import { useApi, type ApiState } from '../api/useApi';
import { SHOW_PLACEHOLDERS } from '../lib/env';

interface Content {
  profile: ApiState<Profile>;
  skills: ApiState<Skill[]>;
  experience: ApiState<Experience[]>;
  education: ApiState<Education[]>;
  certifications: ApiState<Certification[]>;
}

const ContentContext = createContext<Content | null>(null);

/** Loads the shared page content once so the header, hero, sections and footer all read the same data. */
export function ContentProvider({ children }: { children: ReactNode }) {
  const profile = useApi((signal) => api.profile(signal));
  const skills = useApi((signal) => api.skills(signal));
  const experience = useApi((signal) => api.experience(signal));
  const education = useApi((signal) => api.education(signal));
  const certifications = useApi((signal) => api.certifications(signal));
  const value = useMemo(
    () => ({ profile, skills, experience, education, certifications }),
    [profile, skills, experience, education, certifications],
  );
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): Content {
  const context = useContext(ContentContext);
  if (!context) throw new Error('useContent must be used inside <ContentProvider>');
  return context;
}

export interface SectionLink {
  id: string;
  label: string;
}

/**
 * A list section appears when it has data OR when its request failed (so the error is shown, never hidden).
 * Empty and still-loading optional sections stay out of the page and the navigation.
 */
function listSectionVisible(state: ApiState<unknown[]>): boolean {
  return state.error !== null || (state.data !== null && state.data.length > 0);
}

export function hasAboutContent(profile: Profile | null): boolean {
  return !!profile && [profile.background, profile.careerGoals, profile.professionalSummary].some((text) => text.trim() !== '');
}

/** Single source of truth for which sections exist, shared by the page body and the navigation. */
export function useVisibleSections(): SectionLink[] {
  const { profile, experience, education, certifications } = useContent();
  const sections: SectionLink[] = [];
  if (hasAboutContent(profile.data) || (SHOW_PLACEHOLDERS && profile.data)) sections.push({ id: 'about', label: 'About' });
  sections.push({ id: 'skills', label: 'Skills' });
  sections.push({ id: 'projects', label: 'Projects' });
  if (listSectionVisible(experience)) sections.push({ id: 'experience', label: 'Experience' });
  if (listSectionVisible(education) || listSectionVisible(certifications)) sections.push({ id: 'education', label: 'Education' });
  sections.push({ id: 'contact', label: 'Contact' });
  return sections;
}
