import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function Boom(): never {
  throw new Error('render failure');
}

describe('ErrorBoundary', () => {
  it('shows a message instead of a blank page and logs the error', () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary label="the page">
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong in the page.');
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    expect(logged).toHaveBeenCalled();
  });

  it('renders children normally when nothing fails', () => {
    render(
      <ErrorBoundary>
        <p>fine</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('fine')).toBeInTheDocument();
  });
});
