import { Package, DollarSign, MonitorCheck, Wrench, AlertTriangle } from 'lucide-react';
import type { Asset, AuditLog } from '@/types';

interface StatCardsProps {
  assets: Asset[];
  auditLogs: AuditLog[];
}

export default function StatCards({ assets, auditLogs }: StatCardsProps) {
  const totalAssets = assets.length;
  const totalValue = assets.reduce((sum, a) => sum + a.purchase_price, 0);
  const inUse = assets.filter((a) => a.status === 'In Use').length;
  const maintenancePending = assets.filter((a) => a.status === 'Under Maintenance').length;
  const unreported = auditLogs.filter((l) => !l.reported_to_management).length;

  const cards = [
    {
      label: 'Total Assets',
      value: totalAssets.toLocaleString(),
      icon: Package,
      iconBg: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Total Asset Value',
      value: `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Active / In Use',
      value: inUse.toLocaleString(),
      icon: MonitorCheck,
      iconBg: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Maintenance Pending',
      value: maintenancePending.toLocaleString(),
      icon: Wrench,
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Unreported Changes',
      value: unreported.toLocaleString(),
      icon: AlertTriangle,
      iconBg: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50"
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg} transition-transform duration-200 group-hover:scale-110`}>
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
            <p className="mt-1 text-xs font-medium text-slate-400">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
}
