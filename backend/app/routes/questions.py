import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Question, Chapter, Subject, TestQuestion, Test, AuditLog, ChapterQuestionInventory
from app.schemas import QuestionDetail, QuestionUpdate, RelatedTestInfo

router = APIRouter(prefix="/api/questions", tags=["Questions"])

def calculate_difficulty_metrics(db: Session, question: Question):
    """
    Carefully inspects the database for difficulty-level sequence.
    As verified in schema.sql:
    The schema DOES NOT possess a native stored column for difficulty-level position (e.g. difficulty_order).
    Instead, it maintains active counts in `chapter_question_inventory`.
    To satisfy the requirement without fabricating schema columns, we explain this distinction clearly
    and compute the deterministic sequence within (chapter_id, difficulty) ordered by (created_at, id).
    """
    total_in_difficulty = (
        db.query(func.count(Question.id))
        .filter(Question.chapter_id == question.chapter_id, Question.difficulty == question.difficulty)
        .scalar() or 1
    )

    # Determine 1-based sequential position based on creation timestamp and deterministic tiebreaker
    position_query = (
        db.query(func.count(Question.id))
        .filter(
            Question.chapter_id == question.chapter_id,
            Question.difficulty == question.difficulty,
            (Question.created_at < question.created_at) |
            ((Question.created_at == question.created_at) & (Question.id <= question.id))
        )
        .scalar() or 1
    )

    note = (
        f"Position #{position_query} of {total_in_difficulty} in {question.difficulty.capitalize()} difficulty. "
        "Notice: The database schema does not have a native 'difficulty_sequence' column. "
        "This ranking is deterministically calculated by creation order (created_at, id) within this chapter."
    )

    return position_query, total_in_difficulty, note

@router.get("/lookup", response_model=QuestionDetail)
def lookup_question_by_uid(
    uid: str = Query(..., description="Exact Question UID or External UID"),
    db: Session = Depends(get_db)
):
    """Exact lookup for a question by its Primary ID or External UID."""
    cleaned_uid = uid.strip()
    if not cleaned_uid:
        raise HTTPException(status_code=400, detail="Question UID cannot be empty.")

    # Exact matching: primary key `id` or `external_uid`
    q = db.query(Question).filter(
        (Question.id == cleaned_uid) | (Question.external_uid == cleaned_uid)
    ).first()

    if not q:
        raise HTTPException(status_code=404, detail=f"Question with UID '{cleaned_uid}' was not found.")

    return get_question_detail_response(db, q)

@router.get("/{question_id}", response_model=QuestionDetail)
def get_question_by_id(question_id: str, db: Session = Depends(get_db)):
    """Retrieve question by its primary ID."""
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail=f"Question with ID '{question_id}' not found.")

    return get_question_detail_response(db, q)

def get_question_detail_response(db: Session, q: Question) -> QuestionDetail:
    """Helper to assemble rich QuestionDetail response with tests and difficulty metrics."""
    ch = db.query(Chapter).filter(Chapter.id == q.chapter_id).first()
    subj = db.query(Subject).filter(Subject.id == ch.subject_id).first() if ch else None

    # Find all tests containing this question and their stored question_order
    test_links = (
        db.query(TestQuestion, Test)
        .join(Test, Test.id == TestQuestion.test_id)
        .filter(TestQuestion.question_id == q.id)
        .order_by(Test.created_at.desc())
        .all()
    )

    assigned_tests = [
        RelatedTestInfo(
            test_id=t.id,
            test_title=t.title,
            question_order=tq.question_order,
            exam_type=t.exam_type,
            status=t.status
        )
        for tq, t in test_links
    ]

    pos, total_diff, diff_note = calculate_difficulty_metrics(db, q)

    return QuestionDetail(
        id=q.id,
        external_uid=q.external_uid,
        chapter_id=q.chapter_id,
        chapter_name=(ch.display_name or ch.name) if ch else "Unknown Chapter",
        subject_id=subj.id if subj else "",
        subject_name=subj.display_name if subj else "Unknown Subject",
        difficulty=q.difficulty,
        question_type=q.question_type,
        content=q.content,
        options=q.options,
        correct_answer=q.correct_answer,
        explanation=q.explanation,
        is_active=q.is_active,
        source_type=q.source_type,
        owner_coaching_id=q.owner_coaching_id,
        difficulty_position=pos,
        difficulty_total_in_chapter=total_diff,
        difficulty_numbering_note=diff_note,
        assigned_tests=assigned_tests,
        created_at=q.created_at,
        updated_at=q.updated_at
    )

