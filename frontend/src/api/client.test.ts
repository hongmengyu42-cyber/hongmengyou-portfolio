import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './client';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const clearCookie = () => {
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
};

afterEach(clearCookie);

describe('api client', () => {
  it('returns parsed JSON on success and sends same-origin credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ fullName: 'X' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.profile()).resolves.toEqual({ fullName: 'X' });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/profile', expect.objectContaining({ credentials: 'same-origin' }));
  });

  it('turns a ProblemDetail response into an ApiError that keeps the status, detail and field errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ title: 'Validation failed', status: 400, detail: 'One or more fields are invalid.', errors: { email: 'bad' } }, 400)));

    const error = await api.profile().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, message: 'One or more fields are invalid.' });
    expect((error as ApiError).problem?.errors).toEqual({ email: 'bad' });
  });

  it('flags 404s so pages can render a not-found state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ title: 'Resource not found', status: 404 }, 404)));
    const error = (await api.project('nope').catch((e: unknown) => e)) as ApiError;
    expect(error.isNotFound).toBe(true);
  });

  it('survives a non-JSON error body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>bad gateway</html>', { status: 502 })));
    const error = (await api.skills().catch((e: unknown) => e)) as ApiError;
    expect(error).toMatchObject({ status: 502, message: 'Request failed with status 502' });
  });

  it('wraps network failures as status 0 with a friendly message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const error = (await api.skills().catch((e: unknown) => e)) as ApiError;
    expect(error).toMatchObject({ status: 0 });
    expect(error.message).toMatch(/network error/i);
  });

  it('does not hide deliberate cancellation behind an ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')));
    await expect(api.skills()).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('builds the projects query using the backend page-size cap', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ content: [], page: 0, size: 50, totalElements: 0, totalPages: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    await api.projects({ category: 'API' });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/projects?category=API&page=0&size=50');
  });

  it('encodes the slug in the project URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({}));
    vi.stubGlobal('fetch', fetchMock);
    await api.project('a/b c');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/projects/a%2Fb%20c');
  });

  describe('submitContact', () => {
    const body = { name: 'Ada', email: 'ada@example.com', subject: 'Hi', message: 'A long enough message.', website: '' };

    it('sends the CSRF token from the cookie and the honeypot field, and accepts an empty 201 body', async () => {
      document.cookie = 'XSRF-TOKEN=token-123; path=/';
      const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
      vi.stubGlobal('fetch', fetchMock);

      await expect(api.submitContact(body)).resolves.toBeUndefined();

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('/api/v1/contact');
      expect(init.method).toBe('POST');
      expect((init.headers as Record<string, string>)['X-XSRF-TOKEN']).toBe('token-123');
      expect(JSON.parse(init.body as string)).toEqual(body);
    });

    it('fetches an existing public endpoint first when no CSRF cookie exists yet', async () => {
      const fetchMock = vi
        .fn()
        .mockImplementationOnce(async () => {
          document.cookie = 'XSRF-TOKEN=fresh-token; path=/'; // what the backend's response would do
          return json({ fullName: 'X' });
        })
        .mockResolvedValueOnce(new Response(null, { status: 201 }));
      vi.stubGlobal('fetch', fetchMock);

      await api.submitContact(body);

      expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/profile');
      expect(((fetchMock.mock.calls[1] as [string, RequestInit])[1].headers as Record<string, string>)['X-XSRF-TOKEN']).toBe('fresh-token');
    });

    it('propagates a 429 so the form can explain the rate limit', async () => {
      document.cookie = 'XSRF-TOKEN=t; path=/';
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ title: 'Too many requests', detail: 'Slow down.' }, 429)));
      await expect(api.submitContact(body)).rejects.toMatchObject({ status: 429 });
    });
  });
});
