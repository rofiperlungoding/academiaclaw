import { useNavigate } from 'react-router-dom';
import { Brain, Home, ArrowLeft, Search } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-brand-100/20 blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[200px] h-[200px] rounded-full bg-violet-100/15 blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-md text-center animate-fade-in">
        {/* Animated 404 */}
        <div className="mb-8 relative">
          <div className="text-[120px] sm:text-[160px] font-bold tracking-tighter leading-none gradient-text opacity-20 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center shadow-glow-sm animate-bounce-subtle">
              <Search className="w-9 h-9 text-brand-500" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          Sepertinya halaman yang Anda cari sudah dipindahkan, dihapus,
          atau mungkin belum ada di kurikulum semester ini.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/app')}
            className="btn-primary text-sm px-5 py-2.5 w-full sm:w-auto"
          >
            <Home className="w-4 h-4" />
            <span>Ke Dashboard</span>
          </button>
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary text-sm px-5 py-2.5 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
        </div>

        {/* Brand footer */}
        <div className="mt-12 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center">
            <Brain className="w-3 h-3 text-white" />
          </div>
          <span>AcademiaClaw · Academic Copilot</span>
        </div>
      </div>
    </div>
  );
}
