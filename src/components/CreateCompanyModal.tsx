import { useState } from 'react';
import { X, Building2, AlertCircle } from 'lucide-react';
import { inputClass } from './InviteModal';

interface Props {
  onClose: () => void;
  onSubmit: (v: { name: string; adminName: string; adminEmail: string }) => Promise<void>;
}

export default function CreateCompanyModal({ onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSubmit({ name: name.trim(), adminName: adminName.trim(), adminEmail: adminEmail.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-slate-800">New company</h2>
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
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Company name</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corp" required />
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">First company admin</p>
            <div className="space-y-3">
              <input className={inputClass} value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Admin full name" required />
              <input type="email" className={inputClass} value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@company.com" required />
            </div>
          </div>
          <p className="text-xs text-slate-400">The admin gets an email to set their password, then can invite their own team.</p>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {busy ? 'Creating…' : 'Create & invite'}
          </button>
        </div>
      </form>
    </div>
  );
}
