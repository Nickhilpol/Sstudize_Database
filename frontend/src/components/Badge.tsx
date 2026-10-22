import React from 'react';

interface BadgeProps {
  variant?: 'easy' | 'medium' | 'hard' | 'active' | 'inactive' | 'info' | 'published' | 'draft' | 'warning' | 'critical';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'info', children, className = '' }) => {
  const styles = {
    easy: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-emerald-500/10',
    medium: 'bg-amber-50 text-amber-700 border-amber-200/80 ring-amber-500/10',
    hard: 'bg-rose-50 text-rose-700 border-rose-200/80 ring-rose-500/10',
    active: 'bg-green-50 text-green-700 border-green-200 ring-green-500/10',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-500/10',
    published: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10',
    draft: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10',
    info: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/10',
    warning: 'bg-amber-50 text-amber-800 border-amber-300 ring-amber-500/20',
    critical: 'bg-rose-50 text-rose-800 border-rose-300 ring-rose-500/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border shadow-xs ring-1 ring-inset ${
        styles[variant] || styles.info
      } ${className}`}
    >
      {children}
    </span>
  );
};
