import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  HelpCircle,
  FolderTree,
  FileCheck,
  Search,
  Filter,
  Eye,
  Edit,
  ArrowUpDown,
  ChevronDown,
  X,
  Layers,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import {
  DashboardStats,
  Subject,
  Chapter,
  QuestionSummary,
  QuestionDetail
} from '../types';
import {
  fetchStats,
  fetchSubjects,
  fetchChapters,
  fetchChapterQuestions,
  fetchQuestionDetail,
  fetchSubjectChapters
} from '../api';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { MathText } from '../components/MathText';
import { QuestionModal } from '../components/QuestionModal';

interface DashboardPageProps {
  onNavigateToTests: () => void;
  onOpenQuestionModal: (question: QuestionDetail, editMode?: boolean) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToTests,
  onOpenQuestionModal,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  // Filters
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [anomaliesOnly, setAnomaliesOnly] = useState(false);

  // Subject Modal interaction (When Total Subjects card is clicked)
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [activeSubjectChapters, setActiveSubjectChapters] = useState<{
    subject: Subject;
    chapters: Chapter[];
  } | null>(null);

  // Selected Chapter for Question Drawer / Inspection
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [chapterQuestions, setChapterQuestions] = useState<QuestionSummary[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, subjectsData] = await Promise.all([
        fetchStats(),
        fetchSubjects(),
      ]);
      setStats(statsData);
      setSubjects(subjectsData);
      await loadChaptersData();
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadChaptersData = async (subjectId = selectedSubjectId, search = searchQuery, diff = selectedDifficulty, anom = anomaliesOnly) => {
    setChaptersLoading(true);
    try {
      const chData = await fetchChapters({
        subject_id: subjectId || undefined,
        search: search || undefined,
        difficulty: diff || undefined,
        anomalies_only: anom || undefined,
      });
      setChapters(chData);
    } catch (err) {
      console.error('Failed to load chapters:', err);
    } finally {
      setChaptersLoading(false);
    }
  };

  const handleFilterChange = (newSubjectId: string, newSearch: string, newDiff: string, newAnom: boolean) => {
    setSelectedSubjectId(newSubjectId);
    setSearchQuery(newSearch);
    setSelectedDifficulty(newDiff);
    setAnomaliesOnly(newAnom);
    loadChaptersData(newSubjectId, newSearch, newDiff, newAnom);
  };

  // Open Subject Details Modal
  const handleSubjectCardClick = () => {
    setShowSubjectModal(true);
  };

  // View a Subject's chapters inside Subject Modal
  const handleSubjectClickInModal = async (subject: Subject) => {
    try {
      const chs = await fetchSubjectChapters(subject.id);
      setActiveSubjectChapters({ subject, chapters: chs });
    } catch (err) {
      console.error('Failed to load subject chapters:', err);
    }
  };

