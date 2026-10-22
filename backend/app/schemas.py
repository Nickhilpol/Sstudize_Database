from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

# ----------------- Subject Schemas -----------------
class SubjectBase(BaseModel):
    id: str
    name: str
    display_name: str
    display_order: int

class SubjectRead(SubjectBase):
    model_config = ConfigDict(from_attributes=True)
    chapter_count: int = 0
    question_count: int = 0

# ----------------- Chapter Schemas -----------------
class ChapterBase(BaseModel):
    id: str
    subject_id: str
    name: str
    display_name: str
    grade: Optional[str] = None

class ChapterRead(ChapterBase):
    model_config = ConfigDict(from_attributes=True)
    subject_name: Optional[str] = None
    subject_display_name: Optional[str] = None
    easy_count: int = 0
    medium_count: int = 0
    hard_count: int = 0
    total_count: int = 0
    discrepancy_detected: bool = False

# ----------------- Question Schemas -----------------
class QuestionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    external_uid: str
    chapter_id: str
    chapter_name: Optional[str] = None
    subject_id: Optional[str] = None
    subject_name: Optional[str] = None
    difficulty: str
    question_type: str
    is_active: bool
    preview_text: str
    difficulty_rank: Optional[int] = None # Calculated sequence within (chapter, difficulty)
    created_at: Optional[datetime] = None

class RelatedTestInfo(BaseModel):
    test_id: str
    test_title: str
    question_order: int
    exam_type: Optional[str] = None
    status: str

class QuestionDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    external_uid: str
    chapter_id: str
    chapter_name: Optional[str] = None
    subject_id: Optional[str] = None
    subject_name: Optional[str] = None
    difficulty: str
    question_type: str
    content: Any # Raw JSON or string
    options: Optional[Any] = None # List or Dict
    correct_answer: Any
    explanation: Optional[Any] = None
    is_active: bool
    source_type: str
    owner_coaching_id: Optional[str] = None
    difficulty_position: Optional[int] = None
    difficulty_total_in_chapter: Optional[int] = None
    difficulty_numbering_note: str = ""
    assigned_tests: List[RelatedTestInfo] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class QuestionUpdate(BaseModel):
    chapter_id: Optional[str] = None
    difficulty: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    question_type: Optional[str] = Field(None, pattern="^(single_correct|multi_correct|numeric)$")
    content: Optional[Any] = None
    options: Optional[Any] = None
    correct_answer: Optional[Any] = None
    explanation: Optional[Any] = None
    is_active: Optional[bool] = None
    reason: Optional[str] = "Question data correction via SStudizer Database Manager"

# ----------------- Test Schemas -----------------
class TestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    coaching_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    duration_minutes: int
    availability_start_time: Optional[datetime] = None
    availability_end_time: Optional[datetime] = None
    exam_type: Optional[str] = None
    mode: str
    status: str
    total_questions: int = 0
    subjects: List[str] = []
    has_ordering_conflicts: bool = False

class TestQuestionDetail(BaseModel):
    question_order: int
    question_id: str
    external_uid: str
    difficulty: str
    question_type: str
    preview_text: str
    subject_name: Optional[str] = None
    chapter_name: Optional[str] = None
    chapter_id: str
    is_active: bool

class TestDetail(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    duration_minutes: int
    availability_start_time: Optional[datetime] = None
    availability_end_time: Optional[datetime] = None
    exam_type: Optional[str] = None
    mode: str
    status: str
    total_questions: int
    subjects: List[str] = []
    has_ordering_conflicts: bool = False
    ordering_warnings: List[str] = []
    questions: List[TestQuestionDetail] = []

# ----------------- Stats & Dashboard -----------------
class DashboardStats(BaseModel):
    total_subjects: int
    total_questions: int
    total_chapters: int
    total_tests: int
    easy_questions: int
    medium_questions: int
    hard_questions: int
    active_questions: int
    inactive_questions: int
    total_tests_published: int
    total_tests_draft: int
    database_mode: str # 'Local SQLite' or 'Supabase PostgreSQL'

# ----------------- Diagnostics -----------------
class DiagnosticIssue(BaseModel):
    issue_type: str
    severity: str # 'CRITICAL' or 'WARNING'
    category: str
    target_id: str
    title: str
    description: str
    suggested_action: str
    can_auto_fix: bool = False

class DiagnosticReport(BaseModel):
    total_issues: int
    critical_count: int
    warning_count: int
    scanned_at: datetime
    issues: List[DiagnosticIssue]

# ----------------- Audit Log -----------------
class AuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    question_id: str
    action: str
    changed_by: str
    changed_fields: List[str]
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    reason: Optional[str] = None
    created_at: datetime

