import json
from pathlib import Path
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AuditLog
from app.schemas import AuditLogRead

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogRead])
def list_audit_logs(
    question_id: str = Query(None, description="Filter logs for a specific question ID"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Retrieve audit trail of changes made through the SStudizer Database Management application."""
    try:
        query = db.query(AuditLog)
        if question_id:
            query = query.filter(AuditLog.question_id == question_id.strip())
        logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
        return logs
    except Exception:
        db.rollback()
        # Fallback to local audit log file
        log_file = Path(__file__).resolve().parent.parent.parent / "audit_trail.log"
        fallback_logs = []
        if log_file.exists():
            with open(log_file, "r", encoding="utf-8") as f:
                for line in f:
                    if not line.strip():
                        continue
                    try:
                        entry = json.loads(line)
                        if question_id and entry.get("question_id") != question_id.strip():
                            continue
                        fallback_logs.append(
                            AuditLogRead(
                                id=entry.get("question_id", "local"),
                                question_id=entry.get("question_id", ""),
                                action="UPDATE",
                                changed_by="admin",
                                changed_fields=entry.get("changed_fields", []),
                                old_values=entry.get("old_values"),
                                new_values=entry.get("new_values"),
                                reason=entry.get("reason"),
                                created_at=datetime.fromisoformat(entry.get("timestamp")) if "timestamp" in entry else datetime.now(timezone.utc)
                            )
                        )
                    except Exception:
                        pass
        return fallback_logs[:limit]
