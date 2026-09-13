import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Loader2, Eye, EyeOff } from 'lucide-react';

// Placeholder demo account seeded by the backend. Not a real person.
const DEMO_NIM = '2200000001';
const DEMO_PASSWORD = 'demo1234';

type Mode = 'login' | 'register';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [program, setProgram] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    navigate('/app', { replace: true });
    return null;
  }

  const run = async (fn: () => Promise<boolean>) => {
    setError('');
    setIsLoading(true);
    try {
      if (await fn()) navigate('/app', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      if (!nim.trim() || !password) return setError('Student ID and password are required.');
      return run(() => login(nim.trim(), password));
    }
    if (!nim.trim() || !name.trim() || !password) {
      return setError('Student ID, name, and password are required.');
    }
    run(() =>
      register({
        nim: nim.trim(),
        name: name.trim(),
        password,
        university: university.trim() || undefined,
        faculty: faculty.trim() || undefined,
        program: program.trim() || undefined,
      })
    );
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="mx-auto w-full max-w-5xl px-6 h-14 flex items-center">
        <Link to="/" className="flex items-center gap-2 text-zinc-900">
          <Brain className="w-4 h-4" />
          <span className="text-sm font-semibold">AcademiaClaw</span>
        </Link>
      </header>

      <main className="flex-1 flex items-start justify-center px-6 pt-12 pb-20">
        <div className="w-full max-w-[352px]">
          <h1 className="text-xl font-semibold tracking-[-0.02em] text-zinc-900">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="mt-1.5 muted">
            {mode === 'login'
              ? 'Use your student ID and password.'
              : 'Fill in your academic details. Works for any campus.'}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="nim">Student ID</label>
              <input
                id="nim"
                className="input-field"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="2200000001"
                autoComplete="username"
                autoFocus
              />
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="label" htmlFor="name">Full name</label>
                  <input
                    id="name"
                    className="input-field"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="university">University</label>
                  <input
                    id="university"
                    className="input-field"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="Example University"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label" htmlFor="faculty">Faculty</label>
                    <input
                      id="faculty"
                      className="input-field"
                      value={faculty}
                      onChange={(e) => setFaculty(e.target.value)}
                      placeholder="Computer Science"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="program">Programme</label>
                    <input
                      id="program"
                      className="input-field"
                      value={program}
                      onChange={(e) => setProgram(e.target.value)}
                      placeholder="Computer Engineering"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  className="input-field pr-9"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'At least 4 characters' : '••••••••'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-0 h-9 w-9 flex items-center justify-center text-zinc-400 hover:text-zinc-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-[13px] text-red-600 animate-fade-in">{error}</p>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {mode === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="divider flex-1" />
            <span className="text-[11px] text-zinc-400">or</span>
            <div className="divider flex-1" />
          </div>

          <button
            onClick={() => run(() => login(DEMO_NIM, DEMO_PASSWORD))}
            disabled={isLoading}
            className="btn-secondary w-full mt-6"
          >
            Sign in with the demo account
          </button>
          <p className="mt-2 text-[11px] text-zinc-400">
            ID {DEMO_NIM} · password {DEMO_PASSWORD}
          </p>

          <p className="mt-8 text-[13px] text-zinc-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="font-medium text-brand-600 hover:text-brand-700 hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 py-6 text-xs text-zinc-400 border-t border-zinc-100">
        AcademiaClaw · IDwebhost AI Competition 2026
      </footer>
    </div>
  );
}
