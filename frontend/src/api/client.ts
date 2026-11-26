import type {
  Certification,
  ContactRequest,
  Education,
  Experience,
  PageResponse,
  ProblemDetail,
  Profile,
  ProjectCategory,
  ProjectDetail,
  ProjectSummary,
  Skill,
} from './types';

/** Every failure becomes an ApiError so callers handle one shape: HTTP errors and network failures alike. */
export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetail | null;

  constructor(status: number, message: string, problem: ProblemDetail | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

const CSRF_COOKIE = 'XSRF-TOKEN';
const CSRF_HEADER = 'X-XSRF-TOKEN';

function readCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text(); // 201/204 have no body, so never call response.json() blindly
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

let unauthorizedHandler: (() => void) | null = null;

/** The admin area registers one callback so any expired session, on any request, returns to the login screen. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      headers: { Accept: 'application/json', ...init.headers },
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause; // caller cancelled on purpose
    throw new ApiError(0, 'Network error. Check your connection and try again.');
  }
  const body = await parseBody(response);
  if (response.status === 401 && path.startsWith('/api/v1/admin/') && !path.startsWith('/api/v1/admin/auth/login')) {
    unauthorizedHandler?.();
  }
  if (!response.ok) {
    const problem = body && typeof body === 'object' ? (body as ProblemDetail) : null;
    throw new ApiError(response.status, problem?.detail ?? `Request failed with status ${response.status}`, problem);
  }
  return body as T;
}

/**
 * The backend issues the CSRF cookie on every response, but a first-time visitor who goes straight
 * to the contact form may not have one yet. We then do one cheap existing GET to obtain it.
 */
async function csrfToken(): Promise<string | null> {
  let token = readCookie(CSRF_COOKIE);
  if (!token) {
    await request<Profile>('/api/v1/profile');
    token = readCookie(CSRF_COOKIE);
  }
  return token;
}

type WriteMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Every state-changing request goes through here so none can forget the CSRF header.
 * JSON bodies get a JSON content type; FormData (multipart) and URLSearchParams (login form) are passed through
 * untouched so the browser adds the correct Content-Type, including the multipart boundary.
 */
export async function send<T>(method: WriteMethod, path: string, body?: unknown): Promise<T> {
  const token = await csrfToken();
  const headers: Record<string, string> = token ? { [CSRF_HEADER]: token } : {};
  let payload: BodyInit | undefined;
  if (body instanceof FormData || body instanceof URLSearchParams) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  return request<T>(path, { method, headers, body: payload });
}

export interface ProjectQuery {
  category?: ProjectCategory;
  page?: number;
  size?: number;
}

export const api = {
  profile: (signal?: AbortSignal) => request<Profile>('/api/v1/profile', { signal }),
  skills: (signal?: AbortSignal) => request<Skill[]>('/api/v1/skills', { signal }),
  experience: (signal?: AbortSignal) => request<Experience[]>('/api/v1/experience', { signal }),
  education: (signal?: AbortSignal) => request<Education[]>('/api/v1/education', { signal }),
  certifications: (signal?: AbortSignal) => request<Certification[]>('/api/v1/certifications', { signal }),

  projects: (query: ProjectQuery = {}, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (query.category) params.set('category', query.category);
    params.set('page', String(query.page ?? 0));
    params.set('size', String(query.size ?? 50)); // 50 is the backend's maximum page size
    return request<PageResponse<ProjectSummary>>(`/api/v1/projects?${params.toString()}`, { signal });
  },

  project: (slug: string, signal?: AbortSignal) =>
    request<ProjectDetail>(`/api/v1/projects/${encodeURIComponent(slug)}`, { signal }),

  submitContact: (body: ContactRequest) => send<void>('POST', '/api/v1/contact', body),
};
