import type { ExperienceType, ProjectCategory, ProjectImage, ProjectStatus, SkillCategory } from './types';

/** Mirrors the backend's admin DTO records. */

export type LinkStatus = 'UNKNOWN' | 'OK' | 'BROKEN' | 'BLOCKED';

export interface AdminMe {
  email: string;
  roles: string[];
}

export interface AdminProjectListItem {
  id: number;
  slug: string;
  name: string;
  category: ProjectCategory;
  status: ProjectStatus;
  featured: boolean;
  published: boolean;
  displayOrder: number;
  linkStatus: LinkStatus;
  linkCheckedAt?: string | null;
  thumbnailUrl?: string | null;
}

export interface AdminProjectDetail {
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
  published: boolean;
  displayOrder: number;
  linkStatus: LinkStatus;
  linkCheckedAt?: string | null;
  images: ProjectImage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectRequest {
  name: string;
  slug: string | null;
  summary: string;
  description: string;
  problem: string | null;
  solution: string | null;
  keyFeatures: string[];
  category: ProjectCategory;
  status: ProjectStatus;
  liveUrl: string | null;
  githubUrl: string | null;
  featured: boolean;
  published: boolean;
  technologies: string[];
}

export interface LinkCheckResult {
  projectId: number;
  projectName: string;
  status: LinkStatus;
  checkedAt?: string | null;
  httpStatus?: number | null;
  note?: string | null;
}

export interface SkillRequest {
  name: string;
  category: SkillCategory;
  level: number | null;
  displayOrder: number;
}

export interface ExperienceRequest {
  company: string;
  role: string;
  location: string | null;
  type: ExperienceType;
  startDate: string;
  endDate: string | null;
  description: string;
}

export interface EducationRequest {
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startDate: string;
  endDate: string | null;
  description: string;
}

export interface CertificationRequest {
  name: string;
  issuer: string;
  issuedOn: string;
  credentialUrl: string | null;
}

export interface ProfileRequest {
  fullName: string;
  headline: string;
  intro: string;
  background: string;
  careerGoals: string;
  professionalSummary: string;
  publicEmail: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface AdminContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}
