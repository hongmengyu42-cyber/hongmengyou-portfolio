import { request, send } from './client';
import type {
  AdminContactMessage,
  AdminMe,
  AdminProjectDetail,
  AdminProjectListItem,
  CertificationRequest,
  EducationRequest,
  ExperienceRequest,
  LinkCheckResult,
  ProfileRequest,
  ProjectRequest,
  SkillRequest,
} from './adminTypes';
import type { Certification, Education, Experience, PageResponse, Profile, ProjectImage, Skill } from './types';

const A = '/api/v1/admin';

/** Same CRUD shape for skills, experience, education and certifications. */
function crud<E, R>(resource: string) {
  return {
    list: (signal?: AbortSignal) => request<E[]>(`${A}/${resource}`, { signal }),
    create: (body: R) => send<E>('POST', `${A}/${resource}`, body),
    update: (id: number, body: R) => send<E>('PUT', `${A}/${resource}/${id}`, body),
    remove: (id: number) => send<void>('DELETE', `${A}/${resource}/${id}`),
  };
}

function file(file: File, altText?: string): FormData {
  const form = new FormData();
  form.append('file', file);
  if (altText !== undefined) form.append('altText', altText);
  return form;
}

/** Everything the dashboard calls. All of these endpoints already exist in the Spring Boot API. */
export const adminApi = {
  // Login is a plain form post handled by Spring Security (not JSON): fields are `email` and `password`.
  login: (email: string, password: string) => send<void>('POST', `${A}/auth/login`, new URLSearchParams({ email, password })),
  logout: () => send<void>('POST', `${A}/auth/logout`),
  me: (signal?: AbortSignal) => request<AdminMe>(`${A}/auth/me`, { signal }),

  projects: {
    list: (page = 0, size = 100, signal?: AbortSignal) =>
      request<PageResponse<AdminProjectListItem>>(`${A}/projects?page=${page}&size=${size}`, { signal }),
    get: (id: number, signal?: AbortSignal) => request<AdminProjectDetail>(`${A}/projects/${id}`, { signal }),
    create: (body: ProjectRequest) => send<AdminProjectDetail>('POST', `${A}/projects`, body),
    update: (id: number, body: ProjectRequest) => send<AdminProjectDetail>('PUT', `${A}/projects/${id}`, body),
    remove: (id: number) => send<void>('DELETE', `${A}/projects/${id}`),
    reorder: (ids: number[]) => send<void>('PUT', `${A}/projects/order`, { ids }),
    checkLink: (id: number) => send<LinkCheckResult>('POST', `${A}/projects/${id}/link-check`),
    checkAllLinks: () => send<LinkCheckResult[]>('POST', `${A}/projects/link-check`),

    uploadImage: (id: number, image: File, altText: string) =>
      send<ProjectImage>('POST', `${A}/projects/${id}/images`, file(image, altText)),
    updateImageAlt: (id: number, imageId: number, altText: string) =>
      send<ProjectImage>('PATCH', `${A}/projects/${id}/images/${imageId}`, { altText }),
    setThumbnail: (id: number, imageId: number) => send<void>('PUT', `${A}/projects/${id}/images/${imageId}/thumbnail`),
    reorderImages: (id: number, ids: number[]) => send<void>('PUT', `${A}/projects/${id}/images/order`, { ids }),
    removeImage: (id: number, imageId: number) => send<void>('DELETE', `${A}/projects/${id}/images/${imageId}`),
  },

  skills: crud<Skill, SkillRequest>('skills'),
  experience: crud<Experience, ExperienceRequest>('experience'),
  education: crud<Education, EducationRequest>('education'),
  certifications: crud<Certification, CertificationRequest>('certifications'),

  profile: {
    get: (signal?: AbortSignal) => request<Profile>(`${A}/profile`, { signal }),
    update: (body: ProfileRequest) => send<Profile>('PUT', `${A}/profile`, body),
    uploadAvatar: (image: File, altText: string) => send<Profile>('PUT', `${A}/profile/avatar`, file(image, altText)),
    uploadCv: (pdf: File) => send<Profile>('PUT', `${A}/profile/cv`, file(pdf)),
  },

  messages: {
    list: (opts: { unreadOnly?: boolean; page?: number; size?: number } = {}, signal?: AbortSignal) =>
      request<PageResponse<AdminContactMessage>>(
        `${A}/contact-messages?unreadOnly=${opts.unreadOnly ? 'true' : 'false'}&page=${opts.page ?? 0}&size=${opts.size ?? 20}`,
        { signal },
      ),
    unreadCount: (signal?: AbortSignal) => request<{ count: number }>(`${A}/contact-messages/unread-count`, { signal }),
    setRead: (id: number, read: boolean) => send<AdminContactMessage>('PATCH', `${A}/contact-messages/${id}`, { read }),
    remove: (id: number) => send<void>('DELETE', `${A}/contact-messages/${id}`),
  },
};
