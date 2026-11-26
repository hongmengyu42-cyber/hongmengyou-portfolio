import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { adminApi } from '../api/admin';
import { ApiError, setUnauthorizedHandler } from '../api/client';

type Status = 'checking' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: Status;
  email: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Session state for the dashboard. The session itself is an HttpOnly cookie the browser manages; nothing secret
 * is ever stored in JavaScript. If any admin request later returns 401 (session expired), the registered
 * handler flips this to "anonymous" and the route guard sends the user back to the login page.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ status: Status; email: string | null }>({ status: 'checking', email: null });

  useEffect(() => {
    setUnauthorizedHandler(() => setState({ status: 'anonymous', email: null }));
    const controller = new AbortController();
    adminApi
      .me(controller.signal)
      .then((me) => setState({ status: 'authenticated', email: me.email }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (!(error instanceof ApiError) || error.status !== 401) console.error('Could not check the admin session:', error);
        setState({ status: 'anonymous', email: null });
      });
    return () => {
      controller.abort();
      setUnauthorizedHandler(null);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await adminApi.login(email, password);
    const me = await adminApi.me();
    setState({ status: 'authenticated', email: me.email });
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } finally {
      setState({ status: 'anonymous', email: null }); // leave the dashboard even if the request failed
    }
  }, []);

  const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
