// Test-only admin data. Obviously fake; never shipped.
import type { AdminContactMessage, AdminProjectDetail, AdminProjectListItem } from '../api/adminTypes';
import type { ProjectImage } from '../api/types';

export function listItem(overrides: Partial<AdminProjectListItem> = {}): AdminProjectListItem {
  return {
    id: 1, slug: 'alpha', name: 'Alpha', category: 'WEB_APP', status: 'LIVE', featured: false, published: true,
    displayOrder: 0, linkStatus: 'UNKNOWN', linkCheckedAt: null, thumbnailUrl: null, ...overrides,
  };
}

export const image = (id: number, overrides: Partial<ProjectImage> = {}): ProjectImage => ({
  id, url: `/api/v1/files/${id}.png`, altText: `Screenshot ${id}`, thumbnail: false, sortOrder: id - 1, width: 1600, height: 1000, ...overrides,
});

export function detail(overrides: Partial<AdminProjectDetail> = {}): AdminProjectDetail {
  return {
    id: 1, slug: 'alpha', name: 'Alpha', summary: 'Alpha summary.', description: 'Alpha description.', problem: null, solution: null,
    keyFeatures: ['Fast', 'Small'], category: 'WEB_APP', status: 'LIVE', technologies: ['Java', 'React'],
    liveUrl: 'https://alpha.example.test', githubUrl: null, featured: false, published: true, displayOrder: 0,
    linkStatus: 'UNKNOWN', linkCheckedAt: null, images: [], updatedAt: '2026-01-01T00:00:00Z', ...overrides,
  };
}

export const message = (id: number, overrides: Partial<AdminContactMessage> = {}): AdminContactMessage => ({
  id, name: `Sender ${id}`, email: `sender${id}@example.test`, subject: `Subject ${id}`, message: `Body ${id}`,
  read: false, createdAt: '2026-02-03T10:00:00Z', ...overrides,
});

export const page = <T,>(content: T[], extra: { totalPages?: number; totalElements?: number; page?: number } = {}) => ({
  content, page: extra.page ?? 0, size: 100, totalElements: extra.totalElements ?? content.length, totalPages: extra.totalPages ?? 1,
});
