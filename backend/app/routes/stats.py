from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Subject, Chapter, Question, Test
from app.schemas import DashboardStats
from app.config import DATABASE_URL

router = APIRouter(prefix="/api/stats", tags=["Dashboard Statistics"])

@router.get("", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Retrieve overarching summary numbers for the top dashboard cards."""
    total_subjects = db.query(func.count(Subject.id)).scalar() or 0
    total_chapters = db.query(func.count(Chapter.id)).scalar() or 0
    # Count unique question IDs to ensure questions in multiple tests are not double-counted
    total_questions = db.query(func.count(Question.id)).scalar() or 0
    total_tests = db.query(func.count(Test.id)).scalar() or 0

    easy_questions = db.query(func.count(Question.id)).filter(Question.difficulty == "easy").scalar() or 0
    medium_questions = db.query(func.count(Question.id)).filter(Question.difficulty == "medium").scalar() or 0
    hard_questions = db.query(func.count(Question.id)).filter(Question.difficulty == "hard").scalar() or 0

    active_questions = db.query(func.count(Question.id)).filter(Question.is_active == True).scalar() or 0
    inactive_questions = db.query(func.count(Question.id)).filter(Question.is_active == False).scalar() or 0

    published_tests = db.query(func.count(Test.id)).filter(Test.status == "published").scalar() or 0
    draft_tests = db.query(func.count(Test.id)).filter(Test.status == "draft").scalar() or 0

    mode = "Supabase PostgreSQL" if ("postgres" in DATABASE_URL.lower() or "supabase" in DATABASE_URL.lower()) else "Local Development SQLite"

    return DashboardStats(
        total_subjects=total_subjects,
        total_questions=total_questions,
        total_chapters=total_chapters,
        total_tests=total_tests,
        easy_questions=easy_questions,
        medium_questions=medium_questions,
        hard_questions=hard_questions,
        active_questions=active_questions,
        inactive_questions=inactive_questions,
        total_tests_published=published_tests,
        total_tests_draft=draft_tests,
        database_mode=mode
    )