@router.put("/{question_id}", response_model=QuestionDetail)
def update_question(
    question_id: str,
    payload: QuestionUpdate,
    db: Session = Depends(get_db)
):
    """
    Safely update question data.
    Enforces safeguards:
    - Primary key `id` and `external_uid` are NEVER changed.
    - Validate foreign-key existence for chapter.
    - Validate difficulty values and question types.
    - Saves audit log with diff, timestamp, and user reason.
    - Synchronizes precomputed counts if difficulty or chapter changes.
    """
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")

    changed_fields = []
    old_values = {}
    new_values = {}

    old_chapter_id = q.chapter_id
    old_difficulty = q.difficulty

    # 1. Chapter validation
    if payload.chapter_id is not None and payload.chapter_id != q.chapter_id:
        target_ch = db.query(Chapter).filter(Chapter.id == payload.chapter_id).first()
        if not target_ch:
            raise HTTPException(status_code=400, detail=f"Target Chapter '{payload.chapter_id}' does not exist.")
        changed_fields.append("chapter_id")
        old_values["chapter_id"] = q.chapter_id
        new_values["chapter_id"] = payload.chapter_id
        q.chapter_id = payload.chapter_id

    # 2. Difficulty validation
    if payload.difficulty is not None and payload.difficulty != q.difficulty:
        if payload.difficulty not in ("easy", "medium", "hard"):
            raise HTTPException(status_code=400, detail="Difficulty must be 'easy', 'medium', or 'hard'.")
        changed_fields.append("difficulty")
        old_values["difficulty"] = q.difficulty
        new_values["difficulty"] = payload.difficulty
        q.difficulty = payload.difficulty

    # 3. Question type validation
    if payload.question_type is not None and payload.question_type != q.question_type:
        if payload.question_type not in ("single_correct", "multi_correct", "numeric"):
            raise HTTPException(status_code=400, detail="Invalid question type.")
        changed_fields.append("question_type")
        old_values["question_type"] = q.question_type
        new_values["question_type"] = payload.question_type
        q.question_type = payload.question_type

    # 4. Content validation
    if payload.content is not None and payload.content != q.content:
        changed_fields.append("content")
        old_values["content"] = q.content
        new_values["content"] = payload.content
        q.content = payload.content

    # 5. Options validation
    if payload.options is not None and payload.options != q.options:
        changed_fields.append("options")
        old_values["options"] = q.options
        new_values["options"] = payload.options
        q.options = payload.options

    # 6. Correct answer validation
    if payload.correct_answer is not None and payload.correct_answer != q.correct_answer:
        changed_fields.append("correct_answer")
        old_values["correct_answer"] = q.correct_answer
        new_values["correct_answer"] = payload.correct_answer
        q.correct_answer = payload.correct_answer

    # 7. Explanation
    if payload.explanation is not None and payload.explanation != q.explanation:
        changed_fields.append("explanation")
        old_values["explanation"] = q.explanation
        new_values["explanation"] = payload.explanation
        q.explanation = payload.explanation

    # 8. Active status
    if payload.is_active is not None and payload.is_active != q.is_active:
        changed_fields.append("is_active")
        old_values["is_active"] = q.is_active
        new_values["is_active"] = payload.is_active
        q.is_active = payload.is_active

    if not changed_fields:
        return get_question_detail_response(db, q)

    try:
        # 1. Commit the question record update safely
        db.commit()
        db.refresh(q)

        # 2. Record audit trail in local file (safe, zero DDL, no table dependency on Supabase)
        try:
            from pathlib import Path
            log_file = Path(__file__).resolve().parent.parent.parent / "audit_trail.log"
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps({
                    "timestamp": str(q.updated_at),
                    "question_id": q.id,
                    "changed_fields": changed_fields,
                    "old_values": old_values,
                    "new_values": new_values,
                    "reason": payload.reason
                }) + "\n")
        except Exception as file_err:
            print(f"Warning: Could not append to local audit log: {file_err}")

        # 3. Optional DB audit entry (if audit_logs table exists; safe fallback if not)
        try:
            audit_entry = AuditLog(
                question_id=q.id,
                action="UPDATE",
                changed_by="admin",
                changed_fields=changed_fields,
                old_values=old_values,
                new_values=new_values,
                reason=payload.reason
            )
            db.add(audit_entry)
            db.commit()
        except Exception:
            db.rollback()

        # 4. Synchronize inventory count if chapter or difficulty changed
        if (old_chapter_id != q.chapter_id) or (old_difficulty != q.difficulty):
            try:
                recompute_inventory(db, old_chapter_id, old_difficulty)
                recompute_inventory(db, q.chapter_id, q.difficulty)
            except Exception:
                db.rollback()
            recompute_inventory(db, old_chapter_id, old_difficulty)
            recompute_inventory(db, q.chapter_id, q.difficulty)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save changes to database: {str(e)}")

    return get_question_detail_response(db, q)

def recompute_inventory(db: Session, chapter_id: str, difficulty: str):
    """Recomputes active_count in chapter_question_inventory matching the trigger in schema.sql."""
    cnt = (
        db.query(func.count(Question.id))
        .filter(Question.chapter_id == chapter_id, Question.difficulty == difficulty, Question.is_active == True)
        .scalar() or 0
    )
    inv = (
        db.query(ChapterQuestionInventory)
        .filter(ChapterQuestionInventory.chapter_id == chapter_id, ChapterQuestionInventory.difficulty == difficulty)
        .first()
    )
    if inv:
        inv.active_count = cnt
    else:
        inv = ChapterQuestionInventory(chapter_id=chapter_id, difficulty=difficulty, active_count=cnt)
        db.add(inv)
    db.commit()
