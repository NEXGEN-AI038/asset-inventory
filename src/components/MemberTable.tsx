import { RefreshCw, Trash2 } from 'lucide-react';
import type { Member, MemberRole } from '@/lib/adminApi';
import { ROLE_LABELS } from '@/lib/auth';

interface MemberTableProps {
  members: Member[];
  currentEmail: string;
  /** Roles the signed-in person may assign (also decides which rows are editable) */
  assignableRoles: MemberRole[];
  busyId: string | null;
  onChangeRole: (m: Member, role: MemberRole) => void;
  onResend: (m: Member) => void;
  onRemove: (m: Member) => void;
}

export default function MemberTable({ members, currentEmail, assignableRoles, busyId, onChangeRole, onResend, onRemove }: MemberTableProps) {
  if (members.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-slate-400">No team members yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-5 py-3 font-semibold">Name</th>
            <th className="px-5 py-3 font-semibold">Role</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {members.map((m) => {
            const isSelf = m.email.toLowerCase() === currentEmail.toLowerCase();
            const editable = !isSelf && assignableRoles.includes(m.role);
            const busy = busyId === m.user_id;
            return (
              <tr key={m.user_id} className="hover:bg-slate-50/60">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-700">{m.display_name || m.email}</p>
                  <p className="text-xs text-slate-400">{m.email}</p>
                </td>
                <td className="px-5 py-3">
                  {editable ? (
                    <select
                      value={m.role}
                      disabled={busy}
                      onChange={(e) => onChangeRole(m, e.target.value as MemberRole)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-600 focus:border-indigo-400 focus:outline-none"
                    >
                      {assignableRoles.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-slate-600">{ROLE_LABELS[m.role]}</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {m.status === 'active' ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Active</span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">Invite pending</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    {editable && m.status === 'invited' && (
                      <button
                        onClick={() => onResend(m)}
                        disabled={busy}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                        title="Send the invite email again"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Resend
                      </button>
                    )}
                    {editable && (
                      <button
                        onClick={() => onRemove(m)}
                        disabled={busy}
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        title="Remove user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
