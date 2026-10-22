import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    SmallInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    UniqueConstraint,
    Index
)
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

def generate_uuid():
    return str(uuid.uuid4())

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(150), nullable=False)
    display_order = Column(SmallInteger, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    # Relationships
    chapters = relationship("Chapter", back_populates="subject", cascade="all, delete-orphan")

class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    display_name = Column(String(250), nullable=False)
    grade = Column(String(20), nullable=True) # '11th', '12th'
    created_at = Column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (
        UniqueConstraint("subject_id", "name", name="chapters_unique_per_subject"),
    )

    # Relationships
    subject = relationship("Subject", back_populates="chapters")
    questions = relationship("Question", back_populates="chapter")
    inventory = relationship("ChapterQuestionInventory", back_populates="chapter", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    chapter_id = Column(String(36), ForeignKey("chapters.id", ondelete="RESTRICT"), nullable=False, index=True)
    difficulty = Column(String(20), nullable=False, index=True) # 'easy', 'medium', 'hard'
    question_type = Column(String(30), nullable=False) # 'single_correct', 'multi_correct', 'numeric'
    content = Column(JSON, nullable=False) # Text, markdown, or JSON structure
    options = Column(JSON, nullable=True) # Array of option objects or strings
    correct_answer = Column(JSON, nullable=False) # e.g. "A", ["A", "C"], or "4.5"
    explanation = Column(JSON, nullable=True) # Detailed reasoning, solution, formulas
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    external_uid = Column(String(36), nullable=False, default=generate_uuid, index=True)
    source_type = Column(String(50), nullable=False, default="dataset") # 'dataset' or 'custom'
    owner_coaching_id = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    __table_args__ = (
        Index("questions_chapter_diff_type_idx", "chapter_id", "difficulty", "question_type"),
    )

    # Relationships
    chapter = relationship("Chapter", back_populates="questions")
    test_links = relationship("TestQuestion", back_populates="question")

class ChapterQuestionInventory(Base):
    __tablename__ = "chapter_question_inventory"

    chapter_id = Column(String(36), ForeignKey("chapters.id", ondelete="CASCADE"), primary_key=True)
    difficulty = Column(String(20), primary_key=True) # 'easy', 'medium', 'hard'
    active_count = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    chapter = relationship("Chapter", back_populates="inventory")

class Test(Base):
    __tablename__ = "tests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    coaching_id = Column(String(36), nullable=True)
    title = Column(String(250), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=False, default=60)
    availability_start_time = Column(DateTime(timezone=True), nullable=True)
    availability_end_time = Column(DateTime(timezone=True), nullable=True)
    exam_type = Column(String(50), nullable=True) # 'jee', 'neet', 'mhtcet_pcm', 'mhtcet_pcb'
    mode = Column(String(20), nullable=False, default="online") # 'online', 'offline'
    status = Column(String(20), nullable=False, default="draft") # 'draft', 'published'
    created_by = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    question_links = relationship(
        "TestQuestion",
        back_populates="test",
        cascade="all, delete-orphan",
        order_by="TestQuestion.question_order"
    )

class TestQuestion(Base):
    __tablename__ = "test_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    test_id = Column(String(36), ForeignKey("tests.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="RESTRICT"), nullable=False, index=True)
    question_order = Column(SmallInteger, nullable=False)

    __table_args__ = (
        UniqueConstraint("test_id", "question_id", name="tq_unique_question"),
        UniqueConstraint("test_id", "question_order", name="tq_unique_order"),
    )

    # Relationships
    test = relationship("Test", back_populates="question_links")
    question = relationship("Question", back_populates="test_links")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_id = Column(String(36), nullable=False, index=True)
    action = Column(String(50), nullable=False, default="UPDATE")
    changed_by = Column(String(100), nullable=False, default="admin")
    changed_fields = Column(JSON, nullable=False)
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
