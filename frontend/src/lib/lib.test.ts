import { describe, expect, it } from 'vitest';
import type { Skill } from '../api/types';
import { formatMonthYear, formatRange, initials, paragraphs } from './format';
import { externalLinkProps, safeExternalUrl } from './safeUrl';
import { groupSkills } from './skillGroups';
import { validateContact } from './validation';

describe('safeExternalUrl', () => {
  it.each(['https://example.com', 'http://example.com/a?b=1', 'HTTPS://EXAMPLE.COM'])('allows %s', (url) => {
    expect(safeExternalUrl(url)).toBe(url);
  });

  it.each(['javascript:alert(1)', 'data:text/html,<script>1</script>', 'file:///etc/passwd', 'ftp://x.test', '//example.com', 'example.com', '', null, undefined])(
    'rejects %s',
    (url) => {
      expect(safeExternalUrl(url as string | null | undefined)).toBeNull();
    },
  );

  it('exposes the attributes every outbound link must carry', () => {
    expect(externalLinkProps).toEqual({ target: '_blank', rel: 'noopener noreferrer' });
  });
});

describe('groupSkills', () => {
  const skill = (id: number, name: string, category: Skill['category'], displayOrder = 0): Skill => ({ id, name, category, displayOrder });

  it('orders groups Languages, Backend, Frontend, Databases, DevOps and drops empty ones', () => {
    const groups = groupSkills([skill(1, 'Docker', 'DEVOPS'), skill(2, 'Java', 'LANGUAGES'), skill(3, 'Spring', 'BACKEND')]);
    expect(groups.map((g) => g.label)).toEqual(['Languages', 'Backend', 'DevOps']);
  });

  it('sorts skills inside a group by display order, then name', () => {
    const [group] = groupSkills([skill(1, 'B', 'BACKEND', 1), skill(2, 'C', 'BACKEND', 0), skill(3, 'A', 'BACKEND', 1)]);
    expect(group?.skills.map((s) => s.name)).toEqual(['C', 'A', 'B']);
  });

  it('returns nothing for no skills', () => {
    expect(groupSkills([])).toEqual([]);
  });
});

describe('format helpers', () => {
  it('formats dates in UTC so the month never shifts with the timezone', () => {
    expect(formatMonthYear('2024-06-01')).toBe('Jun 2024');
    expect(formatMonthYear('2025-01-01')).toBe('Jan 2025');
  });

  it('formats ranges, using Present for current roles', () => {
    expect(formatRange('2024-06-01', '2025-02-01')).toBe('Jun 2024 – Feb 2025');
    expect(formatRange('2024-06-01', null, true)).toBe('Jun 2024 – Present');
  });

  it('splits plain text into paragraphs and drops blanks', () => {
    expect(paragraphs('One.\n\n\nTwo.\n\n  ')).toEqual(['One.', 'Two.']);
    expect(paragraphs(null)).toEqual([]);
  });

  it('builds initials', () => {
    expect(initials('Hong Mengyou')).toBe('HM');
    expect(initials('')).toBe('?');
  });
});

describe('validateContact', () => {
  const valid = { name: 'Ada', email: 'ada@example.com', subject: 'Hello', message: 'A message that is long enough.' };

  it('accepts valid input', () => {
    expect(validateContact(valid)).toEqual({});
  });

  it('requires every field and a 10+ character message', () => {
    const errors = validateContact({ name: ' ', email: '', subject: '', message: 'short' });
    expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'name', 'subject']);
  });

  it.each(['no-at-sign', 'a@b', 'a b@c.d', '@x.test'])('rejects malformed email %s', (email) => {
    expect(validateContact({ ...valid, email }).email).toBeDefined();
  });

  it('enforces the backend length limits', () => {
    expect(validateContact({ ...valid, name: 'x'.repeat(101) }).name).toBeDefined();
    expect(validateContact({ ...valid, subject: 'x'.repeat(151) }).subject).toBeDefined();
    expect(validateContact({ ...valid, message: 'x'.repeat(5001) }).message).toBeDefined();
  });
});
