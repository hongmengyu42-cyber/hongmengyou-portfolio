import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { mockContentApis, renderApp } from './test/render';

describe('App routing', () => {
  it('lazy-loads a not-found page for unknown URLs, inside the shared layout', async () => {
    mockContentApis();
    renderApp(<App />, { route: '/this-page-does-not-exist' });

    expect(await screen.findByRole('heading', { name: /couldn’t find that page/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
