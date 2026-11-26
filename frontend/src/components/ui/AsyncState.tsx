import type { ReactNode } from 'react';
import type { ApiError } from '../../api/client';
import { Button } from './Button';

interface AsyncStateProps {
  loading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  /** What a failed request is called in the message, e.g. "projects". */
  label: string;
  skeleton: ReactNode;
  isEmpty?: boolean;
  empty?: ReactNode;
  children: ReactNode;
}

/** The one place that renders loading, error (with retry) and empty states, so no screen can forget one. */
export function AsyncState({ loading, error, onRetry, label, skeleton, isEmpty = false, empty, children }: AsyncStateProps) {
  if (loading) {
    return (
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading {label}…</span>
        {skeleton}
      </div>
    );
  }
  if (error) {
    return (
      <div role="alert" className="card flex flex-col items-start gap-3 p-6">
        <p className="font-medium">We couldn’t load the {label}.</p>
        <p className="text-sm text-muted">{error.message}</p>
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }
  if (isEmpty) return <>{empty}</>;
  return <>{children}</>;
}
