import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { TestExplorerPage } from './pages/TestExplorerPage';
import { QuestionLookupPage } from './pages/QuestionLookupPage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { QuestionModal } from './components/QuestionModal';
import { QuestionDetail } from './types';
import { fetchStats, fetchDiagnostics } from './api';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [databaseMode, setDatabaseMode] = useState('Local Development SQLite');
  const [diagnosticsCount, setDiagnosticsCount] = useState<number>(0);

  // Active question for inspection or editing modal
  const [activeQuestion, setActiveQuestion] = useState<QuestionDetail | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    // Initial fetch for database mode and diagnostic warnings
    fetchStats()
      .then((s) => setDatabaseMode(s.database_mode))
      .catch(console.error);

    fetchDiagnostics()
      .then((d) => setDiagnosticsCount(d.total_issues))
      .catch(console.error);
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleOpenQuestionModal = (question: QuestionDetail, editMode = false) => {
    setActiveQuestion(question);
    setIsEditMode(editMode);
    setIsQuestionModalOpen(true);
  };

  const handleGlobalQuestionFound = (question: QuestionDetail) => {
    handleOpenQuestionModal(question, true);
    showToast('success', `Question '${question.id.slice(0, 8)}...' loaded into editor.`);
  };

  const handleGlobalSearchError = (message: string) => {
    showToast('error', message);
  };

  const handleQuestionSaved = (updated: QuestionDetail) => {
    setActiveQuestion(updated);
    showToast('success', `Changes to question '${updated.id.slice(0, 8)}...' saved successfully!`);
    // Refresh diagnostics count in background
    fetchDiagnostics().then((d) => setDiagnosticsCount(d.total_issues)).catch(console.error);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      
      {/* Top Navbar */}
      <Navbar
        onQuestionFound={handleGlobalQuestionFound}
        onSearchError={handleGlobalSearchError}
        databaseMode={databaseMode}
        totalIssuesCount={diagnosticsCount}
        onNavigateToDiagnostics={() => setActiveTab('diagnostics')}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          diagnosticsCount={diagnosticsCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigateToTests={() => setActiveTab('tests')}
              onOpenQuestionModal={handleOpenQuestionModal}
            />
          )}

          {activeTab === 'tests' && (
            <TestExplorerPage onOpenQuestionModal={handleOpenQuestionModal} />
          )}

          {activeTab === 'lookup' && (
            <QuestionLookupPage
              onOpenEditModal={(q) => handleOpenQuestionModal(q, true)}
            />
          )}

          {activeTab === 'diagnostics' && (
            <DiagnosticsPage
              onOpenQuestionModal={handleOpenQuestionModal}
              onRefreshCount={setDiagnosticsCount}
            />
          )}

          {activeTab === 'audit' && <AuditLogPage />}
        </main>
      </div>

      {/* Global Question View/Edit Modal */}
      <QuestionModal
        question={activeQuestion}
        isOpen={isQuestionModalOpen}
        onClose={() => {
          setIsQuestionModalOpen(false);
          setActiveQuestion(null);
        }}
        onSaved={handleQuestionSaved}
        initialEditMode={isEditMode}
      />

      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
