import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { api } from '../api/client';
import { mockContentApis, renderApp } from '../test/render';
import { HomePage } from './HomePage';

// No env mock here: tests run in development mode, where TODO_REPLACE markers are intentionally visible.
describe('development placeholders', () => {
  it('shows clearly marked TODO_REPLACE hints for content the owner still has to supply', async () => {
    mockContentApis();
    vi.spyOn(api, 'projects').mockResolvedValue({ content: [], page: 0, size: 50, totalElements: 0, totalPages: 0 });
    renderApp(<HomePage />, { withContent: true });

    await screen.findByRole('heading', { level: 1 });
    const hints = await screen.findAllByText(/TODO_REPLACE:/);
    const text = hints.map((hint) => hint.textContent).join(' | ');
    expect(text).toMatch(/CV/);
    expect(text).toMatch(/background/);
    expect(text).toMatch(/projects/);
  });
});
