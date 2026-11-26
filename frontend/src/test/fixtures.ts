// Test-only data. Obviously fake on purpose; none of this ships in the production bundle.
import type { Certification, Education, Experience, Profile, ProjectDetail, ProjectSummary, Skill } from '../api/types';

export const profile: Profile = {
  fullName: 'Test Person',
  headline: 'Full-Stack Developer | Java Backend Developer | Year 4 Student',
  intro: 'Intro sentence for tests.',
  background: '',
  careerGoals: '',
  professionalSummary: '',
  publicEmail: null,
  githubUrl: null,
  linkedinUrl: null,
  avatarUrl: null,
  avatarAlt: null,
  cvUrl: null,
  seoTitle: null,
  seoDescription: null,
};

export const skills: Skill[] = [
  { id: 1, name: 'Java', category: 'LANGUAGES', level: null, displayOrder: 0 },
  { id: 2, name: 'Spring Boot', category: 'BACKEND', level: null, displayOrder: 0 },
  { id: 3, name: 'REST APIs', category: 'BACKEND', level: null, displayOrder: 1 },
  { id: 4, name: 'React.js', category: 'FRONTEND', level: null, displayOrder: 0 },
  { id: 5, name: 'PostgreSQL', category: 'DATABASES', level: null, displayOrder: 0 },
  { id: 6, name: 'Docker', category: 'DEVOPS', level: null, displayOrder: 0 },
];

export function project(overrides: Partial<ProjectSummary> = {}): ProjectSummary {
  return {
    id: 1,
    slug: 'alpha',
    name: 'Alpha',
    summary: 'Alpha summary.',
    category: 'WEB_APP',
    status: 'LIVE',
    technologies: ['Java', 'React'],
    liveUrl: 'https://alpha.example.test/demo',
    githubUrl: 'https://github.com/example-test/alpha',
    featured: false,
    thumbnail: null,
    ...overrides,
  };
}

export function projectDetail(overrides: Partial<ProjectDetail> = {}): ProjectDetail {
  return {
    id: 1,
    slug: 'alpha',
    name: 'Alpha',
    summary: 'Alpha summary.',
    description: 'First paragraph.\n\nSecond paragraph with <b>markup</b> that must stay text.',
    problem: 'The problem.',
    solution: 'The solution.',
    keyFeatures: ['Feature one', 'Feature two'],
    category: 'WEB_APP',
    status: 'LIVE',
    technologies: ['Java'],
    liveUrl: 'https://alpha.example.test/demo',
    githubUrl: null,
    featured: false,
    images: [
      { id: 10, url: '/api/v1/files/a.png', altText: 'Dashboard screenshot', thumbnail: true, sortOrder: 0, width: 1600, height: 1000 },
      { id: 11, url: '/api/v1/files/b.png', altText: 'Settings screenshot', thumbnail: false, sortOrder: 1, width: 1600, height: 1000 },
    ],
    ...overrides,
  };
}

export const experience: Experience[] = [
  { id: 1, company: 'Example Co', role: 'Backend Intern', location: 'Remote', type: 'INTERNSHIP', startDate: '2025-06-01', endDate: null, current: true, description: 'Did things.' },
];

export const education: Education[] = [
  { id: 1, institution: 'Example University', degree: 'B.Eng. IT', fieldOfStudy: null, startDate: '2022-09-01', endDate: null, description: '' },
];

export const certifications: Certification[] = [
  { id: 1, name: 'Example Cert', issuer: 'Example Issuer', issuedOn: '2025-01-15', credentialUrl: 'https://example.test/cert' },
];
