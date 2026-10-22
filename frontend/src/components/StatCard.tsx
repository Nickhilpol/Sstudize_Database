import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme: 'indigo' | 'emerald' | 'amber' | 'blue';
  onClick?: () => void;
  clickableHint?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme,
  onClick,
  clickableHint = 'Click to explore',
}) => {
  const schemeClasses = {
    indigo: {
      border: 'hover:border-indigo-300',
      iconBg: 'bg-indigo-50 text-indigo-600',
      badge: 'text-indigo-600',
    },
    emerald: {
      border: 'hover:border-emerald-300',
      iconBg: 'bg-emerald-50 text-emerald-600',
      badge: 'text-emerald-600',
    },
    amber: {
      border: 'hover:border-amber-300',
      iconBg: 'bg-amber-50 text-amber-600',
      badge: 'text-amber-600',
    },
    blue: {
      border: 'hover:border-blue-300',
      iconBg: 'bg-blue-50 text-blue-600',
      badge: 'text-blue-600',
    },
  }[colorScheme];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition-all duration-200 ${
        onClick
          ? `cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${schemeClasses.border}`
          : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`p-3 rounded-lg ${schemeClasses.iconBg} transition-transform group-hover:scale-110`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {onClick && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 group-hover:text-slate-600">
          <span>{clickableHint}</span>
          <span className="font-semibold transition-transform group-hover:translate-x-1">→</span>
        </div>
      )}
    </div>
  );
};
