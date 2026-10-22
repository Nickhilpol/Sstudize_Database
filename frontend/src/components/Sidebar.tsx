import React from 'react';
import {
  LayoutDashboard,
  FileCheck2,
  SearchCode,
  ShieldAlert,
  History,
  BookOpen,
  ChevronRight
} from 'lucide-react';

export type NavTab = 'dashboard' | 'tests' | 'lookup' | 'diagnostics' | 'audit';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  diagnosticsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  diagnosticsCount = 0,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard & Chapters',
      description: 'Subjects, chapters & stats',
      icon: LayoutDashboard,
    },
    {
      id: 'tests' as NavTab,
      label: 'Test Explorer',
      description: 'Ordered test questions',
      icon: FileCheck2,
    },
    {
      id: 'lookup' as NavTab,
      label: 'Question UID Lookup',
      description: 'Direct question inspection',
      icon: SearchCode,
    },
    {
      id: 'diagnostics' as NavTab,
      label: 'Data Quality & Warnings',
      description: 'Troubleshoot inconsistencies',
      icon: ShieldAlert,
      badge: diagnosticsCount > 0 ? diagnosticsCount : undefined,
      badgeVariant: 'warning',
    },
    {
      id: 'audit' as NavTab,
      label: 'Audit Trail',
      description: 'Question edit history',
      icon: History,
    },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200/90 flex lg:flex-col shrink-0 p-3 lg:p-4 gap-1">
      <div className="hidden lg:block mb-4 px-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Navigation</p>
      </div>

      <nav className="flex lg:flex-col gap-1 w-full overflow-x-auto lg:overflow-x-visible">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center justify-between w-full p-2.5 rounded-xl text-left transition cursor-pointer shrink-0 lg:shrink select-none ${
                isActive
                  ? 'bg-indigo-50/90 text-indigo-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="hidden sm:block lg:block">
                  <div className="text-xs font-semibold leading-tight">{item.label}</div>
                  <div className="text-[10px] text-slate-400 hidden lg:block">{item.description}</div>
                </div>
              </div>

              {item.badge !== undefined && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Helpful info badge in sidebar */}
      <div className="hidden lg:block mt-auto pt-4 border-t border-slate-100 px-2 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 font-medium text-slate-600">
          <BookOpen className="w-3.5 h-3.5" />
          <span>SStudize Platform</span>
        </div>
        <p>Database curation tool. IDs are strictly preserved during editing.</p>
      </div>
    </aside>
  );
};
