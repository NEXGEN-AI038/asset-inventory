import { useState } from 'react';
import { X, Mail, AlertCircle } from 'lucide-react';
import type { MemberRole } from '@/lib/adminApi';
import { ROLE_LABELS } from '@/lib/auth';

interface InviteModalProps {
  title: string;
  subtitle?: string;
  roles: MemberRole[];
  defaultRole: MemberRole;
  onClose: () => void;
  onSubmit: (v: { email: string; displayName: string; role: MemberRole }) => Promise<void>;
}

export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100';

export default function InviteModal({ title, subtitle, roles, defaultRole, onClose, onSubmit }: InviteModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>(defaultRole);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSubmit({ email: email.trim(), displayName: displayName.trim(), role });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">{title}</h2>
              {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Full name</label>
            <input className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Jane Doe" required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Email</label>
            <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Role</label>
            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as MemberRole)}>
              {roles.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-400">They will get an email with a link to set their own password.</p>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {busy ? 'Sending…' : 'Send invite'}
          </button>
        </div>
      </form>
    </div>
  );
}
