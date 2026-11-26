// Build step for the Docker image: turns the fallback <head> block into an nginx SSI include.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const START = '<!--SEO_HEAD_START-->';
export const END = '<!--SEO_HEAD_END-->';

/** Replaces the marked fallback block with an SSI include that has the same block as its stub. */
export function injectSsi(html) {
  const start = html.indexOf(START);
  const end = html.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`index.html must contain ${START} ... ${END}`);
  }
  const fallback = html.slice(start + START.length, end).trim();
  if (fallback.includes('<!--#')) throw new Error('The SEO fallback block must not contain SSI directives.');
  const ssi = [
    '<!--# block name="seo_fallback" -->',
    fallback,
    '<!--# endblock -->',
    '<!--# include virtual="/__seo_head?path=${seo_path}" stub="seo_fallback" -->',
  ].join('\n    ');
  return html.slice(0, start) + ssi + html.slice(end + END.length);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: node inject-seo-ssi.mjs <path/to/index.html>');
  writeFileSync(file, injectSsi(readFileSync(file, 'utf8')));
  console.log(`SEO SSI injected into ${file}`);
}
