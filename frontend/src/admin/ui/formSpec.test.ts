import { describe, expect, it } from 'vitest';
import { endNotBeforeStart, validateFields, type FieldSpec } from './formSpec';

const specs: FieldSpec[] = [
  { name: 'name', label: 'Name', kind: 'text', required: true, max: 5 },
  { name: 'site', label: 'Site', kind: 'url' },
  { name: 'mail', label: 'Email', kind: 'email' },
  { name: 'count', label: 'Count', kind: 'number', min: 1, max: 5 },
  { name: 'when', label: 'When', kind: 'date' },
  { name: 'kind', label: 'Kind', kind: 'select', options: [{ value: 'A', label: 'A' }] },
  { name: 'flag', label: 'Flag', kind: 'checkbox', required: true },
];
const valid = { name: 'ok', site: '', mail: '', count: '', when: '', kind: '', flag: false };

describe('validateFields', () => {
  it('accepts valid and empty optional values (and never validates checkboxes)', () => {
    expect(validateFields(specs, valid)).toEqual({});
    expect(validateFields(specs, { ...valid, site: 'https://a.test', mail: 'a@b.test', count: '3', when: '2025-02-28', kind: 'A' })).toEqual({});
  });

  it('requires required fields and enforces max length', () => {
    expect(validateFields(specs, { ...valid, name: '  ' }).name).toBe('Name is required.');
    expect(validateFields(specs, { ...valid, name: 'toolong' }).name).toMatch(/5 characters or fewer/);
  });

  it.each(['javascript:alert(1)', 'data:text/html,x', 'ftp://a.test', 'a.test', 'https://a b.test'])('rejects unsafe or malformed URL %s', (site) => {
    expect(validateFields(specs, { ...valid, site }).site).toBe('Enter a valid http or https URL.');
  });

  it('validates email, numbers and dates', () => {
    expect(validateFields(specs, { ...valid, mail: 'nope' }).mail).toBeDefined();
    expect(validateFields(specs, { ...valid, count: '1.5' }).count).toBe('Enter a whole number.');
    expect(validateFields(specs, { ...valid, count: '0' }).count).toMatch(/at least 1/);
    expect(validateFields(specs, { ...valid, count: '6' }).count).toMatch(/at most 5/);
    expect(validateFields(specs, { ...valid, when: '2025-13-40' }).when).toBe('Enter a valid date.');
    expect(validateFields(specs, { ...valid, when: '31/01/2025' }).when).toBe('Enter a valid date.');
  });

  it('rejects a select value that is not one of the options', () => {
    expect(validateFields(specs, { ...valid, kind: 'Z' }).kind).toBeDefined();
  });
});

describe('endNotBeforeStart', () => {
  it('flags an end date before the start date, allows equal dates and open-ended ranges', () => {
    expect(endNotBeforeStart({ startDate: '2025-06-01', endDate: '2025-05-01' }).endDate).toBeDefined();
    expect(endNotBeforeStart({ startDate: '2025-06-01', endDate: '2025-06-01' })).toEqual({});
    expect(endNotBeforeStart({ startDate: '2025-06-01', endDate: '' })).toEqual({});
  });
});
