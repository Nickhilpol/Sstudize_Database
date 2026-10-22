import React, { useState } from 'react';
import { Search, Database, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';
import { lookupQuestionByUid } from '../api';
import { QuestionDetail } from '../types';

interface NavbarProps {
  onQuestionFound: (question: QuestionDetail) => void;
  onSearchError: (message: string) => void;
  databaseMode: string;
  totalIssuesCount?: number;
  onNavigateToDiagnostics?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onQuestionFound,
  onSearchError,
  databaseMode,
  totalIssuesCount = 0,
  onNavigateToDiagnostics,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;

    setSearching(true);
    try {
      const q = await lookupQuestionByUid(query);
      onQuestionFound(q);
      setSearchTerm('');
    } catch (err: any) {
      onSearchError(err.message || `No question found matching UID "${query}".`);
    } finally {
      setSearching(false);
    }
  };

  const isSupabase = databaseMode.toLowerCase().includes('supabase') || databaseMode.toLowerCase().includes('postgres');

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-indigo-200">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                SStudizer Database
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                Admin
              </span>
            </div>
            <a
              href="https://sstudize.co.in/"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-slate-400 hover:text-indigo-600 transition flex items-center gap-1"
            >
              sstudize.co.in <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        {/* Global UID Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter exact Question UID (e.g. 84f2...) and press Enter"
              className="w-full text-xs rounded-xl bg-slate-100/90 border border-transparent pl-10 pr-20 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition focus:outline-none"
            />
            <button
              type="submit"
              disabled={searching || !searchTerm.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition cursor-pointer"
            >
              {searching ? 'Finding...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Right Status Indicators */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Data Quality Warning Pill */}
          {totalIssuesCount > 0 && onNavigateToDiagnostics && (
            <button
              type="button"
              onClick={onNavigateToDiagnostics}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>{totalIssuesCount} Data Issues</span>
            </button>
          )}

          {/* Database Mode Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-slate-50 border-slate-200 text-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
              }`}
            />
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{databaseMode}</span>
            <span className="sm:hidden">{isSupabase ? 'Supabase' : 'SQLite'}</span>
          </div>
        </div>

      </div>
    </header>
  );
};
