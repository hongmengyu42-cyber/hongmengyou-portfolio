import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Parses src/theme/tokens.css so the test checks the real shipped values, not a copy. */
function readTokens(): { light: Record<string, string>; dark: Record<string, string> } {
  const css = readFileSync(join(__dirname, 'tokens.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const block = (selector: RegExp): Record<string, string> => {
    const body = css.match(selector)?.[1] ?? '';
    const vars: Record<string, string> = {};
    for (const [, name, value] of body.matchAll(/(--c-[\w-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g)) {
      vars[name as string] = value as string;
    }
    return vars;
  };
  const light = block(/:root\s*\{([\s\S]*?)\n\}/);
  const dark = { ...light, ...block(/\.dark\s*\{([\s\S]*?)\n\}/) }; // dark overrides light
  return { light, dark };
}

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const AA_TEXT = 4.5; // normal text
const AA_UI = 3; // UI component boundaries, focus indicators, large text

/** [foreground token, background token, minimum ratio, what it is] */
type Pair = [string, string, number, string];

const COMMON: Pair[] = [
  ['--c-ink', '--c-canvas', AA_TEXT, 'body text on page'],
  ['--c-ink', '--c-surface', AA_TEXT, 'body text on card'],
  ['--c-ink', '--c-surface-2', AA_TEXT, 'body text on tinted panel'],
  ['--c-muted', '--c-canvas', AA_TEXT, 'secondary text on page'],
  ['--c-muted', '--c-surface', AA_TEXT, 'secondary text on card'],
  ['--c-muted', '--c-surface-2', AA_TEXT, 'secondary text on tinted panel'],
  ['--c-accent-text', '--c-canvas', AA_TEXT, 'links and labels on page'],
  ['--c-accent-text', '--c-surface', AA_TEXT, 'links and labels on card'],
  ['--c-accent-text', '--c-surface-2', AA_TEXT, 'links and labels on tinted panel'],
  ['--c-btn-fg', '--c-btn-bg', AA_TEXT, 'primary button label'],
  ['--c-btn-fg', '--c-btn-bg-hover', AA_TEXT, 'primary button label (hover)'],
  ['--c-on-accent', '--c-accent', AA_TEXT, 'text on brand-accent fills'],
  ['--c-focus', '--c-canvas', AA_UI, 'focus ring on page'],
  ['--c-focus', '--c-surface', AA_UI, 'focus ring on card'],
  ['--c-input-border', '--c-surface', AA_UI, 'form field border on card'],
  ['--c-input-border', '--c-canvas', AA_UI, 'form field border on page'],
  ['--c-code-fg', '--c-code-bg', AA_TEXT, 'code text'],
  ['--c-code-muted', '--c-code-bg', AA_TEXT, 'code comments'],
  ['--c-code-key', '--c-code-bg', AA_TEXT, 'code keywords'],
  ['--c-code-str', '--c-code-bg', AA_TEXT, 'code strings'],
];

describe.each([['light'], ['dark']] as const)('WCAG AA contrast: %s theme', (theme) => {
  const tokens = readTokens()[theme];

  it.each(COMMON)('%s on %s is at least %s:1 (%s)', (fg, bg, minimum) => {
    const foreground = tokens[fg];
    const background = tokens[bg];
    expect(foreground, `${fg} must be defined`).toBeDefined();
    expect(background, `${bg} must be defined`).toBeDefined();
    expect(contrast(foreground as string, background as string)).toBeGreaterThanOrEqual(minimum);
  });
});

describe('brand tokens from the brief are unchanged', () => {
  const { light, dark } = readTokens();

  it('keeps the exact navy, accent, background and text colours', () => {
    expect(light['--c-navy']).toBe('#0B1B3A');
    expect(light['--c-accent']).toBe('#2F6FED');
    expect(light['--c-canvas']).toBe('#FAFBFD');
    expect(light['--c-ink']).toBe('#1F2933');
  });

  it('uses a navy-based page surface in dark mode', () => {
    expect(dark['--c-canvas']).toBe('#0B1B3A');
  });

  it('documents why the raw accent is not used for small text', () => {
    expect(contrast('#2F6FED', '#FAFBFD')).toBeLessThan(AA_TEXT);
    expect(contrast('#2F6FED', '#0B1B3A')).toBeLessThan(AA_TEXT);
  });
});
