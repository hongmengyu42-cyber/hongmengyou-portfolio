import { useCallback, useEffect, useState } from 'react';
import { ApiError } from './client';

export interface ApiState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Runs `fetcher` on mount (and on reload), cancels it on unmount, and exposes explicit
 * loading / error / data states so no screen ever silently swallows a failure.
 */
export function useApi<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: readonly unknown[] = []): ApiState<T> {
  const [state, setState] = useState<Omit<ApiState<T>, 'reload'>>({ data: null, error: null, loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => ({ ...previous, loading: true, error: null }));
    fetcher(controller.signal)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        const error =
          cause instanceof ApiError ? cause : new ApiError(0, cause instanceof Error ? cause.message : 'Unexpected error');
        setState({ data: null, error, loading: false });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `deps` is the caller's explicit dependency list
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}
