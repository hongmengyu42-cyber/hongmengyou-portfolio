import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

describe('accessible-name hygiene', () => {
  it('never starts an sr-only span with a space (browsers collapse it, so words run together: "Savealt text")', () => {
    const offenders = sourceFiles(join(__dirname, '..')).filter((file) => /className="sr-only">\s/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
