import { Package, IndianRupee, PackageCheck, HardHat, Wrench, AlertTriangle } from 'lucide-react';
import { formatINR } from '@/lib/currency';
import { isAssigned, isAvailable } from '@/lib/stock';
import type { Asset, AuditLog } from '@/types';

interface StatCardsProps {
  assets: Asset[];
  auditLogs: AuditLog[];
}

export default function StatCards({ assets, auditLogs }: StatCardsProps) {
  const totalItems = assets.length;
  const available = assets.filter(isAvailable).length;
  const assignedItems = assets.filter(isAssigned);
  const assigned = assignedItems.length;
  const projects = new Set(assignedItems.map((a) => (a.project_name ?? '').trim().toLowerCase()).filter(Boolean)).size;
  const totalValue = assets.reduce((sum, a) => sum + a.purchase_price, 0);
  const maintenancePending = assets.filter((a) => a.status === 'Under Maintenance').length;
  const unreported = auditLogs.filter((l) => !l.reported_to_management).length;

  const cards = [
    {
      label: 'Total Items',
      value: totalItems.toLocaleString(),
      sub: 'In the stock register',
      icon: Package,
      iconBg: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Available in Stock',
      value: available.toLocaleString(),
      sub: `of ${totalItems.toLocaleString()} items`,
      icon: PackageCheck,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Assigned to Projects',
      value: assigned.toLocaleString(),
      sub: projects > 0 ? `across ${projects} project${projects === 1 ? '' : 's'}` : 'No active assignments',
      icon: HardHat,
      iconBg: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Total Stock Value',
      value: formatINR(totalValue),
      sub: 'At purchase price',
      icon: IndianRupee,
      iconBg: 'bg-teal-50 text-teal-600',
    },
    {
      label: 'Maintenance Pending',
      value: maintenancePending.toLocaleString(),
      sub: 'Not available for assignment',
      icon: Wrench,
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Unreported Changes',
      value: unreported.toLocaleString(),
      sub: 'Waiting for the weekly summary',
      icon: AlertTriangle,
      iconBg: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">{card.label}</p>
                <p className="mt-2 truncate text-3xl font-bold text-slate-800">{card.value}</p>
                <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconBg} transition-transform duration-200 group-hover:scale-110`}>
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
