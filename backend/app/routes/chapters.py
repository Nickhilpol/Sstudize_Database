from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Subject, Chapter, Question, ChapterQuestionInventory
from app.schemas import ChapterRead, QuestionSummary

router = APIRouter(prefix="/api/chapters", tags=["Chapters"])

@router.get("", response_model=List[ChapterRead])
def list_chapters(
    subject_id: Optional[str] = Query(None, description="Filter by subject ID"),
    search: Optional[str] = Query(None, description="Search by chapter name or ID"),
    difficulty: Optional[str] = Query(None, description="Filter chapters having questions of this difficulty"),
    anomalies_only: bool = Query(False, description="Filter chapters having inventory count discrepancies or orphan states"),
    db: Session = Depends(get_db)
):
    """List chapters with questions breakdown (Easy, Medium, Hard, Total) and search filters."""
    query = db.query(Chapter).join(Subject, Subject.id == Chapter.subject_id)

    if subject_id:
        query = query.filter(Chapter.subject_id == subject_id)

    if search:
        s_term = f"%{search.strip()}%"
        query = query.filter((Chapter.name.ilike(s_term)) | (Chapter.display_name.ilike(s_term)) | (Chapter.id.ilike(s_term)))

    chapters = query.order_by(Subject.display_order.asc(), Chapter.name.asc()).all()
    results = []

    for ch in chapters:
        easy_cnt = db.query(func.count(Question.id)).filter(Question.chapter_id == ch.id, Question.difficulty == "easy").scalar() or 0
        med_cnt = db.query(func.count(Question.id)).filter(Question.chapter_id == ch.id, Question.difficulty == "medium").scalar() or 0
        hard_cnt = db.query(func.count(Question.id)).filter(Question.chapter_id == ch.id, Question.difficulty == "hard").scalar() or 0
        total_cnt = easy_cnt + med_cnt + hard_cnt

        # Check inventory cache discrepancy if chapter_question_inventory exists
        cached_rows = db.query(ChapterQuestionInventory).filter(ChapterQuestionInventory.chapter_id == ch.id).all()
        has_discrepancy = False
        if cached_rows:
            inv_map = {row.difficulty: row.active_count for row in cached_rows}
            if (
                inv_map.get("easy", 0) != easy_cnt or
                inv_map.get("medium", 0) != med_cnt or
                inv_map.get("hard", 0) != hard_cnt
            ):
                has_discrepancy = True

        if difficulty:
            diff_lower = difficulty.lower()
            if diff_lower == "easy" and easy_cnt == 0:
                continue
            elif diff_lower == "medium" and med_cnt == 0:
                continue
            elif diff_lower == "hard" and hard_cnt == 0:
                continue

        if anomalies_only and not has_discrepancy:
            continue

        results.append(
            ChapterRead(
                id=ch.id,
                subject_id=ch.subject_id,
                name=ch.name,
                display_name=ch.display_name,
                grade=ch.grade,
                subject_name=ch.subject.name if ch.subject else "Unknown",
                subject_display_name=ch.subject.display_name if ch.subject else "Unknown",
                easy_count=easy_cnt,
                medium_count=med_cnt,
                hard_count=hard_cnt,
                total_count=total_cnt,
                discrepancy_detected=has_discrepancy
            )
        )

    return results

@router.get("/{chapter_id}", response_model=ChapterRead)
def get_chapter(chapter_id: str, db: Session = Depends(get_db)):
    """Get single chapter details."""
    ch = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not ch:
        raise HTTPException(status_code=404, detail="Chapter not found")

    easy_cnt = db.query(func.count(Question.id)).filter(Question.chapter_id == ch.id, Question.difficulty == "easy").scalar() or 0
    med_cnt = db.query(func.count(Question.id)).filter(Question.chapter_id == ch.id, Question.difficulty == "medium").scalar() or 0
    hard_cnt = db.query(func.count(Question.id)).filter(Question.chapter_id == ch.id, Question.difficulty == "hard").scalar() or 0
    total_cnt = easy_cnt + med_cnt + hard_cnt

    return ChapterRead(
        id=ch.id,
        subject_id=ch.subject_id,
        name=ch.name,
        display_name=ch.display_name,
        grade=ch.grade,
        subject_name=ch.subject.name if ch.subject else "Unknown",
        subject_display_name=ch.subject.display_name if ch.subject else "Unknown",
        easy_count=easy_cnt,
        medium_count=med_cnt,
        hard_count=hard_cnt,
        total_count=total_cnt,
        discrepancy_detected=False
    )

def extract_preview(content: any) -> str:
    """Helper to convert json/string content to clean plain text preview."""
    if isinstance(content, str):
        return content[:150]
    elif isinstance(content, dict):
        if "text" in content:
            return str(content["text"])[:150]
        if "question" in content:
            return str(content["question"])[:150]
        return str(content)[:150]
    return str(content)[:150]

@router.get("/{chapter_id}/questions", response_model=List[QuestionSummary])
def get_chapter_questions(
    chapter_id: str,
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    search: Optional[str] = Query(None, description="Search by UID or text"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Retrieve all questions under a chapter with sequence indices."""
    ch = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not ch:
        raise HTTPException(status_code=404, detail="Chapter not found")

    query = db.query(Question).filter(Question.chapter_id == chapter_id)

    if difficulty:
        query = query.filter(Question.difficulty == difficulty.lower())

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Question.id.ilike(s)) |
            (Question.external_uid.ilike(s)) |
            (Question.content.astext.ilike(s) if hasattr(Question.content, "astext") else Question.id.ilike(s))
        )

    # Order by difficulty and creation date
    questions = query.order_by(Question.difficulty.asc(), Question.created_at.asc(), Question.id.asc()).offset(offset).limit(limit).all()

    # Pre-calculate difficulty sequence numbers within this chapter
    # (Since database has no native level-order column, we determine deterministic sequence)
    all_ch_questions = (
        db.query(Question.id, Question.difficulty)
        .filter(Question.chapter_id == chapter_id)
        .order_by(Question.created_at.asc(), Question.id.asc())
        .all()
    )
    diff_counters = {"easy": 0, "medium": 0, "hard": 0}
    rank_map = {}
    for q_id, q_diff in all_ch_questions:
        d = q_diff.lower() if q_diff else "easy"
        diff_counters[d] = diff_counters.get(d, 0) + 1
        rank_map[q_id] = diff_counters[d]

    results = []
    for q in questions:
        results.append(
            QuestionSummary(
                id=q.id,
                external_uid=q.external_uid,
                chapter_id=q.chapter_id,
                chapter_name=ch.display_name or ch.name,
                subject_id=ch.subject_id,
                subject_name=ch.subject.display_name if ch.subject else "",
                difficulty=q.difficulty,
                question_type=q.question_type,
                is_active=q.is_active,
                preview_text=extract_preview(q.content),
                difficulty_rank=rank_map.get(q.id, 1),
                created_at=q.created_at
            )
        )

    return results
