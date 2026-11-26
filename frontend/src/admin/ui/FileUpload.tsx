import { useId, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { MAX_UPLOAD_BYTES } from '../../lib/files';
import { inputClass } from './FormFields';

interface Props {
  label: string;
  accept: string;
  buttonLabel: string;
  /** When set, an alt-text field is shown and required (images must always have alt text). */
  altLabel?: string;
  validate: (file: File) => string | null;
  /** Optional step that runs after validation, e.g. resizing a large photo in the browser. */
  prepare?: (file: File) => Promise<File>;
  /** Helper text shown under the file picker. */
  hint?: string;
  onUpload: (file: File, altText: string) => Promise<void>;
}

/** File picker with client-side checks and a visible result for success and failure. */
export function FileUpload({ label, accept, buttonLabel, altLabel, validate, prepare, hint, onUpload }: Props) {
  const id = useId();
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<'optimizing' | 'uploading'>('uploading');
  const [round, setRound] = useState(0); // changing the key clears the native file input after a success

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) return setError('Choose a file first.');
    const fileProblem = validate(file);
    if (fileProblem) return setError(fileProblem);
    if (altLabel && !altText.trim()) return setError(`${altLabel} is required so the image is accessible.`);
    setError(null);
    setBusy(true);
    try {
      let toUpload = file;
      if (prepare) {
        setStage('optimizing');
        toUpload = await prepare(file);
      }
      if (toUpload.size > MAX_UPLOAD_BYTES) {
        setError('The image is still larger than 5 MB after optimizing. Try a smaller image.');
        return;
      }
      setStage('uploading');
      await onUpload(toUpload, altText.trim());
      setFile(null);
      setAltText('');
      setRound((n) => n + 1);
    } catch (cause) {
      setError(cause instanceof ApiError && cause.status < 500 ? cause.message : 'The upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <div>
        <label htmlFor={`${id}-file`} className="mb-1.5 block text-sm font-medium">
          {label}
        </label>
        <input
          key={round}
          id={`${id}-file`}
          type="file"
          accept={accept}
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setError(null);
          }}
          aria-describedby={[hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined}
          className="block w-full text-sm file:mr-4 file:min-h-11 file:rounded-control file:border-0 file:bg-surface-2 file:px-4 file:font-medium file:text-ink"
        />
        {hint ? (
          <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
            {hint}
          </p>
        ) : null}
      </div>
      {altLabel ? (
        <div>
          <label htmlFor={`${id}-alt`} className="mb-1.5 block text-sm font-medium">
            {altLabel} <span aria-hidden="true" className="text-accent-text">*</span>
          </label>
          <input id={`${id}-alt`} type="text" maxLength={200} value={altText} onChange={(event) => setAltText(event.target.value)} className={inputClass} aria-required="true" />
        </div>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-accent-text">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" disabled={busy}>
        <Icon name="upload" size={18} /> {busy ? (stage === 'optimizing' ? 'Optimizing…' : 'Uploading…') : buttonLabel}
      </Button>
    </form>
  );
}
