export interface DashboardStats {
  total_subjects: number;
  total_questions: number;
  total_chapters: number;
  total_tests: number;
  easy_questions: number;
  medium_questions: number;
  hard_questions: number;
  active_questions: number;
  inactive_questions: number;
  total_tests_published: number;
  total_tests_draft: number;
  database_mode: string;
}

export interface Subject {
  id: string;
  name: string;
  display_name: string;
  display_order: number;
  chapter_count: number;
  question_count: number;
}

export interface Chapter {
  id: string;
  subject_id: string;
  name: string;
  display_name: string;
  grade?: string;
  subject_name?: string;
  subject_display_name?: string;
  easy_count: number;
  medium_count: number;
  hard_count: number;
  total_count: number;
  discrepancy_detected: boolean;
}

export interface QuestionSummary {
  id: string;
  external_uid: string;
  chapter_id: string;
  chapter_name?: string;
  subject_id?: string;
  subject_name?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_type: string;
  is_active: boolean;
  preview_text: string;
  difficulty_rank?: number;
  created_at?: string;
}

export interface RelatedTestInfo {
  test_id: string;
  test_title: string;
  question_order: number;
  exam_type?: string;
  status: string;
}

export interface QuestionDetail {
  id: string;
  external_uid: string;
  chapter_id: string;
  chapter_name?: string;
  subject_id?: string;
  subject_name?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_type: string;
  content: any;
  options?: any;
  correct_answer: any;
  explanation?: any;
  is_active: boolean;
  source_type: string;
  owner_coaching_id?: string;
  difficulty_position?: number;
  difficulty_total_in_chapter?: number;
  difficulty_numbering_note: string;
  assigned_tests: RelatedTestInfo[];
  created_at?: string;
  updated_at?: string;
}

export interface QuestionUpdatePayload {
  chapter_id?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  question_type?: 'single_correct' | 'multi_correct' | 'numeric';
  content?: any;
  options?: any;
  correct_answer?: any;
  explanation?: any;
  is_active?: boolean;
  reason?: string;
}

export interface TestItem {
  id: string;
  coaching_id?: string;
  title: string;
  description?: string;
  duration_minutes: number;
  availability_start_time?: string;
  availability_end_time?: string;
  exam_type?: string;
  mode: string;
  status: string;
  total_questions: number;
  subjects: string[];
  has_ordering_conflicts: boolean;
}

export interface TestQuestionDetail {
  question_order: number;
  question_id: string;
  external_uid: string;
  difficulty: string;
  question_type: string;
  preview_text: string;
  subject_name?: string;
  chapter_name?: string;
  chapter_id: string;
  is_active: boolean;
}

export interface TestDetail extends TestItem {
  ordering_warnings: string[];
  questions: TestQuestionDetail[];
}

export interface DiagnosticIssue {
  issue_type: string;
  severity: 'CRITICAL' | 'WARNING';
  category: string;
  target_id: string;
  title: string;
  description: string;
  suggested_action: string;
  can_auto_fix?: boolean;
}

export interface DiagnosticReport {
  total_issues: number;
  critical_count: number;
  warning_count: number;
  scanned_at: string;
  issues: DiagnosticIssue[];
}

export interface AuditLogItem {
  id: string;
  question_id: string;
  action: string;
  changed_by: string;
  changed_fields: string[];
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  reason?: string;
  created_at: string;
}
