import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit3,
  Layers,
  Calendar,
  Key,
  HelpCircle,
  FileText
} from 'lucide-react';
import { QuestionDetail, Chapter, Subject } from '../types';
import { updateQuestion, fetchChapters, fetchSubjects } from '../api';
import { MathText } from './MathText';
import { Badge } from './Badge';

interface QuestionModalProps {
  question: QuestionDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: QuestionDetail) => void;
  initialEditMode?: boolean;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  question,
  isOpen,
  onClose,
  onSaved,
  initialEditMode = false,
}) => {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [content, setContent] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionType, setQuestionType] = useState<'single_correct' | 'multi_correct' | 'numeric'>('single_correct');
  const [chapterId, setChapterId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [optionsText, setOptionsText] = useState('');
  const [reason, setReason] = useState('Data correction via SStudizer Database Manager');

  // Supporting reference data for foreign-key validated dropdowns
  const [chaptersList, setChaptersList] = useState<Chapter[]>([]);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);

  useEffect(() => {
    setIsEditing(initialEditMode);
  }, [initialEditMode, question]);

  useEffect(() => {
    if (isOpen) {
      fetchChapters().then(setChaptersList).catch(console.error);
      fetchSubjects().then(setSubjectsList).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (question) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setContent(
        typeof question.content === 'object'
          ? question.content.text || question.content.question || JSON.stringify(question.content, null, 2)
          : String(question.content || '')
      );
      setDifficulty(question.difficulty);
      setQuestionType(question.question_type as any);
      setChapterId(question.chapter_id);
      setIsActive(question.is_active);
      setCorrectAnswer(
        typeof question.correct_answer === 'object'
          ? JSON.stringify(question.correct_answer)
          : String(question.correct_answer || '')
      );
      setExplanation(
        typeof question.explanation === 'object'
          ? question.explanation.text || JSON.stringify(question.explanation, null, 2)
          : String(question.explanation || '')
      );

      if (question.options) {
        if (Array.isArray(question.options)) {
          setOptionsText(
            question.options
              .map((opt) => (typeof opt === 'object' ? `${opt.id || ''}: ${opt.text || ''}`.trim() : String(opt)))
              .join('\n')
          );
        } else if (typeof question.options === 'object') {
          setOptionsText(JSON.stringify(question.options, null, 2));
        } else {
          setOptionsText(String(question.options));
        }
      } else {
        setOptionsText('');
      }
    }
  }, [question]);

  if (!isOpen || !question) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let parsedOptions: any = null;
      if (optionsText.trim()) {
        const lines = optionsText.split('\n').filter((l) => l.trim().length > 0);
        parsedOptions = lines.map((line, idx) => {
          const colonMatch = line.match(/^([A-D]):\s*(.*)$/i);
          if (colonMatch) {
            return { id: colonMatch[1].toUpperCase(), text: colonMatch[2] };
          }
          const defaultKey = String.fromCharCode(65 + idx);
          return { id: defaultKey, text: line };
        });
      }

      let parsedCorrectAnswer: any = correctAnswer.trim();
      if (correctAnswer.startsWith('[') || correctAnswer.startsWith('{')) {
        try {
          parsedCorrectAnswer = JSON.parse(correctAnswer);
        } catch {
          parsedCorrectAnswer = correctAnswer.trim();
        }
      }

      const updated = await updateQuestion(question.id, {
        chapter_id: chapterId,
        difficulty,
        question_type: questionType,
        content: content.trim(),
        options: parsedOptions,
        correct_answer: parsedCorrectAnswer,
        explanation: explanation.trim() ? explanation.trim() : null,
        is_active: isActive,
        reason: reason.trim(),
      });

      setSuccessMessage('Question updated and changes saved to database successfully!');
      setIsEditing(false);
      onSaved(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save question changes.');
    } finally {
      setSaving(false);
    }
  };

  const selectedChapter = chaptersList.find((c) => c.id === chapterId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {isEditing ? 'Edit Question' : 'Question Inspector'}
                </h2>
                <Badge variant={question.difficulty}>{question.difficulty.toUpperCase()}</Badge>
                <Badge variant={question.is_active ? 'active' : 'inactive'}>
                  {question.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Internal UID: <span className="font-semibold text-slate-700">{question.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Record
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition shadow-xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                View Mode
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Subject</span>
              <span className="font-semibold text-slate-800">
                {question.subject_name || selectedChapter?.subject_display_name || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Chapter</span>
              <span className="font-semibold text-slate-800 truncate block">
                {question.chapter_name || selectedChapter?.display_name || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">External UID</span>
              <span className="font-mono text-slate-700 truncate block font-medium">
                {question.external_uid}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Question Type</span>
              <span className="font-semibold text-slate-800 capitalize">
                {question.question_type.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Difficulty Positioning Note */}
          {question.difficulty_numbering_note && (
            <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
              <div>
                <span className="font-semibold">Difficulty Level Position: </span>
                {question.difficulty_numbering_note}
              </div>
            </div>
          )}

          {isEditing ? (
            /* ================= EDIT FORM ================= */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Chapter Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Chapter <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={chapterId}
                    onChange={(e) => setChapterId(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    {chaptersList.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.subject_display_name || 'Subject'} › {ch.display_name || ch.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Difficulty Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                {/* Question Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Question Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="single_correct">Single Correct MCQ</option>
                    <option value="multi_correct">Multi Correct MCQ</option>
                    <option value="numeric">Numerical Value</option>
                  </select>
                </div>
              </div>

              {/* Question Statement */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question Text / Statement (supports LaTeX like $E = mc^2$) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-3 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <div className="mt-1 p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                  <span className="text-slate-400 text-[10px] block uppercase font-bold mb-0.5">Live Preview:</span>
                  <MathText text={content || '(Empty text)'} className="text-slate-800" />
                </div>
              </div>

              {/* Options */}
              {questionType !== 'numeric' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Options (One option per line, e.g. "A: Value" or "Value")
                  </label>
                  <textarea
                    rows={4}
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-3 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="A: Option statement&#10;B: Option statement&#10;C: Option statement&#10;D: Option statement"
                  />
                </div>
              )}

              {/* Correct Answer & Active Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correct Answer Key <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    placeholder='e.g. "A" or ["A", "C"] or "4.5"'
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Active Status
                  </label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Active in Question Bank & Tests</span>
                  </label>
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Explanation & Solution Details
                </label>
                <textarea
                  rows={3}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-3 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Detailed derivation or solution steps..."
                />
              </div>

              {/* Audit Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Edit (saved to Audit Trail) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            /* ================= VIEW MODE ================= */
            <div className="space-y-6">
              {/* Question Statement Card */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Question Statement
                </span>
                <div className="text-slate-900 text-sm font-medium leading-relaxed">
                  <MathText text={question.content} />
                </div>
              </div>

              {/* Options Section */}
              {question.options && Array.isArray(question.options) && question.options.length > 0 && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Multiple Choice Options
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
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
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
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                              Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Numerical or Raw Correct Answer */}
              {question.question_type === 'numeric' && (
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
                  <span className="text-xs font-semibold text-emerald-900 block mb-1">
                    Numerical Correct Value:
                  </span>
                  <span className="font-mono text-base font-bold text-emerald-800">
                    {String(question.correct_answer)}
                  </span>
                </div>
              )}

              {/* Explanation */}
              {question.explanation && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Explanation & Solution
                  </span>
                  <div className="text-slate-800 text-xs leading-relaxed">
                    <MathText text={question.explanation} />
                  </div>
                </div>
              )}

              {/* Tests Containing This Question */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Assigned Tests ({question.assigned_tests?.length || 0})
                </span>
                {question.assigned_tests && question.assigned_tests.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {question.assigned_tests.map((t, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            #{t.question_order}
                          </span>
                          <span className="font-semibold text-slate-800">{t.test_title}</span>
                          <Badge variant={t.status === 'published' ? 'published' : 'draft'}>
                            {t.status}
                          </Badge>
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">{t.test_id}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">This question is not currently attached to any test.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-slate-400" />
            <span>Primary Key: <code className="font-semibold">{question.id}</code></span>
          </div>
          <div>
            Last updated: {question.updated_at ? new Date(question.updated_at).toLocaleString() : 'N/A'}
          </div>
        </div>

      </div>
    </div>
  );
};
