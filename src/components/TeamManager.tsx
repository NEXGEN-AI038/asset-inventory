import { useCallback, useEffect, useState } from 'react';
import { Loader2, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { adminApi, type Member, type MemberRole } from '@/lib/adminApi';
import type { AuthUser } from '@/lib/auth';
import MemberTable from './MemberTable';
import InviteModal from './InviteModal';
import ConfirmDialog from './ConfirmDialog';

const ASSIGNABLE: MemberRole[] = ['AssetManager', 'User'];

export default function TeamManager({ currentUser }: { currentUser: AuthUser }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);

  const load = useCallback(async () => {
    try {
      setMembers(await adminApi.listMembers());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load team');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (m: Member, fn: () => Promise<unknown>, success: string) => {
    setBusyId(m.user_id);
    setNotice('');
    setError('');
    try {
      await fn();
      setNotice(success);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Team</h2>
          <p className="text-sm text-slate-400">Invite people from {currentUser.companyName} and manage their access.</p>
        </div>
        <button
          onClick={() => setInviting(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4" /> Invite user
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {notice && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {notice}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : (
          <MemberTable
            members={members}
            currentEmail={currentUser.email}
            assignableRoles={ASSIGNABLE}
            busyId={busyId}
            onChangeRole={(m, role) => run(m, () => adminApi.changeRole(m.user_id, role), `${m.display_name || m.email} is now ${role === 'User' ? 'a User' : 'an Asset Manager'}.`)}
            onResend={(m) => run(m, () => adminApi.resendInvite(m.user_id), `Invite re-sent to ${m.email}.`)}
            onRemove={(m) => setRemoving(m)}
          />
        )}
      </div>

      {inviting && (
        <InviteModal
          title="Invite a team member"
          subtitle={currentUser.companyName}
          roles={ASSIGNABLE}
          defaultRole="User"
          onClose={() => setInviting(false)}
          onSubmit={async ({ email, displayName, role }) => {
            await adminApi.inviteUser(email, displayName, role);
            setInviting(false);
            setNotice(`Invite sent to ${email}.`);
            await load();
          }}
        />
      )}

      {removing && (
        <ConfirmDialog
          title="Remove user"
          message={`Remove ${removing.display_name || removing.email}? They will lose access immediately. Their past audit log entries stay.`}
          confirmLabel="Remove"
          onCancel={() => setRemoving(null)}
          onConfirm={() => {
            const m = removing;
            setRemoving(null);
            run(m, () => adminApi.removeUser(m.user_id), `${m.display_name || m.email} was removed.`);
          }}
        />
      )}
    </div>
  );
}
