import { safeExternalUrl } from '../../lib/safeUrl';

export type FieldKind = 'text' | 'textarea' | 'select' | 'number' | 'date' | 'url' | 'email' | 'checkbox';

export interface Option {
  value: string;
  label: string;
}

/** Declarative description of one form field. The same spec drives rendering AND validation. */
export interface FieldSpec {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  /** Maximum length for text, or maximum value for numbers. */
  max?: number;
  /** Minimum value for numbers. */
  min?: number;
  rows?: number;
  options?: Option[];
  hint?: string;
  autoComplete?: string;
}

export type Values = Record<string, string | boolean>;
export type Errors = Record<string, string>;

export const text = (values: Values, name: string): string => {
  const value = values[name];
  return typeof value === 'string' ? value : '';
};
export const flag = (values: Values, name: string): boolean => values[name] === true;
export const blankToNull = (value: string): string | null => (value.trim() === '' ? null : value.trim());

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mirrors the backend's Bean Validation rules so most mistakes are caught before a request is sent. */
export function validateFields(specs: FieldSpec[], values: Values): Errors {
  const errors: Errors = {};
  for (const spec of specs) {
    if (spec.kind === 'checkbox') continue;
    const value = text(values, spec.name).trim();
    if (!value) {
      if (spec.required) errors[spec.name] = `${spec.label} is required.`;
      continue;
    }
    if (spec.kind !== 'number' && spec.max !== undefined && value.length > spec.max) {
      errors[spec.name] = `${spec.label} must be ${spec.max} characters or fewer.`;
      continue;
    }
    const problem = kindProblem(spec, value);
    if (problem) errors[spec.name] = problem;
  }
  return errors;
}

function kindProblem(spec: FieldSpec, value: string): string | null {
  switch (spec.kind) {
    case 'url':
      return /\s/.test(value) || safeExternalUrl(value) === null ? 'Enter a valid http or https URL.' : null;
    case 'email':
      return EMAIL.test(value) ? null : 'Enter a valid email address.';
    case 'date': {
      const valid = /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
      return valid ? null : 'Enter a valid date.';
    }
    case 'number': {
      const number = Number(value);
      if (!Number.isInteger(number)) return 'Enter a whole number.';
      if (spec.min !== undefined && number < spec.min) return `${spec.label} must be at least ${spec.min}.`;
      if (spec.max !== undefined && number > spec.max) return `${spec.label} must be at most ${spec.max}.`;
      return null;
    }
    case 'select':
      return spec.options?.some((option) => option.value === value) === false ? `Choose a valid ${spec.label.toLowerCase()}.` : null;
    default:
      return null;
  }
}

/** Cross-field rule shared by experience and education: an end date cannot precede the start date. */
export function endNotBeforeStart(values: Values, start = 'startDate', end = 'endDate'): Errors {
  const from = text(values, start);
  const to = text(values, end);
  return from && to && to < from ? { [end]: 'End date must not be before the start date.' } : {};
}
