from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Test, TestQuestion, Question, Chapter, Subject
from app.schemas import TestRead, TestDetail, TestQuestionDetail
from app.routes.chapters import extract_preview

router = APIRouter(prefix="/api/tests", tags=["Tests"])

@router.get("", response_model=List[TestRead])
def list_tests(
    search: Optional[str] = Query(None, description="Search by Test ID or title"),
    exam_type: Optional[str] = Query(None, description="Filter by exam type"),
    status: Optional[str] = Query(None, description="Filter by status (published/draft)"),
    db: Session = Depends(get_db)
):
    """List all tests with summary question count, assigned subjects, and conflict detection."""
    query = db.query(Test)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Test.title.ilike(s)) | (Test.id.ilike(s)))

    if exam_type:
        query = query.filter(Test.exam_type == exam_type.lower())

    if status:
        query = query.filter(Test.status == status.lower())

    tests = query.order_by(Test.created_at.desc(), Test.title.asc()).all()
    results = []

    for t in tests:
        # Total questions in this test
        total_q = db.query(func.count(TestQuestion.id)).filter(TestQuestion.test_id == t.id).scalar() or 0

        # Unique subjects covered by questions in this test
        subject_names = (
            db.query(Subject.display_name)
            .join(Chapter, Chapter.subject_id == Subject.id)
            .join(Question, Question.chapter_id == Chapter.id)
            .join(TestQuestion, TestQuestion.question_id == Question.id)
            .filter(TestQuestion.test_id == t.id)
            .distinct()
            .all()
        )
        subjects_list = [sn[0] for sn in subject_names if sn[0]]

        # Check for duplicate order numbers in test_questions
        order_counts = (
            db.query(TestQuestion.question_order, func.count(TestQuestion.id))
            .filter(TestQuestion.test_id == t.id)
            .group_by(TestQuestion.question_order)
            .having(func.count(TestQuestion.id) > 1)
            .all()
        )
        has_conflicts = len(order_counts) > 0

        results.append(
            TestRead(
                id=t.id,
                coaching_id=t.coaching_id,
                title=t.title,
                description=t.description,
                duration_minutes=t.duration_minutes,
                availability_start_time=t.availability_start_time,
                availability_end_time=t.availability_end_time,
                exam_type=t.exam_type,
                mode=t.mode,
                status=t.status,
                total_questions=total_q,
                subjects=subjects_list,
                has_ordering_conflicts=has_conflicts
            )
        )

    return results

@router.get("/{test_id}", response_model=TestDetail)
def get_test_detail(test_id: str, db: Session = Depends(get_db)):
    """Retrieve full test details and ordered questions list with database question_order."""
    t = db.query(Test).filter(Test.id == test_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Test not found")

    # Fetch test questions ordered by actual stored database question_order
    links = (
        db.query(TestQuestion, Question, Chapter, Subject)
        .outerjoin(Question, Question.id == TestQuestion.question_id)
        .outerjoin(Chapter, Chapter.id == Question.chapter_id)
        .outerjoin(Subject, Subject.id == Chapter.subject_id)
        .filter(TestQuestion.test_id == t.id)
        .order_by(TestQuestion.question_order.asc(), TestQuestion.id.asc())
        .all()
    )

    questions_list = []
    seen_orders = set()
    ordering_warnings = []
    subjects_set = set()

    for tq, q, ch, subj in links:
        if tq.question_order in seen_orders:
            ordering_warnings.append(
                f"Duplicate Test Order Number #{tq.question_order} detected for Question ID {tq.question_id}!"
            )
        seen_orders.add(tq.question_order)

        if not q:
            ordering_warnings.append(
                f"Missing Question Reference: Question ID {tq.question_id} does not exist in the questions table!"
            )
            continue

        subj_name = subj.display_name if subj else "Unknown"
        ch_name = (ch.display_name or ch.name) if ch else "Unknown"
        if subj and subj.display_name:
            subjects_set.add(subj.display_name)

        questions_list.append(
            TestQuestionDetail(
                question_order=tq.question_order,
                question_id=q.id,
                external_uid=q.external_uid,
                difficulty=q.difficulty,
                question_type=q.question_type,
                preview_text=extract_preview(q.content),
                subject_name=subj_name,
                chapter_name=ch_name,
                chapter_id=q.chapter_id,
                is_active=q.is_active
            )
        )

    return TestDetail(
        id=t.id,
        title=t.title,
        description=t.description,
        duration_minutes=t.duration_minutes,
        availability_start_time=t.availability_start_time,
        availability_end_time=t.availability_end_time,
        exam_type=t.exam_type,
        mode=t.mode,
        status=t.status,
        total_questions=len(questions_list),
        subjects=sorted(list(subjects_set)),
        has_ordering_conflicts=len(ordering_warnings) > 0,
        ordering_warnings=ordering_warnings,
        questions=questions_list
    )
