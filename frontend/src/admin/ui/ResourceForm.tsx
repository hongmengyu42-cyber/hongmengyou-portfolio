import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ApiError } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { FormFields } from './FormFields';
import { validateFields, type Errors, type FieldSpec, type Values } from './formSpec';

interface Props {
  idPrefix: string;
  specs: FieldSpec[];
  initial: Values;
  submitLabel: string;
  onSubmit: (values: Values) => Promise<void>;
  onCancel?: () => void;
  /** Rules that involve several fields (for example end date after start date). Keyed by field name. */
  crossValidate?: (values: Values) => Errors;
  children?: ReactNode;
}

/** A failed save always ends up visible: on the offending field, or as a form-level alert. */
function describeFailure(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return error.message;
    if (error.status >= 500) return 'The server had a problem saving this. Please try again.';
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export function ResourceForm({ idPrefix, specs, initial, submitLabel, onSubmit, onCancel, crossValidate, children }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const focus = (name: string) => (formRef.current?.elements.namedItem(name) as HTMLElement | null)?.focus();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const found: Errors = { ...validateFields(specs, values), ...(crossValidate?.(values) ?? {}) };
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = specs.find((spec) => found[spec.name]);
      if (first) focus(first.name);
      else setFormError(Object.values(found)[0] ?? 'Please check the form.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      const mapped: Errors = {};
      if (error instanceof ApiError && error.status === 400) {
        for (const spec of specs) {
          const message = error.problem?.errors?.[spec.name];
          if (message) mapped[spec.name] = message;
        }
        setErrors(mapped);
      }
      const hasFieldErrors = Object.keys(mapped).length > 0;
      setFormError(hasFieldErrors ? 'Some details were not accepted. Check the highlighted fields.' : describeFailure(error));
      const first = specs.find((spec) => mapped[spec.name]);
      if (first) focus(first.name);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
      <FormFields
        idPrefix={idPrefix}
        specs={specs}
        values={values}
        errors={errors}
        onChange={(name, value) => setValues((current) => ({ ...current, [name]: value }))}
      />
      {children}
      {formError ? (
        <p role="alert" className="rounded-control border border-accent-text px-4 py-3 text-sm">
          {formError}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
