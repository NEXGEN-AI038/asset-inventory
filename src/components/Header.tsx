import { Boxes, LayoutDashboard, ClipboardList, LogOut, Users, Building2 } from 'lucide-react';
import { ROLE_LABELS, type AuthUser } from '@/lib/auth';

export type Tab = 'dashboard' | 'inventory' | 'audit' | 'team' | 'companies';

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  unreportedCount: number;
  currentUser: AuthUser;
  onLogout: () => void;
}

type TabDef = { id: Tab; label: string; icon: typeof LayoutDashboard };

const ASSET_TABS: TabDef[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'audit', label: 'Audit Log', icon: ClipboardList },
];

export function tabsForRole(role: AuthUser['role']): TabDef[] {
  if (role === 'PlatformAdmin') return [{ id: 'companies', label: 'Companies', icon: Building2 }];
  if (role === 'CompanyAdmin') return [...ASSET_TABS, { id: 'team', label: 'Team', icon: Users }];
  return ASSET_TABS;
}

export default function Header({ activeTab, onTabChange, unreportedCount, currentUser, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm">
              <img src="/GD_Solutions.jpeg" alt="GD Solutions" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-slate-800">AssetHub</h1>
              <p className="text-xs text-slate-400">{currentUser.companyName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              {tabsForRole(currentUser.role).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 sm:px-4 ${
                      isActive
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.id === 'audit' && unreportedCount > 0 && (
                      <span className="ml-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {unreportedCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-700">{currentUser.displayName}</p>
                <p className="text-xs text-slate-400">{ROLE_LABELS[currentUser.role]}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-slate-700 text-xs font-bold text-white">
                {currentUser.displayName.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={onLogout}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
