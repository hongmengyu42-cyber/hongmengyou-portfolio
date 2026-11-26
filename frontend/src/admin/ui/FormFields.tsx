import type { ChangeEvent, ReactNode } from 'react';
import type { Errors, FieldSpec, Values } from './formSpec';
import { flag, text } from './formSpec';

export const inputClass =
  'w-full rounded-control border border-field bg-surface px-4 py-2.5 text-ink placeholder:text-muted ' +
  'aria-[invalid=true]:border-2 aria-[invalid=true]:border-accent-text';

const describedBy = (id: string, hint?: string, error?: string) =>
  [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;

export function Field({ id, label, required, hint, error, children }: { id: string; label: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-accent-text">
            {' '}
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-accent-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface Props {
  idPrefix: string;
  specs: FieldSpec[];
  values: Values;
  errors: Errors;
  onChange: (name: string, value: string | boolean) => void;
}

/** Renders every field from its spec, wiring label, hint, error and ARIA attributes consistently. */
export function FormFields({ idPrefix, specs, values, errors, onChange }: Props) {
  return (
    <>
      {specs.map((spec) => {
        const id = `${idPrefix}-${spec.name}`;
        const error = errors[spec.name];
        const common = {
          id,
          name: spec.name,
          'aria-invalid': error ? (true as const) : undefined,
          'aria-describedby': describedBy(id, spec.hint, error),
          'aria-required': spec.required ? (true as const) : undefined,
        };
        const handle = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
          onChange(spec.name, event.target.value);

        if (spec.kind === 'checkbox') {
          return (
            <div key={spec.name} className="flex items-start gap-3">
              <input
                id={id}
                name={spec.name}
                type="checkbox"
                checked={flag(values, spec.name)}
                onChange={(event) => onChange(spec.name, event.target.checked)}
                aria-describedby={describedBy(id, spec.hint)}
                className="mt-1 h-5 w-5 shrink-0 accent-accent"
              />
              <div>
                <label htmlFor={id} className="text-sm font-medium">
                  {spec.label}
                </label>
                {spec.hint ? (
                  <p id={`${id}-hint`} className="text-sm text-muted">
                    {spec.hint}
                  </p>
                ) : null}
              </div>
            </div>
          );
        }

        let control: ReactNode;
        if (spec.kind === 'textarea') {
          control = <textarea {...common} value={text(values, spec.name)} onChange={handle} rows={spec.rows ?? 4} className={inputClass} />;
        } else if (spec.kind === 'select') {
          control = (
            <select {...common} value={text(values, spec.name)} onChange={handle} className={inputClass}>
              {spec.required ? null : <option value="">None</option>}
              {spec.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        } else {
          control = (
            <input
              {...common}
              type={spec.kind === 'text' ? 'text' : spec.kind}
              inputMode={spec.kind === 'number' ? 'numeric' : undefined}
              autoComplete={spec.autoComplete}
              value={text(values, spec.name)}
              onChange={handle}
              className={inputClass}
            />
          );
        }
        return (
          <Field key={spec.name} id={id} label={spec.label} required={spec.required} hint={spec.hint} error={error}>
            {control}
          </Field>
        );
      })}
    </>
  );
}
