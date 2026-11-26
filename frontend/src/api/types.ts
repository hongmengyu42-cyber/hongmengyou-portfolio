/** Mirrors the Spring Boot DTO records exactly. Nullable fields may be absent, hence `?:`. */

export type ProjectCategory = 'WEB_APP' | 'API' | 'FULL_STACK' | 'MOBILE' | 'LIBRARY' | 'OTHER';
export type ProjectStatus = 'LIVE' | 'IN_DEVELOPMENT' | 'ARCHIVED';

export interface ProjectImage {
  id: number;
  url: string;
  altText: string;
  thumbnail: boolean;
  sortOrder: number;
  width: number;
  height: number;
}

export interface ProjectSummary {
  id: number;
  slug: string;
  name: string;
  summary: string;
  category: ProjectCategory;
  status: ProjectStatus;
  technologies: string[];
  liveUrl?: string | null;
  githubUrl?: string | null;
  featured: boolean;
  thumbnail?: ProjectImage | null;
}

export interface ProjectDetail {
  id: number;
  slug: string;
  name: string;
  summary: string;
  description: string;
  problem?: string | null;
  solution?: string | null;
  keyFeatures: string[];
  category: ProjectCategory;
  status: ProjectStatus;
  technologies: string[];
  liveUrl?: string | null;
  githubUrl?: string | null;
  featured: boolean;
  images: ProjectImage[];
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type SkillCategory = 'LANGUAGES' | 'BACKEND' | 'FRONTEND' | 'DATABASES' | 'DEVOPS';

export interface Skill {
  id: number;
  name: string;
  category: SkillCategory;
  level?: number | null;
  displayOrder: number;
}

export type ExperienceType = 'WORK' | 'INTERNSHIP' | 'ACTIVITY';

export interface Experience {
  id: number;
  company: string;
  role: string;
  location?: string | null;
  type: ExperienceType;
  startDate: string; // ISO date, e.g. 2024-06-01
  endDate?: string | null;
  current: boolean;
  description: string;
}

export interface Education {
  id: number;
  institution: string;
  degree: string;
  fieldOfStudy?: string | null;
  startDate: string;
  endDate?: string | null;
  description: string;
}

export interface Certification {
  id: number;
  name: string;
  issuer: string;
  issuedOn: string;
  credentialUrl?: string | null;
}

export interface Profile {
  fullName: string;
  headline: string;
  intro: string;
  background: string;
  careerGoals: string;
  professionalSummary: string;
  publicEmail?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  avatarUrl?: string | null;
  avatarAlt?: string | null;
  cvUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Honeypot. Real visitors never see or fill this field. */
  website: string;
}

/** RFC 7807 body produced by the backend's GlobalExceptionHandler. */
export interface ProblemDetail {
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string>;
}
