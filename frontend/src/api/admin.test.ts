import { afterEach, describe, expect, it, vi } from 'vitest';
import { adminApi } from './admin';
import { setUnauthorizedHandler } from './client';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const empty = (status = 204) => new Response(null, { status });

type Call = [string, RequestInit];
const calls = (fetchMock: ReturnType<typeof vi.fn>) => fetchMock.mock.calls as Call[];
const headers = (call: Call) => call[1].headers as Record<string, string>;

afterEach(() => {
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  setUnauthorizedHandler(null);
});

describe('adminApi', () => {
  it('logs in with a form-encoded body (what Spring Security expects) and the CSRF header', async () => {
    document.cookie = 'XSRF-TOKEN=tok; path=/';
    const fetchMock = vi.fn().mockResolvedValue(empty());
    vi.stubGlobal('fetch', fetchMock);

    await adminApi.login('admin@example.test', 'pa ss&word');

    const [url, init] = calls(fetchMock)[0] as Call;
    expect(url).toBe('/api/v1/admin/auth/login');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(URLSearchParams);
    expect((init.body as URLSearchParams).get('email')).toBe('admin@example.test');
    expect((init.body as URLSearchParams).get('password')).toBe('pa ss&word');
    expect(headers(calls(fetchMock)[0] as Call)['X-XSRF-TOKEN']).toBe('tok');
    expect(headers(calls(fetchMock)[0] as Call)['Content-Type']).toBeUndefined(); // browser sets form encoding itself
  });

  it('sends JSON writes with the CSRF token and a JSON content type', async () => {
    document.cookie = 'XSRF-TOKEN=tok; path=/';
    const fetchMock = vi.fn().mockResolvedValue(empty());
    vi.stubGlobal('fetch', fetchMock);

    await adminApi.projects.reorder([3, 1, 2]);

    const call = calls(fetchMock)[0] as Call;
    expect(call[0]).toBe('/api/v1/admin/projects/order');
    expect(call[1].method).toBe('PUT');
    expect(JSON.parse(call[1].body as string)).toEqual({ ids: [3, 1, 2] });
    expect(headers(call)['Content-Type']).toBe('application/json');
    expect(headers(call)['X-XSRF-TOKEN']).toBe('tok');
  });

  it('uploads files as multipart without forcing a content type (the browser adds the boundary)', async () => {
    document.cookie = 'XSRF-TOKEN=tok; path=/';
    const fetchMock = vi.fn().mockResolvedValue(json({ id: 5 }, 201));
    vi.stubGlobal('fetch', fetchMock);

    await adminApi.projects.uploadImage(9, new File(['x'], 'shot.png', { type: 'image/png' }), 'A dashboard');

    const call = calls(fetchMock)[0] as Call;
    expect(call[0]).toBe('/api/v1/admin/projects/9/images');
    const form = call[1].body as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect((form.get('file') as File).name).toBe('shot.png');
    expect(form.get('altText')).toBe('A dashboard');
    expect(headers(call)['Content-Type']).toBeUndefined();
  });

  it('protects deletes and PATCHes with CSRF too', async () => {
    document.cookie = 'XSRF-TOKEN=tok; path=/';
    const fetchMock = vi.fn().mockResolvedValue(empty());
    vi.stubGlobal('fetch', fetchMock);

    await adminApi.skills.remove(4);
    await adminApi.messages.setRead(2, true);

    expect(calls(fetchMock).map((c) => [c[1].method, c[0]])).toEqual([
      ['DELETE', '/api/v1/admin/skills/4'],
      ['PATCH', '/api/v1/admin/contact-messages/2'],
    ]);
    calls(fetchMock).forEach((c) => expect(headers(c)['X-XSRF-TOKEN']).toBe('tok'));
  });

  it('builds the message list query', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ content: [] }));
    vi.stubGlobal('fetch', fetchMock);
    await adminApi.messages.list({ unreadOnly: true, page: 2 });
    expect(calls(fetchMock)[0]?.[0]).toBe('/api/v1/admin/contact-messages?unreadOnly=true&page=2&size=20');
  });

  it('reports an expired session on any admin request, but not a failed login', async () => {
    const onExpired = vi.fn();
    setUnauthorizedHandler(onExpired);
    document.cookie = 'XSRF-TOKEN=tok; path=/';
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => json({ title: 'Unauthorized' }, 401)));

    await adminApi.projects.list().catch(() => undefined);
    expect(onExpired).toHaveBeenCalledTimes(1);

    await adminApi.login('a@b.test', 'wrong').catch(() => undefined);
    expect(onExpired).toHaveBeenCalledTimes(1); // wrong password must not look like an expired session
  });
});
