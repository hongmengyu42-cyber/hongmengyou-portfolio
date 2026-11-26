import { render } from '@testing-library/react';
import axe from 'axe-core';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { expect, vi } from 'vitest';
import { api } from '../api/client';
import { ContentProvider } from '../content/ContentProvider';
import { ThemeProvider } from '../theme/ThemeProvider';
import * as fixtures from './fixtures';

export function renderApp(ui: ReactElement, { route = '/', withContent = false } = {}) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[route]}>{withContent ? <ContentProvider>{ui}</ContentProvider> : ui}</MemoryRouter>
    </ThemeProvider>,
  );
}

/** Stubs every shared-content endpoint. Pass overrides to change one. */
export function mockContentApis(overrides: Partial<Record<'profile' | 'skills' | 'experience' | 'education' | 'certifications', unknown>> = {}) {
  const resolve = <T,>(key: keyof typeof overrides, fallback: T) =>
    key in overrides ? (overrides[key] as T) : fallback;
  vi.spyOn(api, 'profile').mockResolvedValue(resolve('profile', fixtures.profile));
  vi.spyOn(api, 'skills').mockResolvedValue(resolve('skills', fixtures.skills));
  vi.spyOn(api, 'experience').mockResolvedValue(resolve('experience', []));
  vi.spyOn(api, 'education').mockResolvedValue(resolve('education', []));
  vi.spyOn(api, 'certifications').mockResolvedValue(resolve('certifications', []));
}

/** Structural accessibility check (roles, names, ARIA, labels). Colour contrast is verified by contrast.test.ts instead,
 *  because jsdom cannot compute rendered colours. */
export async function expectNoAxeViolations(container: Element) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`)).toEqual([]);
}

import { NotificationProvider } from '../admin/ui/Notifications';

/** Renders an admin page with the router, theme and toast region it needs (but without the auth shell). */
export function renderAdmin(ui: ReactElement, { route = '/admin' } = {}) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[route]}>
        <NotificationProvider>{ui}</NotificationProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}