  // Open Chapter's question list in Drawer
  const handleOpenChapterDrawer = async (chapter: Chapter) => {
    setActiveChapter(chapter);
    setDrawerLoading(true);
    try {
      const qs = await fetchChapterQuestions(chapter.id);
      setChapterQuestions(qs);
    } catch (err) {
      console.error('Failed to load chapter questions:', err);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Click on a question row to view / edit
  const handleQuestionAction = async (questionId: string, editMode: boolean) => {
    try {
      const q = await fetchQuestionDetail(questionId);
      onOpenQuestionModal(q, editMode);
    } catch (err) {
      console.error('Failed to fetch question detail:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title & Intro */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Dashboard & Chapter Explorer
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Overview of platform question statistics, chapter inventories, and inline question curation.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Subjects"
          value={stats?.total_subjects ?? '...'}
          subtitle="Click to view all subjects"
          icon={BookOpen}
          colorScheme="indigo"
          onClick={handleSubjectCardClick}
          clickableHint="Browse Subjects"
        />
        <StatCard
          title="Total Questions"
          value={stats?.total_questions ?? '...'}
          subtitle={`${stats?.easy_questions || 0} Easy · ${stats?.medium_questions || 0} Med · ${stats?.hard_questions || 0} Hard`}
          icon={HelpCircle}
          colorScheme="emerald"
          clickableHint="Unique questions"
        />
        <StatCard
          title="Total Chapters"
          value={stats?.total_chapters ?? '...'}
          subtitle="Click to reset table filters"
          icon={FolderTree}
          colorScheme="amber"
          onClick={() => handleFilterChange('', '', '', false)}
          clickableHint="View Chapters Table"
        />
        <StatCard
          title="Total Tests"
          value={stats?.total_tests ?? '...'}
          subtitle={`${stats?.total_tests_published || 0} Published · ${stats?.total_tests_draft || 0} Draft`}
          icon={FileCheck}
          colorScheme="blue"
          onClick={onNavigateToTests}
          clickableHint="Open Test Explorer"
        />
      </div>

      {/* Chapter Explorer Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* Table Header & Search Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Chapter Question Inventory Explorer</h2>
              <p className="text-xs text-slate-500">
                Filter chapters by subject, difficulty, or search by Chapter Name or ID.
              </p>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{chapters.length}</span> chapters
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search chapter name or ID..."
                value={searchQuery}
                onChange={(e) =>
                  handleFilterChange(selectedSubjectId, e.target.value, selectedDifficulty, anomaliesOnly)
                }
                className="w-full text-xs rounded-xl bg-white border border-slate-300 pl-8 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Subject Dropdown Filter */}
            <div>
              <select
                value={selectedSubjectId}
                onChange={(e) =>
                  handleFilterChange(e.target.value, searchQuery, selectedDifficulty, anomaliesOnly)
                }
                className="w-full text-xs rounded-xl bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.display_name} ({s.chapter_count} ch)
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <select
                value={selectedDifficulty}
                onChange={(e) =>
                  handleFilterChange(selectedSubjectId, searchQuery, e.target.value, anomaliesOnly)
                }
                className="w-full text-xs rounded-xl bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">All Difficulty Levels</option>
                <option value="easy">Has Easy Questions</option>
                <option value="medium">Has Medium Questions</option>
                <option value="hard">Has Hard Questions</option>
              </select>
            </div>

            {/* Discrepancy / Anomalies Toggle */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={anomaliesOnly}
                  onChange={(e) =>
                    handleFilterChange(selectedSubjectId, searchQuery, selectedDifficulty, e.target.checked)
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Show only count discrepancies
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Chapters Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Chapter Name</th>
                <th className="py-3 px-4 font-mono">Chapter ID</th>
                <th className="py-3 px-4 text-center">Easy</th>
                <th className="py-3 px-4 text-center">Medium</th>
                <th className="py-3 px-4 text-center">Hard</th>
                <th className="py-3 px-4 text-center font-bold">Total</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chaptersLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full mb-2" />
                    <p>Loading chapter data...</p>
                  </td>
                </tr>
              ) : chapters.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No chapters matched your search filters.
                  </td>
                </tr>
              ) : (
                chapters.map((ch) => (
                  <tr
                    key={ch.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-3 px-4 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span>{ch.subject_display_name || 'Subject'}</span>
                        {ch.grade && (
                          <span className="text-[10px] text-slate-400 font-mono">({ch.grade})</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <button
                        type="button"
                        onClick={() => handleOpenChapterDrawer(ch)}
                        className="hover:text-indigo-600 hover:underline transition cursor-pointer text-left"
                      >
                        {ch.display_name || ch.name}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      <span title={ch.id}>{ch.id.slice(0, 8)}...</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="easy">{ch.easy_count}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="medium">{ch.medium_count}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="hard">{ch.hard_count}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {ch.total_count}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenChapterDrawer(ch)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Questions</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ================= TOTAL SUBJECTS INTERACTION MODAL ================= */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">All Platform Subjects</h2>
                <p className="text-xs text-slate-500">Click any subject to expand its chapters and question distribution.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSubjectModal(false);
                  setActiveSubjectChapters(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
              {subjects.map((s, idx) => (
                <div key={s.id} className="py-3">
                  <div
                    onClick={() => handleSubjectClickInModal(s)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{s.display_name}</h4>
                        <p className="text-xs text-slate-400 font-mono">ID: {s.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="info">{s.chapter_count} Chapters</Badge>
                      <Badge variant="active">{s.question_count} Questions</Badge>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Expanded chapters inside modal if selected */}
                  {activeSubjectChapters && activeSubjectChapters.subject.id === s.id && (
                    <div className="mt-2 ml-10 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <h5 className="text-xs font-bold text-slate-700">Chapters under {s.display_name}:</h5>
                      <div className="space-y-1.5">
                        {activeSubjectChapters.chapters.map((ch) => (
                          <div
                            key={ch.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 text-xs"
                          >
                            <span className="font-semibold text-slate-800">{ch.display_name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-emerald-700 font-medium">Easy: {ch.easy_count}</span>
                              <span className="text-[11px] text-amber-700 font-medium">Med: {ch.medium_count}</span>
                              <span className="text-[11px] text-rose-700 font-medium">Hard: {ch.hard_count}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowSubjectModal(false);
                                  handleOpenChapterDrawer(ch);
                                }}
                                className="px-2 py-0.5 rounded text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                              >
                                View Questions
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= CHAPTER QUESTION DRAWER ================= */}
      {activeChapter && (
        <div className="fixed inset-0 z-40 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white shadow-2xl border-l border-slate-200 flex flex-col h-full animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
                  {activeChapter.subject_display_name}
                </span>
                <h3 className="text-base font-bold text-slate-900">{activeChapter.display_name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Chapter ID: {activeChapter.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveChapter(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Question List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {drawerLoading ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="inline-block animate-spin w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full mb-2" />
                  <p>Loading chapter questions...</p>
                </div>
              ) : chapterQuestions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No questions currently uploaded for this chapter.
                </div>
              ) : (
                chapterQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">#{idx + 1}</span>
                        <Badge variant={q.difficulty}>{q.difficulty.toUpperCase()}</Badge>
                        <span className="font-mono text-slate-400 text-[11px]">UID: {q.id.slice(0, 8)}...</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuestionAction(q.id, false)}
                          className="px-2 py-1 rounded text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                        >
                          Inspect
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuestionAction(q.id, true)}
                          className="px-2.5 py-1 rounded text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-800 line-clamp-3">
                      <MathText text={q.preview_text} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
