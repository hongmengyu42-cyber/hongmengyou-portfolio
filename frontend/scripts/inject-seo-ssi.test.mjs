import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { END, injectSsi, START } from './inject-seo-ssi.mjs';

const page = `<head><script src="/theme-init.js"></script>
${START}
<title>Fallback</title><meta name="description" content="Fallback text" />
${END}
<script type="module" src="/assets/app.js"></script></head>`;

describe('injectSsi', () => {
  it('replaces the markers with an SSI include whose stub is the original fallback', () => {
    const out = injectSsi(page);
    expect(out).not.toContain(START);
    expect(out).not.toContain(END);
    expect(out).toContain('<!--# block name="seo_fallback" -->');
    expect(out).toContain('<title>Fallback</title><meta name="description" content="Fallback text" />');
    expect(out).toContain('<!--# include virtual="/__seo_head?path=${seo_path}" stub="seo_fallback" -->');
  });

  it('defines the block before it is used (nginx requires that order)', () => {
    const out = injectSsi(page);
    expect(out.indexOf('<!--# endblock -->')).toBeLessThan(out.indexOf('<!--# include'));
  });

  it('leaves every other tag untouched', () => {
    const out = injectSsi(page);
    expect(out).toContain('<script src="/theme-init.js"></script>');
    expect(out).toContain('<script type="module" src="/assets/app.js"></script>');
  });

  it('fails loudly if the markers are missing or reversed, so a broken build never ships', () => {
    expect(() => injectSsi('<head></head>')).toThrow(/must contain/);
    expect(() => injectSsi(`${END}${START}`)).toThrow(/must contain/);
  });

  it('refuses a fallback that already contains SSI directives', () => {
    expect(() => injectSsi(`${START}<!--# echo var="x" -->${END}`)).toThrow(/SSI directives/);
  });

  it('works on the real index.html of this project', () => {
    const real = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
    const out = injectSsi(real);
    expect(out).toContain('stub="seo_fallback"');
    expect(out).toContain('<title>');
  });
});
