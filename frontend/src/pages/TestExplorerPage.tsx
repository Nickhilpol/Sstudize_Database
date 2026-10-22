import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Search,
  Eye,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  Layers,
  Edit,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { TestItem, TestDetail, QuestionDetail } from '../types';
import { fetchTests, fetchTestDetail, fetchQuestionDetail } from '../api';
import { Badge } from '../components/Badge';
import { MathText } from '../components/MathText';

interface TestExplorerPageProps {
  onOpenQuestionModal: (question: QuestionDetail, editMode?: boolean) => void;
}

export const TestExplorerPage: React.FC<TestExplorerPageProps> = ({
  onOpenQuestionModal,
}) => {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [selectedTestDetail, setSelectedTestDetail] = useState<TestDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async (search = searchQuery) => {
    setLoading(true);
    try {
      const data = await fetchTests({ search: search || undefined });
      setTests(data);
    } catch (err) {
      console.error('Failed to load tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTest = async (testId: string) => {
    setSelectedTestId(testId);
    setDetailLoading(true);
    try {
      const detail = await fetchTestDetail(testId);
      setSelectedTestDetail(detail);
    } catch (err) {
      console.error('Failed to load test details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleQuestionClick = async (questionId: string, editMode = false) => {
    try {
      const q = await fetchQuestionDetail(questionId);
      onOpenQuestionModal(q, editMode);
    } catch (err) {
      console.error('Failed to load question:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Test Explorer
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Locate tests, inspect their assigned questions in strict database order, and detect sequence collisions.
          </p>
        </div>

        {selectedTestDetail && (
          <button
            type="button"
            onClick={() => {
              setSelectedTestId(null);
              setSelectedTestDetail(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to All Tests
          </button>
        )}
      </div>

      {!selectedTestDetail ? (
        /* ================= ALL TESTS LIST ================= */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          
          {/* Search bar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tests by Test ID, name, or exam type..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  loadTests(e.target.value);
                }}
                className="w-full text-xs rounded-xl bg-white border border-slate-300 pl-10 pr-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Tests Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                  <th className="py-3 px-4 font-mono">Test ID</th>
                  <th className="py-3 px-4">Test Name / Title</th>
                  <th className="py-3 px-4">Exam Type</th>
                  <th className="py-3 px-4">Subjects Covered</th>
                  <th className="py-3 px-4 text-center">Questions</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="inline-block animate-spin w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full mb-2" />
                      <p>Loading tests...</p>
                    </td>
                  </tr>
                ) : tests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No tests found matching "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  tests.map((test) => (
                    <tr
                      key={test.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleSelectTest(test.id)}
                    >
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 font-semibold">
                        <span title={test.id}>{test.id.slice(0, 8)}...</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                          {test.title}
                        </div>
                        {test.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{test.description}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 uppercase font-semibold text-slate-700">
                        {test.exam_type || 'General'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {test.subjects.map((s, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {test.total_questions}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={test.status === 'published' ? 'published' : 'draft'}>
                          {test.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleSelectTest(test.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Questions</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      ) : (
        /* ================= SELECTED TEST DETAIL VIEW ================= */
        <div className="space-y-5">
          
          {/* Test Metadata Banner */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{selectedTestDetail.title}</h2>
                  <Badge variant={selectedTestDetail.status === 'published' ? 'published' : 'draft'}>
                    {selectedTestDetail.status}
                  </Badge>
                  <span className="text-xs uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {selectedTestDetail.exam_type || 'Exam'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Database Test ID: <span className="font-semibold text-slate-700">{selectedTestDetail.id}</span>
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {selectedTestDetail.duration_minutes} mins
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="w-4 h-4 text-slate-400" />
                  {selectedTestDetail.total_questions} Questions Assigned
                </span>
              </div>
            </div>

            {/* Ordering Warning Box if detected */}
            {selectedTestDetail.has_ordering_conflicts && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Test Question Ordering Conflict Warning:
                </div>
                <ul className="list-disc list-inside space-y-0.5 pl-2 text-amber-800/90 font-mono text-[11px]">
                  {selectedTestDetail.ordering_warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Ordered Questions List */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Test Questions in Database Stored Order (`test_questions.question_order`)
                </h3>
                <p className="text-xs text-slate-500">
                  Ordering reflects exact sequence retrieved from database table.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                    <th className="py-3 px-4 text-center w-20">Order #</th>
                    <th className="py-3 px-4 font-mono">Question UID</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Chapter</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4">Question Preview</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedTestDetail.questions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No questions linked to this test.
                      </td>
                    </tr>
                  ) : (
                    selectedTestDetail.questions.map((q) => (
                      <tr key={q.question_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-center">
                          <span
                            onClick={() => handleQuestionClick(q.question_id)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs hover:bg-indigo-200 transition cursor-pointer"
                            title="Click to view question"
                          >
                            {q.question_order}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleQuestionClick(q.question_id)}
                            className="text-slate-700 hover:text-indigo-600 font-medium hover:underline cursor-pointer"
                          >
                            {q.question_id.slice(0, 8)}...
                          </button>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {q.subject_name}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {q.chapter_name}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={q.difficulty as any}>{q.difficulty.toUpperCase()}</Badge>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-700">
                          <MathText text={q.preview_text} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuestionClick(q.question_id, false)}
                              className="px-2 py-1 rounded text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                            >
                              Inspect
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuestionClick(q.question_id, true)}
                              className="px-2 py-1 rounded text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
