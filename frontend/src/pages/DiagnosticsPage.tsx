import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Edit,
  ArrowRight,
  Filter,
  FileQuestion,
  HelpCircle
} from 'lucide-react';
import { DiagnosticReport, DiagnosticIssue, QuestionDetail } from '../types';
import { fetchDiagnostics, fetchQuestionDetail } from '../api';
import { Badge } from '../components/Badge';

interface DiagnosticsPageProps {
  onOpenQuestionModal: (question: QuestionDetail, editMode?: boolean) => void;
  onRefreshCount?: (count: number) => void;
}

export const DiagnosticsPage: React.FC<DiagnosticsPageProps> = ({
  onOpenQuestionModal,
  onRefreshCount,
}) => {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');

  useEffect(() => {
    runScan();
  }, []);

  const runScan = async () => {
    setLoading(true);
    try {
      const data = await fetchDiagnostics();
      setReport(data);
      if (onRefreshCount) {
        onRefreshCount(data.total_issues);
      }
    } catch (err) {
      console.error('Failed to run diagnostics scan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFixIssue = async (issue: DiagnosticIssue) => {
    // If target is question ID, open QuestionModal
    try {
      const q = await fetchQuestionDetail(issue.target_id);
      onOpenQuestionModal(q, true);
    } catch {
      alert(`Could not directly open record '${issue.target_id}'. Please inspect via Question UID Lookup.`);
    }
  };

  const filteredIssues = report?.issues.filter((issue) => {
    if (severityFilter === 'ALL') return true;
    return issue.severity === severityFilter;
  }) || [];

  return (
    <div className="space-y-6">
      
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            Data Quality & Troubleshooting Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated integrity scanner detecting broken foreign keys, invalid difficulty levels, missing options, and duplicate test orders.
          </p>
        </div>

        <button
          type="button"
          onClick={runScan}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Scanning Database...' : 'Re-scan Database'}</span>
        </button>
      </div>

      {/* Summary Alert Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Inconsistencies</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{report?.total_issues ?? '...'}</h3>
          </div>
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
            <FileQuestion className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Critical Errors</p>
            <h3 className="text-2xl font-bold text-rose-900 mt-0.5">{report?.critical_count ?? '...'}</h3>
          </div>
          <div className="p-3 rounded-lg bg-rose-100 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Quality Warnings</p>
            <h3 className="text-2xl font-bold text-amber-900 mt-0.5">{report?.warning_count ?? '...'}</h3>
          </div>
          <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
            <HelpCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Issues List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filter by severity:</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium">
              {(['ALL', 'CRITICAL', 'WARNING'] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    severityFilter === sev
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-slate-400">
            Scanned at: {report ? new Date(report.scanned_at).toLocaleTimeString() : '...'}
          </span>
        </div>

        {/* Issue Cards */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="text-center py-16 text-slate-400">
              <div className="inline-block animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2" />
              <p className="text-xs">Running database integrity heuristics...</p>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-sm">No issues detected!</h3>
              <p className="text-xs text-slate-400 mt-1">All database foreign keys, difficulties, and test sequences are consistent.</p>
            </div>
          ) : (
            filteredIssues.map((issue, idx) => (
              <div key={idx} className="p-5 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={issue.severity === 'CRITICAL' ? 'critical' : 'warning'}>
                      {issue.severity}
                    </Badge>
                    <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                      {issue.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{issue.title}</h4>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{issue.description}</p>
                  <p className="text-[11px] text-slate-400">
                    <strong className="text-slate-600">Suggested Action: </strong>
                    {issue.suggested_action}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleFixIssue(issue)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Fix Record</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
};
