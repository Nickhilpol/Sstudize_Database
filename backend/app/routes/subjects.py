from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Subject, Chapter, Question
from app.schemas import SubjectRead, ChapterRead

router = APIRouter(prefix="/api/subjects", tags=["Subjects"])

@router.get("", response_model=List[SubjectRead])
def list_subjects(db: Session = Depends(get_db)):
    """List all subjects with chapter counts and total question counts."""
    subjects = db.query(Subject).order_by(Subject.display_order.asc(), Subject.name.asc()).all()
    results = []

    for s in subjects:
        # Number of chapters in this subject
        ch_count = db.query(func.count(Chapter.id)).filter(Chapter.subject_id == s.id).scalar() or 0
        
        # Number of questions in this subject (through chapters)
        q_count = (
            db.query(func.count(Question.id))
            .join(Chapter, Chapter.id == Question.chapter_id)
            .filter(Chapter.subject_id == s.id)
            .scalar() or 0
        )

        results.append(
            SubjectRead(
                id=s.id,
                name=s.name,
                display_name=s.display_name,
                display_order=s.display_order,
                chapter_count=ch_count,
                question_count=q_count
            )
        )

    return results

@router.get("/{subject_id}/chapters", response_model=List[ChapterRead])
def get_subject_chapters(subject_id: str, db: Session = Depends(get_db)):
    """Get all chapters for a specific subject with detailed difficulty counts."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    chapters = db.query(Chapter).filter(Chapter.subject_id == subject_id).order_by(Chapter.name.asc()).all()
    results = []

    for ch in chapters:
        easy_cnt = db.query(func.count(Question.id)).filter(Question.chapter_id == ch.id, Question.difficulty == "easy").scalar() or 0
        med_cnt = db.query(func.count(Question.id)).filter(Question.chapter_id == ch.id, Question.difficulty == "medium").scalar() or 0
        hard_cnt = db.query(func.count(Question.id)).filter(Question.chapter_id == ch.id, Question.difficulty == "hard").scalar() or 0
        total_cnt = easy_cnt + med_cnt + hard_cnt

        results.append(
            ChapterRead(
                id=ch.id,
                subject_id=ch.subject_id,
                name=ch.name,
                display_name=ch.display_name,
                grade=ch.grade,
                subject_name=subject.name,
                subject_display_name=subject.display_name,
                easy_count=easy_cnt,
                medium_count=med_cnt,
                hard_count=hard_cnt,
                total_count=total_cnt,
                discrepancy_detected=False
            )
        )

    return results
