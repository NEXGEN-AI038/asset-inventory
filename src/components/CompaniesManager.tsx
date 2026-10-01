import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, ChevronDown, Loader2, Plus, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { adminApi, type Company, type Member, type MemberRole } from '@/lib/adminApi';
import type { AuthUser } from '@/lib/auth';
import MemberTable from './MemberTable';
import InviteModal from './InviteModal';
import CreateCompanyModal from './CreateCompanyModal';
import ConfirmDialog from './ConfirmDialog';

const ASSIGNABLE: MemberRole[] = ['CompanyAdmin', 'AssetManager', 'User'];

export default function CompaniesManager({ currentUser }: { currentUser: AuthUser }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [invitingTo, setInvitingTo] = useState<Company | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);

  const load = useCallback(async () => {
    try {
      const [{ data, error: cErr }, m] = await Promise.all([
        supabase.from('companies').select('*').order('created_at', { ascending: false }),
        adminApi.listMembers(),
      ]);
      if (cErr) throw new Error(cErr.message);
      setCompanies((data ?? []) as Company[]);
      setMembers(m);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load companies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const byCompany = useMemo(() => {
    const map = new Map<string, Member[]>();
    for (const m of members) map.set(m.company_id, [...(map.get(m.company_id) ?? []), m]);
    return map;
  }, [members]);

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
          <h2 className="text-xl font-bold text-slate-800">Companies</h2>
          <p className="text-sm text-slate-400">Each company's assets and audit logs are private to that company.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> New company
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

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">No companies yet</p>
          <p className="mt-1 text-xs text-slate-400">Create one and invite its admin to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {companies.map((c) => {
            const list = byCompany.get(c.id) ?? [];
            const isOpen = open === c.id;
            const pending = list.filter((m) => m.status === 'invited').length;
            return (
              <div key={c.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button onClick={() => setOpen(isOpen ? null : c.id)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400">
                        {list.length} {list.length === 1 ? 'member' : 'members'}
                        {pending > 0 && ` · ${pending} invite${pending === 1 ? '' : 's'} pending`}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100">
                    <div className="flex justify-end px-5 py-3">
                      <button
                        onClick={() => setInvitingTo(c)}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <UserPlus className="h-3.5 w-3.5" /> Invite user
                      </button>
                    </div>
                    <MemberTable
                      members={list}
                      currentEmail={currentUser.email}
                      assignableRoles={ASSIGNABLE}
                      busyId={busyId}
                      onChangeRole={(m, role) => run(m, () => adminApi.changeRole(m.user_id, role), `Role updated for ${m.display_name || m.email}.`)}
                      onResend={(m) => run(m, () => adminApi.resendInvite(m.user_id), `Invite re-sent to ${m.email}.`)}
                      onRemove={(m) => setRemoving(m)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {creating && (
        <CreateCompanyModal
          onClose={() => setCreating(false)}
          onSubmit={async ({ name, adminName, adminEmail }) => {
            await adminApi.createCompany(name, adminName, adminEmail);
            setCreating(false);
            setNotice(`${name} created. An invite was sent to ${adminEmail}.`);
            await load();
          }}
        />
      )}

      {invitingTo && (
        <InviteModal
          title="Invite a user"
          subtitle={invitingTo.name}
          roles={ASSIGNABLE}
          defaultRole="CompanyAdmin"
          onClose={() => setInvitingTo(null)}
          onSubmit={async ({ email, displayName, role }) => {
            await adminApi.inviteUser(email, displayName, role, invitingTo.id);
            setInvitingTo(null);
            setNotice(`Invite sent to ${email}.`);
            await load();
          }}
        />
      )}

      {removing && (
        <ConfirmDialog
          title="Remove user"
          message={`Remove ${removing.display_name || removing.email}? They will lose access immediately.`}
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
