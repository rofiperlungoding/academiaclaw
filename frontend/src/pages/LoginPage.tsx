import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Loader2, GraduationCap, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  if (isAuthenticated) {
    navigate('/app', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nim.trim() || !password.trim()) {
      setError('NIM dan password harus diisi.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsLoading(true);
    try {
      const ok = await login(nim, password);
      if (ok) {
        navigate('/app', { replace: true });
      }
    } catch {
      setError('Gagal masuk. Silakan coba lagi.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setNim('255150307111073');
    setPassword('demo1234');
    setError('');
    setIsLoading(true);
    try {
      const ok = await login('255150307111073', 'demo1234');
      if (ok) navigate('/app', { replace: true });
    } catch {
      setError('Gagal masuk.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-violet-900 flex-col justify-between p-10">
        {/* Decorative orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-20 w-[350px] h-[350px] rounded-full bg-brand-500/15 blur-[100px] animate-float" />
          <div className="absolute bottom-20 left-10 w-[250px] h-[250px] rounded-full bg-violet-500/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }} />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-semibold text-white tracking-tight">AcademiaClaw</span>
          </div>
          <p className="text-xs text-white/40 font-medium">Academic Copilot</p>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold text-white tracking-tight leading-tight text-balance">
            Autonomous Agentic AI
            <br />
            <span className="text-brand-300">untuk Akademik Anda.</span>
          </h2>
          <p className="text-sm text-white/50 leading-relaxed max-w-md">
            Sistem yang memahami materi perkuliahan melalui Knowledge Graph,
            mengoptimalkan daya ingat dengan FSRS-6, dan bertindak proaktif
            sebelum Anda meminta.
          </p>

          <div className="flex items-center gap-6 pt-2">
            <div>
              <p className="text-2xl font-bold text-white">3</p>
              <p className="text-[10px] text-white/40 font-medium">Core AI Modules</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-2xl font-bold text-white">4GB</p>
              <p className="text-[10px] text-white/40 font-medium">VPS Constraint</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-2xl font-bold text-white">83.6%</p>
              <p className="text-[10px] text-white/40 font-medium">RAG Win-rate</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] text-white/30 font-medium">
            IDwebhost AI Competition 2026 · Powered by LightRAG · FSRS-6 · OpenClaw
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center shadow-glow-sm">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold text-slate-900 block leading-tight">AcademiaClaw</span>
              <span className="text-[10px] text-slate-400 font-medium">Academic Copilot</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Selamat Datang
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Masuk dengan NIM Anda untuk mengakses copilot akademik.
            </p>
          </div>

          {/* Demo login shortcut */}
          <button
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-50 border border-brand-100 hover:bg-brand-100 transition-colors text-left group disabled:opacity-60"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-brand-900">Login Demo — Muhammad Rofi</p>
              <p className="text-[10px] text-brand-600 truncate">NIM: 255150307111073 · Teknik Komputer · FILKOM UB</p>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">atau login manual</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form
            onSubmit={handleSubmit}
            className={`space-y-4 ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
            style={
              shake
                ? {
                    animation: 'shake 0.4s ease-in-out',
                  }
                : undefined
            }
          >
            <div className="space-y-1.5">
              <label htmlFor="nim" className="text-xs font-medium text-slate-700 block">
                NIM (Nomor Induk Mahasiswa)
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="nim"
                  type="text"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  placeholder="255150307111073"
                  className="input-field pl-10"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-slate-700 block">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700 animate-fade-in">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-400">
            Demo app untuk IDwebhost AI Competition. Tidak ada data pengguna yang disimpan di server.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
        }
      `}</style>
    </div>
  );
}
