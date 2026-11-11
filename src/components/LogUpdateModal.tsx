import { useState } from 'react';
import { X, Save, History } from 'lucide-react';
import type { Asset, ChangeType } from '@/types';
import { CHANGE_TYPES } from '@/types';
import type { AuthUser, Permissions } from '@/lib/auth';
import { describeAssignment } from '@/lib/stock';

interface LogUpdateModalProps {
  asset: Asset;
  currentUser: AuthUser;
  permissions: Permissions;
  onClose: () => void;
  /** Resolve to an error message to show in the form, or null on success */
  onSave: (log: {
    change_type: ChangeType;
    previous_value: string;
    new_value: string;
    updated_by: string;
    assignment?: { assigned_to: string | null; project_name: string | null; assigned_by: string | null };
  }) => Promise<string | null>;
}

export default function LogUpdateModal({ asset, currentUser, permissions, onClose, onSave }: LogUpdateModalProps) {
  const allowedTypes = CHANGE_TYPES.filter((t) => permissions.allowedChangeTypes.includes(t));
  const [changeType, setChangeType] = useState<ChangeType>(allowedTypes[0] ?? 'Status');
  const [previousValue, setPreviousValue] = useState(getCurrentValue(asset, allowedTypes[0] ?? 'Status'));
  const [newValue, setNewValue] = useState('');
  const [updatedBy, setUpdatedBy] = useState(currentUser.displayName);
  const [projectName, setProjectName] = useState('');
  const [assignedBy, setAssignedBy] = useState(currentUser.displayName);
  const [returnToStock, setReturnToStock] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleTypeChange = (type: ChangeType) => {
    setChangeType(type);
    setPreviousValue(getCurrentValue(asset, type));
    setNewValue('');
    setReturnToStock(false);
    setError('');
  };

  const isAssign = changeType === 'Reassignment';

  const handleSubmit = async () => {
    if (!updatedBy.trim()) {
      setError('Your name is required');
      return;
    }
    setError('');

    let payload;
    if (isAssign) {
      if (returnToStock) {
        payload = {
          change_type: changeType,
          previous_value: previousValue,
          new_value: 'In stock',
          updated_by: updatedBy.trim(),
          assignment: { assigned_to: null, project_name: null, assigned_by: null },
        };
      } else {
        if (!newValue.trim()) {
          setError('Enter who the item is being assigned to');
          return;
        }
        const assignment = {
          assigned_to: newValue.trim(),
          project_name: projectName.trim() || null,
          assigned_by: assignedBy.trim() || updatedBy.trim(),
        };
        payload = {
          change_type: changeType,
          previous_value: previousValue,
          new_value: describeAssignment(assignment),
          updated_by: updatedBy.trim(),
          assignment,
        };
      }
    } else {
      if (!newValue.trim()) {
        setError('New value is required');
        return;
      }
      payload = {
        change_type: changeType,
        previous_value: previousValue,
        new_value: newValue,
        updated_by: updatedBy.trim(),
      };
    }

    setSaving(true);
    const message = await onSave(payload);
    if (message) {
      setError(message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Log Update</h2>
              <p className="text-xs text-slate-400">{asset.asset_tag} — {asset.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          )}

          <Field label="Change Type">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CHANGE_TYPES.map((type) => {
                const isAllowed = allowedTypes.includes(type);
                return (
                  <button
                    key={type}
                    disabled={!isAllowed}
                    onClick={() => handleTypeChange(type)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                      changeType === type
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                        : isAllowed
                          ? 'border-slate-200 text-slate-500 hover:border-slate-300'
                          : 'cursor-not-allowed border-slate-100 text-slate-300 opacity-60'
                    }`}
                  >
                    {type === 'Reassignment' ? 'Assign' : type}
                  </button>
                );
              })}
            </div>
            {allowedTypes.length < CHANGE_TYPES.length && (
              <p className="mt-2 text-xs text-slate-400">Your role allows: {allowedTypes.join(', ')} changes only.</p>
            )}
          </Field>

          {isAssign ? (
            <>
              <Field label="Currently">
                <input value={previousValue} readOnly className={`${inputClass} bg-slate-50 text-slate-500`} />
              </Field>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={returnToStock}
                  onChange={(e) => setReturnToStock(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                Return this item to stock (unassign)
              </label>

              {!returnToStock && (
                <>
                  <Field label="Assign To *">
                    <input
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="Installer / team name"
                      className={inputClass}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Name of Project">
                      <input
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Sharma Residence 5kW"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Assigned By">
                      <input
                        value={assignedBy}
                        onChange={(e) => setAssignedBy(e.target.value)}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Previous Value">
                <input
                  value={previousValue}
                  onChange={(e) => setPreviousValue(e.target.value)}
                  placeholder="What it was before"
                  className={inputClass}
                />
              </Field>
              <Field label="New Value *">
                <input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="What it is now"
                  className={inputClass}
                />
              </Field>
            </div>
          )}

          <Field label="Updated By *">
            <input
              value={updatedBy}
              onChange={(e) => setUpdatedBy(e.target.value)}
              placeholder="Your name"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : isAssign ? 'Save Assignment' : 'Save Log Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}

function getCurrentValue(asset: Asset, type: ChangeType): string {
  switch (type) {
    case 'Status':
      return asset.status;
    case 'Location':
      return asset.location ?? '';
    case 'Reassignment':
      return describeAssignment(asset);
    case 'Note':
      return asset.notes ?? '';
  }
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</label>
      {children}
    </div>
  );
}
