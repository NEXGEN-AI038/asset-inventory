import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signIn, sendPasswordReset, type AuthUser } from '@/lib/auth';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
  initialError?: string | null;
}

export default function LoginPage({ onLogin, initialError }: LoginPageProps) {
  const [mode, setMode] = useState<'signin' | 'forgot'>('signin');
  const [notice, setNotice] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialError ?? '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      if (mode === 'forgot') {
        await sendPasswordReset(email);
        setNotice('If an account exists for that email, a reset link is on its way.');
        setLoading(false);
        return;
      }
      const user = await signIn(email, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid email or password. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Could not complete the request. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-xl shadow-slate-200/60">
            <img src="/GD_Solutions.jpeg" alt="GD Solutions" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">AssetHub</h1>
          <p className="mt-1 text-sm text-slate-400">Asset Management Portal</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
          <h2 className="mb-1 text-lg font-semibold text-slate-800">{mode === 'forgot' ? 'Reset your password' : 'Welcome back'}</h2>
          <p className="mb-6 text-sm text-slate-400">
            {mode === 'forgot' ? "Enter your email and we'll send you a reset link" : 'Sign in to access your dashboard'}
          </p>

          {notice && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {notice}
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 placeholder-slate-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>
            </div>

            {mode === 'signin' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-700 placeholder-slate-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                  Forgot password?
                </button>
              </div>
            </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                mode === 'forgot' ? 'Send reset link' : 'Sign In'
              )}
            </button>
            {mode === 'forgot' && (
              <button type="button" onClick={() => { setMode('signin'); setNotice(''); setError(''); }} className="w-full text-center text-xs text-slate-400 hover:text-slate-600">
                Back to sign in
              </button>
            )}
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Access is by invitation only. Contact your company administrator.
        </p>
        <p className="mt-2 text-center text-xs font-medium text-emerald-700">Designed by GD Solutions</p>
      </div>
    </div>
  );
}
