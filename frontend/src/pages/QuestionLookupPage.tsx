import React, { useState } from 'react';
import {
  Search,
  Key,
  BookOpen,
  FolderTree,
  FileCheck2,
  Edit,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  XCircle,
  Layers,
  Sparkles
} from 'lucide-react';
import { QuestionDetail } from '../types';
import { lookupQuestionByUid } from '../api';
import { Badge } from '../components/Badge';
import { MathText } from '../components/MathText';

interface QuestionLookupPageProps {
  onOpenEditModal: (question: QuestionDetail) => void;
}

export const QuestionLookupPage: React.FC<QuestionLookupPageProps> = ({
  onOpenEditModal,
}) => {
  const [searchUid, setSearchUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchedTerm, setSearchedTerm] = useState<string>('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchUid.trim();
    if (!query) return;

    setLoading(true);
    setErrorMessage(null);
    setSearchedTerm(query);
    setQuestion(null);

    try {
      const result = await lookupQuestionByUid(query);
      setQuestion(result);
    } catch (err: any) {
      setErrorMessage(err.message || `No question found matching UID "${query}".`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchUid('');
    setQuestion(null);
    setErrorMessage(null);
    setSearchedTerm('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Question UID Lookup
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Dedicated precision lookup tool for question inspection, difficulty position analysis, and editing.
        </p>
      </div>

      {/* Prominent Search Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <form onSubmit={handleSearch} className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Enter Exact Question UID
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000 or internal question UUID"
                value={searchUid}
                onChange={(e) => setSearchUid(e.target.value)}
                className="w-full text-xs rounded-xl bg-slate-50 border border-slate-300 pl-10 pr-10 py-3 text-slate-900 font-mono placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchUid && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !searchUid.trim()}
              className="px-5 py-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              {loading ? 'Searching...' : 'Lookup UID'}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Exact matching is strictly enforced. The lookup matches both the primary key UUID and external UID.
          </p>
        </form>
      </div>

      {/* Error / Not Found Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-800">Question Not Found</h4>
            <p className="mt-0.5 text-rose-700">{errorMessage}</p>
            <p className="mt-1 text-[11px] text-rose-600/80">
              Please double check the spelling of UID "{searchedTerm}". Ensure there are no extra leading/trailing characters.
            </p>
          </div>
        </div>
      )}

      {/* Question Details Result Card */}
      {question && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden animate-in fade-in duration-150">
          
          {/* Card Top Banner */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={question.difficulty}>{question.difficulty.toUpperCase()}</Badge>
                <Badge variant={question.is_active ? 'active' : 'inactive'}>
                  {question.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <span className="text-xs font-semibold text-slate-600 capitalize bg-slate-200/70 px-2 py-0.5 rounded">
                  {question.question_type.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 mt-1">
                Primary Question UID: <span className="font-bold text-slate-800">{question.id}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenEditModal(question)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit Question Data
            </button>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Subject and Chapter Mapping */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div className="flex items-start gap-2.5">
                <BookOpen className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 font-medium block">Subject</span>
                  <span className="font-bold text-slate-900 text-sm">{question.subject_name}</span>
                  <span className="text-[11px] font-mono text-slate-400 block">ID: {question.subject_id}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <FolderTree className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 font-medium block">Chapter</span>
                  <span className="font-bold text-slate-900 text-sm">{question.chapter_name}</span>
                  <span className="text-[11px] font-mono text-slate-400 block">ID: {question.chapter_id}</span>
                </div>
              </div>
            </div>

            {/* Difficulty-Level Numbering Analysis Panel */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                Difficulty-Level Sequence Analysis
              </div>
              <p className="text-indigo-950 font-medium leading-relaxed">
                {question.difficulty_numbering_note}
              </p>
              <div className="text-[11px] text-indigo-800/80 pt-1 border-t border-indigo-100 flex flex-wrap gap-4">
                <span>Calculated Position: <strong>#{question.difficulty_position}</strong></span>
                <span>Total in Difficulty: <strong>{question.difficulty_total_in_chapter}</strong></span>
                <span>Native DB Column: <strong>None (Verified in schema.sql)</strong></span>
              </div>
            </div>

            {/* Question Text */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Question Statement
              </span>
              <div className="text-slate-900 text-sm font-medium leading-relaxed">
                <MathText text={question.content} />
              </div>
            </div>

            {/* Options */}
            {question.options && Array.isArray(question.options) && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Options
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {question.options.map((opt: any, idx: number) => {
                    const optId = typeof opt === 'object' ? opt.id : String.fromCharCode(65 + idx);
                    const optText = typeof opt === 'object' ? opt.text : String(opt);
                    const isCorrect =
                      String(question.correct_answer) === optId ||
                      (Array.isArray(question.correct_answer) && question.correct_answer.includes(optId));

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {optId}
                        </span>
                        <div className="flex-1">
                          <MathText text={optText} />
                        </div>
                        {isCorrect && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Numeric Correct Answer */}
            {question.question_type === 'numeric' && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <span className="font-semibold text-emerald-900 block mb-0.5">Correct Numeric Value:</span>
                <span className="font-mono text-sm font-bold text-emerald-800">{String(question.correct_answer)}</span>
              </div>
            )}

            {/* Explanation */}
            {question.explanation && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Explanation & Solution
                </span>
                <div className="text-slate-800 text-xs leading-relaxed">
                  <MathText text={question.explanation} />
                </div>
              </div>
            )}

            {/* Tests Containing Question */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Assigned Tests ({question.assigned_tests?.length || 0})
              </span>
              {question.assigned_tests && question.assigned_tests.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {question.assigned_tests.map((t, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          #{t.question_order}
                        </span>
                        <span className="font-semibold text-slate-800">{t.test_title}</span>
                        <Badge variant={t.status === 'published' ? 'published' : 'draft'}>{t.status}</Badge>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">Test ID: {t.test_id}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">This question is not currently part of any test.</p>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
