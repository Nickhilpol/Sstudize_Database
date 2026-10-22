import {
  DashboardStats,
  Subject,
  Chapter,
  QuestionSummary,
  QuestionDetail,
  QuestionUpdatePayload,
  TestItem,
  TestDetail,
  DiagnosticReport,
  AuditLogItem,
} from './types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = `Status ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/stats`);
  return handleResponse<DashboardStats>(res);
}

export async function fetchSubjects(): Promise<Subject[]> {
  const res = await fetch(`${API_BASE}/subjects`);
  return handleResponse<Subject[]>(res);
}

export async function fetchSubjectChapters(subjectId: string): Promise<Chapter[]> {
  const res = await fetch(`${API_BASE}/subjects/${encodeURIComponent(subjectId)}/chapters`);
  return handleResponse<Chapter[]>(res);
}

export async function fetchChapters(params?: {
  subject_id?: string;
  search?: string;
  difficulty?: string;
  anomalies_only?: boolean;
}): Promise<Chapter[]> {
  const query = new URLSearchParams();
  if (params?.subject_id) query.append('subject_id', params.subject_id);
  if (params?.search) query.append('search', params.search);
  if (params?.difficulty) query.append('difficulty', params.difficulty);
  if (params?.anomalies_only) query.append('anomalies_only', 'true');

  const res = await fetch(`${API_BASE}/chapters?${query.toString()}`);
  return handleResponse<Chapter[]>(res);
}

export async function fetchChapterQuestions(
  chapterId: string,
  params?: { difficulty?: string; search?: string }
): Promise<QuestionSummary[]> {
  const query = new URLSearchParams();
  if (params?.difficulty) query.append('difficulty', params.difficulty);
  if (params?.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE}/chapters/${encodeURIComponent(chapterId)}/questions?${query.toString()}`);
  return handleResponse<QuestionSummary[]>(res);
}

export async function fetchTests(params?: {
  search?: string;
  exam_type?: string;
  status?: string;
}): Promise<TestItem[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.exam_type) query.append('exam_type', params.exam_type);
  if (params?.status) query.append('status', params.status);

  const res = await fetch(`${API_BASE}/tests?${query.toString()}`);
  return handleResponse<TestItem[]>(res);
}

export async function fetchTestDetail(testId: string): Promise<TestDetail> {
  const res = await fetch(`${API_BASE}/tests/${encodeURIComponent(testId)}`);
  return handleResponse<TestDetail>(res);
}

export async function lookupQuestionByUid(uid: string): Promise<QuestionDetail> {
  const res = await fetch(`${API_BASE}/questions/lookup?uid=${encodeURIComponent(uid.trim())}`);
  return handleResponse<QuestionDetail>(res);
}

export async function fetchQuestionDetail(questionId: string): Promise<QuestionDetail> {
  const res = await fetch(`${API_BASE}/questions/${encodeURIComponent(questionId)}`);
  return handleResponse<QuestionDetail>(res);
}

export async function updateQuestion(
  questionId: string,
  payload: QuestionUpdatePayload
): Promise<QuestionDetail> {
  const res = await fetch(`${API_BASE}/questions/${encodeURIComponent(questionId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<QuestionDetail>(res);
}

export async function fetchDiagnostics(): Promise<DiagnosticReport> {
  const res = await fetch(`${API_BASE}/diagnostics`);
  return handleResponse<DiagnosticReport>(res);
}

export async function fetchAuditLogs(questionId?: string): Promise<AuditLogItem[]> {
  const url = questionId
    ? `${API_BASE}/audit-logs?question_id=${encodeURIComponent(questionId)}`
    : `${API_BASE}/audit-logs`;
  const res = await fetch(url);
  return handleResponse<AuditLogItem[]>(res);
}
