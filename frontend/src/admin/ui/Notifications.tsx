import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../../components/ui/Icon';

type Kind = 'success' | 'error';
interface Notice {
  id: number;
  kind: Kind;
  message: string;
}

const NotifyContext = createContext<(message: string, kind?: Kind) => void>(() => undefined);

/** Screen-reader-friendly toasts. Successes fade after a few seconds; errors stay until dismissed. */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const nextId = useRef(1);
  const dismiss = useCallback((id: number) => setNotices((current) => current.filter((notice) => notice.id !== id)), []);
  const notify = useCallback((message: string, kind: Kind = 'success') => {
    setNotices((current) => [...current, { id: nextId.current++, kind, message }]);
  }, []);
  const value = useMemo(() => notify, [notify]);

  return (
    <NotifyContext.Provider value={value}>
      {children}
      <div role="region" aria-label="Notifications" className="fixed bottom-4 right-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {notices.map((notice) => (
          <Toast key={notice.id} notice={notice} onDismiss={dismiss} />
        ))}
      </div>
    </NotifyContext.Provider>
  );
}

function Toast({ notice, onDismiss }: { notice: Notice; onDismiss: (id: number) => void }) {
  useEffect(() => {
    if (notice.kind !== 'success') return;
    const timer = window.setTimeout(() => onDismiss(notice.id), 6000);
    return () => window.clearTimeout(timer);
  }, [notice, onDismiss]);

  return (
    <div role={notice.kind === 'error' ? 'alert' : 'status'} className="card flex items-start gap-3 p-4">
      <span className="mt-0.5 text-accent-text">
        <Icon name={notice.kind === 'error' ? 'x' : 'check'} size={18} />
      </span>
      <p className="flex-1 text-sm">{notice.message}</p>
      <button type="button" onClick={() => onDismiss(notice.id)} aria-label="Dismiss notification" className="grid h-8 w-8 place-items-center rounded-control hover:bg-surface-2">
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}

export function useNotify(): (message: string, kind?: Kind) => void {
  return useContext(NotifyContext);
}
