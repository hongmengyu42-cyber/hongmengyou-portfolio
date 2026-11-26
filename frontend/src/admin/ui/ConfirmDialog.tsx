import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/**
 * Native <dialog> opened with showModal(): the browser traps focus inside, makes the rest of the page inert,
 * closes on Escape and returns focus to the trigger. Cancel is focused first, so a stray Enter never deletes.
 */
export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setError(null);
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={() => open && onCancel()}
      onClick={(event) => event.target === ref.current && !busy && onCancel()}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-card border border-line bg-surface p-0 text-ink shadow-lift backdrop:bg-black/50"
    >
      <div className="space-y-4 p-6">
        <h2 id={titleId} className="text-xl font-semibold">
          {title}
        </h2>
        <p className="text-muted">{message}</p>
        {error ? (
          <p role="alert" className="rounded-control border border-accent-text px-3 py-2 text-sm">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-11 rounded-control border border-field px-5 font-medium hover:bg-surface-2 disabled:opacity-60"
          >
            Cancel
          </button>
          <Button onClick={confirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
