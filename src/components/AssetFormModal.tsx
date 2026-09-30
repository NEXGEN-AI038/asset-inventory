import { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { Asset, AssetInput, AssetStatus, AssetCategory } from '@/types';
import { ASSET_STATUSES, ASSET_CATEGORIES } from '@/types';

interface AssetFormModalProps {
  asset: Asset | null;
  onClose: () => void;
  onSave: (input: AssetInput) => void;
}

const emptyInput: AssetInput = {
  asset_tag: '',
  name: '',
  category: 'Other',
  assigned_to: '',
  location: '',
  purchase_date: '',
  purchase_price: 0,
  status: 'Active',
  notes: '',
};

export default function AssetFormModal({ asset, onClose, onSave }: AssetFormModalProps) {
  const [form, setForm] = useState<AssetInput>(
    asset
      ? {
          asset_tag: asset.asset_tag,
          name: asset.name,
          category: asset.category,
          assigned_to: asset.assigned_to ?? '',
          location: asset.location ?? '',
          purchase_date: asset.purchase_date ?? '',
          purchase_price: asset.purchase_price,
          status: asset.status,
          notes: asset.notes ?? '',
        }
      : emptyInput
  );
  const [error, setError] = useState('');

  const update = (field: keyof AssetInput, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.asset_tag.trim() || !form.name.trim()) {
      setError('Asset Tag and Name are required');
      return;
    }
    onSave({
      ...form,
      assigned_to: form.assigned_to?.trim() || null,
      location: form.location?.trim() || null,
      purchase_date: form.purchase_date || null,
      notes: form.notes?.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-800">
            {asset ? 'Edit Asset' : 'Add New Asset'}
          </h2>
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

          <div className="grid grid-cols-2 gap-4">
            <Field label="Asset Tag *">
              <input
                value={form.asset_tag}
                onChange={(e) => update('asset_tag', e.target.value)}
                placeholder="AST-001"
                className={inputClass}
              />
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                className={inputClass}
              >
                {ASSET_STATUSES.map((s: AssetStatus) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Asset Name *">
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Dell Latitude 5520"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className={inputClass}
              >
                {ASSET_CATEGORIES.map((c: AssetCategory) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Assigned To">
              <input
                value={form.assigned_to ?? ''}
                onChange={(e) => update('assigned_to', e.target.value)}
                placeholder="John Smith / Marketing"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Location">
              <input
                value={form.location ?? ''}
                onChange={(e) => update('location', e.target.value)}
                placeholder="HQ - Floor 2"
                className={inputClass}
              />
            </Field>
            <Field label="Purchase Date">
              <input
                type="date"
                value={form.purchase_date ?? ''}
                onChange={(e) => update('purchase_date', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Purchase Price ($)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.purchase_price}
              onChange={(e) => update('purchase_price', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              placeholder="Additional notes about this asset..."
              className={`${inputClass} resize-none`}
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
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <Save className="h-4 w-4" /> {asset ? 'Save Changes' : 'Add Asset'}
          </button>
        </div>
      </div>
    </div>
  );
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
