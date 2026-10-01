import { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { setPassword } from '@/lib/auth';

interface Props {
  mode: 'invite' | 'recovery';
  email: string;
  onDone: () => void;
  onCancel: () => void;
}

export default function SetPasswordPage({ mode, email, onDone, onCancel }: Props) {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return setError('Password must be at least 8 characters.');
    if (pw !== confirm) return setError('Passwords do not match.');
    setBusy(true);
    setError('');
    const err = await setPassword(pw);
    if (err) {
      setError(err);
      setBusy(false);
      return;
    }
    onDone();
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-700 placeholder-slate-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-xl shadow-slate-200/60">
            <img src="/GD_Solutions.jpeg" alt="GD Solutions" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">AssetHub</h1>
        </div>

        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
          <div>
            <h2 className="mb-1 text-lg font-semibold text-slate-800">
              {mode === 'invite' ? 'Welcome! Set your password' : 'Choose a new password'}
            </h2>
            <p className="text-sm text-slate-400">{email}</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type={show ? 'text' : 'password'} className={inputClass} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password (min 8 characters)" autoComplete="new-password" required />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type={show ? 'text' : 'password'} className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" autoComplete="new-password" required />
          </div>

          <button type="submit" disabled={busy} className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-60">
            {busy ? 'Saving…' : 'Save password & continue'}
          </button>
          <button type="button" onClick={onCancel} className="w-full text-center text-xs text-slate-400 hover:text-slate-600">
            Cancel and sign out
          </button>
        </form>
        <p className="mt-6 text-center text-xs font-medium text-emerald-700">Designed by GD Solutions</p>
      </div>
    </div>
  );
}
