import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Asset, AuditLog, AssetInput, ChangeType } from '@/types';
import { assetsToCsv, downloadFile } from '@/lib/csv';
import { loadSession, clearSession, getPermissions, type AuthUser } from '@/lib/auth';

import Header, { type Tab } from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import InventoryView from '@/components/InventoryView';
import AuditLogViewer from '@/components/AuditLogViewer';
import CsvImporter from '@/components/CsvImporter';
import AssetFormModal from '@/components/AssetFormModal';
import LogUpdateModal from '@/components/LogUpdateModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoginPage from '@/components/LoginPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => loadSession());
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [showImporter, setShowImporter] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null | 'new'>(null);
  const [loggingAsset, setLoggingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);

  const fetchAssets = useCallback(async () => {
    const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Failed to load assets:', error); return; }
    setAssets(data as Asset[]);
  }, []);

  const fetchLogs = useCallback(async () => {
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Failed to load audit logs:', error); return; }
    setAuditLogs(data as AuditLog[]);
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([fetchAssets(), fetchLogs()]);
      setLoading(false);
    })();
  }, [fetchAssets, fetchLogs]);

  const handleSaveAsset = async (input: AssetInput) => {
    if (editingAsset && editingAsset !== 'new') {
      const { error } = await supabase
        .from('assets')
        .update({
          name: input.name,
          category: input.category,
          assigned_to: input.assigned_to,
          location: input.location,
          purchase_date: input.purchase_date,
          purchase_price: input.purchase_price,
          status: input.status,
          notes: input.notes,
        })
        .eq('id', editingAsset.id);
      if (error) { console.error('Failed to update asset:', error); return; }
    } else {
      const { error } = await supabase.from('assets').insert(input);
      if (error) { console.error('Failed to create asset:', error); return; }
    }
    await fetchAssets();
    setEditingAsset(null);
  };

  const handleDeleteAsset = async () => {
    if (!deletingAsset) return;
    const { error } = await supabase.from('assets').delete().eq('id', deletingAsset.id);
    if (error) { console.error('Failed to delete asset:', error); return; }
    await Promise.all([fetchAssets(), fetchLogs()]);
    setDeletingAsset(null);
  };

  const handleLogUpdate = async (log: {
    change_type: ChangeType;
    previous_value: string;
    new_value: string;
    updated_by: string;
  }) => {
    if (!loggingAsset) return;

    const { error: logError } = await supabase.from('audit_logs').insert({
      asset_id: loggingAsset.id,
      asset_tag: loggingAsset.asset_tag,
      asset_name: loggingAsset.name,
      change_type: log.change_type,
      previous_value: log.previous_value,
      new_value: log.new_value,
      updated_by: log.updated_by,
      reported_to_management: false,
    });
    if (logError) { console.error('Failed to create audit log:', logError); return; }

    const updates: Partial<Asset> = {};
    if (log.change_type === 'Status') updates.status = log.new_value as Asset['status'];
    else if (log.change_type === 'Location') updates.location = log.new_value;
    else if (log.change_type === 'Reassignment') updates.assigned_to = log.new_value;
    else if (log.change_type === 'Note') updates.notes = log.new_value;

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase.from('assets').update(updates).eq('id', loggingAsset.id);
      if (updateError) { console.error('Failed to update asset after log:', updateError); }
    }

    await Promise.all([fetchAssets(), fetchLogs()]);
    setLoggingAsset(null);
  };

  const handleImport = async (records: AssetInput[]) => {
    const { error } = await supabase.from('assets').insert(records);
    if (error) { console.error('Failed to import assets:', error); return; }
    await fetchAssets();
    setShowImporter(false);
  };

  const handleExport = () => {
    const csvInputs: AssetInput[] = assets.map((a) => ({
      asset_tag: a.asset_tag,
      name: a.name,
      category: a.category,
      assigned_to: a.assigned_to,
      location: a.location,
      purchase_date: a.purchase_date,
      purchase_price: a.purchase_price,
      status: a.status,
      notes: a.notes,
    }));
    const csv = assetsToCsv(csvInputs);
    downloadFile(`assets_export_${new Date().toISOString().split('T')[0]}.csv`, csv);
  };

  const handleMarkReported = async (logIds: string[]) => {
    const { error } = await supabase
      .from('audit_logs')
      .update({ reported_to_management: true })
      .in('id', logIds);
    if (error) { console.error('Failed to mark logs as reported:', error); return; }
    await fetchLogs();
  };

  const unreportedCount = auditLogs.filter((l) => !l.reported_to_management).length;

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} />;
  }

  const permissions = getPermissions(currentUser.role);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header activeTab={activeTab} onTabChange={setActiveTab} unreportedCount={unreportedCount} currentUser={currentUser} onLogout={handleLogout} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard assets={assets} auditLogs={auditLogs} />}
            {activeTab === 'inventory' && (
              <InventoryView
                assets={assets}
                permissions={permissions}
                onEdit={(asset) => setEditingAsset(asset)}
                onLogUpdate={(asset) => setLoggingAsset(asset)}
                onDelete={(asset) => setDeletingAsset(asset)}
                onImportClick={() => setShowImporter(true)}
                onExportClick={handleExport}
                onAddClick={() => setEditingAsset('new')}
              />
            )}
            {activeTab === 'audit' && (
              <AuditLogViewer logs={auditLogs} onMarkReported={handleMarkReported} />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white/70 px-4 py-4 text-center">
        <p className="text-xs font-medium text-slate-500">Designed by <span className="text-emerald-700">GD Solutions</span></p>
      </footer>

      {showImporter && (
        <CsvImporter onClose={() => setShowImporter(false)} onImport={handleImport} />
      )}

      {editingAsset !== null && (
        <AssetFormModal
          asset={editingAsset === 'new' ? null : editingAsset}
          onClose={() => setEditingAsset(null)}
          onSave={handleSaveAsset}
        />
      )}

      {loggingAsset && (
        <LogUpdateModal
          asset={loggingAsset}
          currentUser={currentUser}
          permissions={permissions}
          onClose={() => setLoggingAsset(null)}
          onSave={handleLogUpdate}
        />
      )}

      {deletingAsset && (
        <ConfirmDialog
          title="Delete Asset"
          message={`Are you sure you want to delete "${deletingAsset.name}" (${deletingAsset.asset_tag})? This will also remove all related audit log entries. This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteAsset}
          onCancel={() => setDeletingAsset(null)}
        />
      )}
    </div>
  );
}
