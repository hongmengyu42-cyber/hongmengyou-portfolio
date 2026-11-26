import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { api, ApiError } from '../../api/client';
import { validateContact, type ContactErrors, type ContactValues } from '../../lib/validation';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

const EMPTY: ContactValues = { name: '', email: '', subject: '', message: '' };
const FIELD_KEYS: Array<keyof ContactValues> = ['name', 'email', 'subject', 'message'];
type Status = 'idle' | 'submitting' | 'success';

const inputClass =
  'w-full rounded-control border border-field bg-surface px-4 py-3 text-ink placeholder:text-muted ' +
  'aria-[invalid=true]:border-2 aria-[invalid=true]:border-accent-text';

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-accent-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Maps a failed request to a message the visitor can act on. Never shows raw server text for unexpected errors. */
function describeFailure(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return 'You’ve sent several messages recently. Please try again in a little while.';
    if (error.status === 0) return error.message;
    if (error.status === 400) return 'Some details were not accepted. Please check the highlighted fields.';
  }
  return 'Something went wrong while sending your message. Please try again.';
}

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<ContactValues>(EMPTY);
  const [website, setWebsite] = useState(''); // honeypot: humans never see it
  const [errors, setErrors] = useState<ContactErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const props = (key: keyof ContactValues) => ({
    id: `contact-${key}`,
    name: key,
    value: values[key],
    onChange,
    className: inputClass,
    'aria-invalid': errors[key] ? (true as const) : undefined,
    'aria-describedby': errors[key] ? `contact-${key}-error` : undefined,
  });

  const focusField = (key: keyof ContactValues) => {
    (formRef.current?.elements.namedItem(key) as HTMLElement | null)?.focus();
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const found = validateContact(values);
    setErrors(found);
    const firstInvalid = FIELD_KEYS.find((key) => found[key]);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }

    setStatus('submitting');
    try {
      await api.submitContact({
        name: values.name.trim(),
        email: values.email.trim(),
        subject: values.subject.trim(),
        message: values.message.trim(),
        website,
      });
      setValues(EMPTY);
      setStatus('success');
    } catch (error) {
      const serverErrors: ContactErrors = {};
      if (error instanceof ApiError && error.status === 400) {
        for (const key of FIELD_KEYS) {
          const message = error.problem?.errors?.[key];
          if (message) serverErrors[key] = message;
        }
        setErrors(serverErrors);
      }
      setFormError(describeFailure(error));
      setStatus('idle');
      const first = FIELD_KEYS.find((key) => serverErrors[key]);
      if (first) focusField(first);
    }
  }

  if (status === 'success') {
    return (
      <div role="status" className="card flex flex-col items-start gap-4 p-8">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-accent-text">
          <Icon name="check" />
        </span>
        <p className="text-xl font-semibold">Message sent. Thank you!</p>
        <p className="text-muted">I’ll read it and get back to you.</p>
        <Button variant="secondary" onClick={() => setStatus('idle')}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="card space-y-5 p-6 md:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="contact-name" label="Name" error={errors.name}>
          <input {...props('name')} type="text" autoComplete="name" maxLength={100} />
        </Field>
        <Field id="contact-email" label="Email" error={errors.email}>
          <input {...props('email')} type="email" autoComplete="email" maxLength={254} />
        </Field>
      </div>
      <Field id="contact-subject" label="Subject" error={errors.subject}>
        <input {...props('subject')} type="text" maxLength={150} />
      </Field>
      <Field id="contact-message" label="Message" error={errors.message}>
        <textarea {...props('message')} rows={6} maxLength={5000} />
        <p className="mt-1.5 text-right font-mono text-xs text-muted">{values.message.length} / 5000</p>
      </Field>

      {/* Honeypot: off-screen, skipped by keyboard and screen readers. Bots that fill every field reveal themselves. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      {formError ? (
        <p role="alert" className="rounded-control border border-accent-text px-4 py-3 text-sm">
          {formError}
        </p>
      ) : null}
      <Button type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}
