import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { Button } from '../components/ui/Button';
import { usePageTitle } from '../lib/usePageTitle';
import { useAuth } from './AuthProvider';
import { Field } from './ui/FormFields';
import { inputClass } from './ui/FormFields';

/** Same wording for every authentication failure, so the form never reveals whether an email exists. */
function describe(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Invalid email or password.';
    if (error.status === 429) return 'Too many attempts. Please wait a minute and try again.';
    if (error.status === 0) return error.message;
  }
  return 'Could not sign in. Please try again.';
}

export function LoginPage() {
  usePageTitle('Sign in');
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === 'authenticated') return <Navigate to={from} replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const emailVal = ((form.elements.namedItem('email') as HTMLInputElement)?.value ?? email).trim();
    const passwordVal = (form.elements.namedItem('password') as HTMLInputElement)?.value ?? password;

    if (!emailVal || !passwordVal) return setError('Enter your email and password.');
    setBusy(true);
    setError(null);
    try {
      await login(emailVal, passwordVal);
      navigate(from, { replace: true });
    } catch (cause) {
      setError(describe(cause));
      setPassword(''); // never keep a rejected password in the field
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-hero px-5 py-12">
      <div className="card w-full max-w-md p-8">
        <p className="eyebrow mb-2">Admin</p>
        <h1 className="mb-6 text-3xl font-semibold">Sign in</h1>
        <form onSubmit={submit} noValidate className="space-y-5">
          <Field id="login-email" label="Email">
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              className={inputClass}
            />
          </Field>
          <Field id="login-password" label="Password">
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              className={inputClass}
            />
          </Field>
          {error ? (
            <p role="alert" className="rounded-control border border-accent-text px-4 py-3 text-sm">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-accent-text underline-offset-4 hover:underline">
          Back to the site
        </Link>
      </div>
    </main>
  );
}
