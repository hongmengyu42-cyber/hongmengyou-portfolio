import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Reveal } from './Reveal';

const stubMotionPreference = (reduce: boolean) =>
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));

describe('Reveal', () => {
  it('renders a plain element (no animation styles) when the user prefers reduced motion', () => {
    stubMotionPreference(true);
    render(<Reveal className="x">content</Reveal>);
    const element = screen.getByText('content');
    expect(element).toHaveClass('x');
    expect(element).not.toHaveAttribute('style');
  });

  it('starts hidden and animates in for everyone else, and never drops its children', () => {
    stubMotionPreference(false);
    render(<Reveal>content</Reveal>);
    const element = screen.getByText('content');
    expect(element).toBeInTheDocument();
    expect(element.getAttribute('style')).toMatch(/opacity:\s*0/);
  });
});
