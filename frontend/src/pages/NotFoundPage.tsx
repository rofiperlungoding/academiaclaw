import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-sm animate-fade-in">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-zinc-900">
          Page not found
        </h1>
        <p className="mt-2 muted">
          The page you are looking for has moved or does not exist.
        </p>
        <div className="mt-7 flex gap-2">
          <button onClick={() => navigate('/app')} className="btn-primary">
            Go to dashboard
          </button>
          <button onClick={() => navigate(-1)} className="btn-secondary">
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
