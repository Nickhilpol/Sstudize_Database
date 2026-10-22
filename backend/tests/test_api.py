import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Question, Chapter, AuditLog

client = TestClient(app)

def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_dashboard_stats():
    res = client.get("/api/stats")
    assert res.status_code == 200
    data = res.json()
    assert data["total_subjects"] >= 4
    assert data["total_chapters"] >= 16
    assert data["total_questions"] >= 10
    assert data["total_tests"] >= 3
    assert data["easy_questions"] >= 1
    assert data["medium_questions"] >= 1

def test_subjects_endpoint():
    res = client.get("/api/subjects")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 4
    physics = next((s for s in data if s["name"] == "physics"), None)
    assert physics is not None
    assert physics["chapter_count"] >= 5

def test_chapters_endpoint():
    res = client.get("/api/chapters")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 16
    first_ch = data[0]
    assert "easy_count" in first_ch
    assert "medium_count" in first_ch
    assert "hard_count" in first_ch
    assert "total_count" in first_ch

def test_question_lookup_and_not_found():
    # 1. Test unknown UID returns 404
    fake_uid = "00000000-0000-0000-0000-000000000000"
    res = client.get(f"/api/questions/lookup?uid={fake_uid}")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

    # 2. Test existing question returns exact match
    db = SessionLocal()
    q = db.query(Question).first()
    db.close()
    assert q is not None

    res = client.get(f"/api/questions/lookup?uid={q.id}")
    assert res.status_code == 200
    detail = res.json()
    assert detail["id"] == q.id
    assert detail["difficulty"] == q.difficulty
    assert "difficulty_position" in detail
    assert "difficulty_numbering_note" in detail

def test_test_explorer_order():
    res = client.get("/api/tests")
    assert res.status_code == 200
    tests = res.json()
    assert len(tests) >= 3

    t1 = tests[0]
    res_detail = client.get(f"/api/tests/{t1['id']}")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert "questions" in detail

    # Verify questions are strictly sorted by database question_order
    orders = [q["question_order"] for q in detail["questions"]]
    assert orders == sorted(orders), "Questions must follow stored test_order sequencing!"

def test_safe_question_update_and_audit():
    db = SessionLocal()
    q = db.query(Question).first()
    old_content = q.content
    q_id = q.id
    db.close()

    updated_text = "Updated statement for testing safe question editing."
    res = client.put(
        f"/api/questions/{q_id}",
        json={
            "content": updated_text,
            "difficulty": "medium",
            "reason": "Correcting question wording in unit test"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["content"] == updated_text
    assert data["id"] == q_id, "Primary key ID must NEVER change during update!"

    # Verify audit log was created
    db = SessionLocal()
    audit = db.query(AuditLog).filter(AuditLog.question_id == q_id).order_by(AuditLog.created_at.desc()).first()
    assert audit is not None
    assert "content" in audit.changed_fields
    assert audit.reason == "Correcting question wording in unit test"
    db.close()

def test_invalid_foreign_key_update():
    db = SessionLocal()
    q = db.query(Question).first()
    q_id = q.id
    db.close()

    res = client.put(
        f"/api/questions/{q_id}",
        json={"chapter_id": "nonexistent-chapter-id-9999"}
    )
    assert res.status_code == 400
    assert "does not exist" in res.json()["detail"]

def test_diagnostics_scanner():
    res = client.get("/api/diagnostics")
    assert res.status_code == 200
    data = res.json()
    assert "total_issues" in data
    assert "critical_count" in data
    assert "warning_count" in data
    assert "issues" in data
