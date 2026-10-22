from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Question, Chapter, Subject, Test, TestQuestion, ChapterQuestionInventory
from app.schemas import DiagnosticReport, DiagnosticIssue

router = APIRouter(prefix="/api/diagnostics", tags=["Data Quality & Diagnostics"])

@router.get("", response_model=DiagnosticReport)
def run_data_quality_diagnostics(db: Session = Depends(get_db)):
    """
    Comprehensive Data Quality Scanner for the SStudize Question Bank.
    Detects integrity violations, missing fields, orphan foreign keys,
    duplicate test order numbers, and inventory discrepancies.
    """
    issues: List[DiagnosticIssue] = []

    # 1. Questions missing content or with empty text
    empty_content_questions = (
        db.query(Question)
        .filter((Question.content == None) | (Question.content == "") | (Question.content == "{}"))
        .all()
    )
    for q in empty_content_questions:
        issues.append(
            DiagnosticIssue(
                issue_type="EMPTY_QUESTION_CONTENT",
                severity="CRITICAL",
                category="Questions",
                target_id=q.id,
                title="Missing or Empty Question Text",
                description=f"Question UID '{q.id}' (external: {q.external_uid}) has blank or null content.",
                suggested_action="Edit the question and provide the full question statement."
            )
        )

    # 2. Questions with missing or invalid difficulty values
    invalid_diff_questions = (
        db.query(Question)
        .filter(~Question.difficulty.in_(["easy", "medium", "hard"]))
        .all()
    )
    for q in invalid_diff_questions:
        issues.append(
            DiagnosticIssue(
                issue_type="INVALID_DIFFICULTY",
                severity="CRITICAL",
                category="Questions",
                target_id=q.id,
                title="Invalid Difficulty Level",
                description=f"Question UID '{q.id}' has invalid difficulty '{q.difficulty}'. Allowed: easy, medium, hard.",
                suggested_action="Set difficulty to 'easy', 'medium', or 'hard'."
            )
        )

    # 3. Questions with missing correct_answer
    missing_answer_questions = (
        db.query(Question)
        .filter((Question.correct_answer == None) | (Question.correct_answer == ""))
        .all()
    )
    for q in missing_answer_questions:
        issues.append(
            DiagnosticIssue(
                issue_type="MISSING_CORRECT_ANSWER",
                severity="CRITICAL",
                category="Questions",
                target_id=q.id,
                title="Missing Correct Answer",
                description=f"Question UID '{q.id}' does not have a designated correct answer key.",
                suggested_action="Specify the correct answer (e.g. 'A', 'B', 'C', 'D' or numeric value)."
            )
        )

    # 4. Questions with single/multi correct type but missing or empty options
    option_questions = (
        db.query(Question)
        .filter(Question.question_type.in_(["single_correct", "multi_correct"]))
        .all()
    )
    for q in option_questions:
        opts = q.options
        if not opts or (isinstance(opts, list) and len(opts) < 2):
            issues.append(
                DiagnosticIssue(
                    issue_type="INCOMPLETE_OPTIONS",
                    severity="WARNING",
                    category="Questions",
                    target_id=q.id,
                    title="Incomplete Multiple Choice Options",
                    description=f"Question UID '{q.id}' is set to '{q.question_type}' but has fewer than 2 options.",
                    suggested_action="Provide at least options A, B, C, D."
                )
            )

    # 5. Questions with nonexistent chapter (Orphan Questions)
    valid_chapter_ids = {c[0] for c in db.query(Chapter.id).all()}
    all_questions = db.query(Question.id, Question.chapter_id).all()
    for q_id, ch_id in all_questions:
        if ch_id not in valid_chapter_ids:
            issues.append(
                DiagnosticIssue(
                    issue_type="ORPHAN_QUESTION",
                    severity="CRITICAL",
                    category="Foreign Keys",
                    target_id=q_id,
                    title="Orphan Question (Invalid Chapter Reference)",
                    description=f"Question '{q_id}' points to nonexistent chapter ID '{ch_id}'.",
                    suggested_action="Reassign this question to an existing valid chapter."
                )
            )

    # 6. Chapters with nonexistent subject (Orphan Chapters)
    valid_subject_ids = {s[0] for s in db.query(Subject.id).all()}
    all_chapters = db.query(Chapter.id, Chapter.name, Chapter.subject_id).all()
    for ch_id, ch_name, s_id in all_chapters:
        if s_id not in valid_subject_ids:
            issues.append(
                DiagnosticIssue(
                    issue_type="ORPHAN_CHAPTER",
                    severity="CRITICAL",
                    category="Foreign Keys",
                    target_id=ch_id,
                    title="Orphan Chapter (Invalid Subject Reference)",
                    description=f"Chapter '{ch_name}' ({ch_id}) references nonexistent subject ID '{s_id}'.",
                    suggested_action="Assign this chapter to an active subject."
                )
            )

    # 7. Duplicate External UIDs in same (chapter, difficulty, question_type)
    dupe_uids = (
        db.query(Question.external_uid, Question.chapter_id, Question.difficulty, func.count(Question.id))
        .group_by(Question.external_uid, Question.chapter_id, Question.difficulty)
        .having(func.count(Question.id) > 1)
        .all()
    )
    for ext_uid, ch_id, diff, count in dupe_uids:
        issues.append(
            DiagnosticIssue(
                issue_type="DUPLICATE_EXTERNAL_UID",
                severity="WARNING",
                category="Identifiers",
                target_id=ext_uid,
                title="Duplicate External UID in Chapter",
                description=f"External UID '{ext_uid}' is repeated {count} times under chapter '{ch_id}' with {diff} difficulty.",
                suggested_action="Verify if these are duplicate uploads or assign distinct external UIDs."
            )
        )

    # 8. Duplicate Question Order within a Test
    dupe_orders = (
        db.query(TestQuestion.test_id, TestQuestion.question_order, func.count(TestQuestion.id))
        .group_by(TestQuestion.test_id, TestQuestion.question_order)
        .having(func.count(TestQuestion.id) > 1)
        .all()
    )
    for test_id, order_no, count in dupe_orders:
        test = db.query(Test).filter(Test.id == test_id).first()
        test_title = test.title if test else test_id
        issues.append(
            DiagnosticIssue(
                issue_type="DUPLICATE_TEST_ORDER",
                severity="CRITICAL",
                category="Tests",
                target_id=test_id,
                title="Duplicate Question Order in Test",
                description=f"In test '{test_title}', question order #{order_no} is assigned to {count} different questions.",
                suggested_action="Re-sequence the question orders in the test to ensure each question has a unique 1-based order."
            )
        )

    # 9. Test questions referencing missing question records
    valid_question_ids = {q[0] for q in db.query(Question.id).all()}
    all_tqs = db.query(TestQuestion.id, TestQuestion.test_id, TestQuestion.question_id).all()
    for tq_id, t_id, q_id in all_tqs:
        if q_id not in valid_question_ids:
            issues.append(
                DiagnosticIssue(
                    issue_type="BROKEN_TEST_QUESTION_LINK",
                    severity="CRITICAL",
                    category="Tests",
                    target_id=t_id,
                    title="Broken Test Question Link",
                    description=f"Test '{t_id}' references question ID '{q_id}' which does not exist in the questions table.",
                    suggested_action="Remove the missing reference from test_questions or restore the question."
                )
            )

    # 10. Inventory count discrepancy
    all_inv_rows = db.query(ChapterQuestionInventory).all()
    for inv in all_inv_rows:
        actual_cnt = (
            db.query(func.count(Question.id))
            .filter(Question.chapter_id == inv.chapter_id, Question.difficulty == inv.difficulty, Question.is_active == True)
            .scalar() or 0
        )
        if actual_cnt != inv.active_count:
            issues.append(
                DiagnosticIssue(
                    issue_type="INVENTORY_COUNT_MISMATCH",
                    severity="WARNING",
                    category="Counts",
                    target_id=inv.chapter_id,
                    title="Chapter Question Inventory Discrepancy",
                    description=(
                        f"Chapter '{inv.chapter_id}' has {actual_cnt} active {inv.difficulty} questions in reality, "
                        f"but chapter_question_inventory records {inv.active_count}."
                    ),
                    suggested_action="Recalculate chapter question inventory cache."
                )
            )

    critical_count = sum(1 for i in issues if i.severity == "CRITICAL")
    warning_count = sum(1 for i in issues if i.severity == "WARNING")

    return DiagnosticReport(
        total_issues=len(issues),
        critical_count=critical_count,
        warning_count=warning_count,
        scanned_at=datetime.now(timezone.utc),
        issues=issues
    )
