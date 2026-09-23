from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from datetime import datetime

from app.database import Base


# =========================
# USERS
# =========================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    password = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        default="student"
    )

    phone = Column(
        String,
        nullable=True
    )

    college = Column(
        String,
        nullable=True
    )

    degree = Column(
        String,
        nullable=True
    )

    skills = Column(
        Text,
        nullable=True
    )

    graduation_year = Column(
        Integer,
        nullable=True
    )


# =========================
# RESUMES
# =========================

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    filename = Column(
        String,
        nullable=False
    )

    file_path = Column(
        String,
        nullable=False
    )

    extracted_text = Column(
        Text,
        nullable=True
    )

    analysis_score = Column(
        Float,
        nullable=True
    )

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# =========================
# JOBS
# =========================

class Job(Base):
    __tablename__ = "jobs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String,
        nullable=False
    )

    company = Column(
        String,
        nullable=False
    )

    location = Column(
        String,
        nullable=True
    )

    job_type = Column(
        String,
        nullable=True
    )

    description = Column(
        Text,
        nullable=True
    )

    skills = Column(
        Text,
        nullable=True
    )


# =========================
# JOB MATCHES
# =========================

class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    job_id = Column(
        Integer,
        ForeignKey("jobs.id"),
        nullable=False,
        index=True
    )

    match_percentage = Column(
        Float,
        nullable=True
    )

    matched_skills = Column(
        Text,
        nullable=True
    )

    missing_skills = Column(
        Text,
        nullable=True
    )


# =========================
# JOB APPLICATIONS
# =========================

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, index=True)
    status = Column(String, nullable=False, default="applied")
    cover_note = Column(Text, nullable=True)
    applied_at = Column(DateTime, default=datetime.utcnow)


# =========================
# ROADMAP PROGRESS
# =========================

class RoadmapProgress(Base):
    __tablename__ = "roadmap_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    target_role = Column(String, nullable=False, index=True)
    skill = Column(String, nullable=False)
    completed = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# =========================
# INTERVIEW SESSIONS
# =========================

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    target_role = Column(
        String,
        nullable=False
    )

    score = Column(
        Float,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# =========================
# INTERVIEW RESULTS
# =========================

class InterviewResult(Base):
    __tablename__ = "interview_results"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    session_id = Column(
        Integer,
        ForeignKey("interview_sessions.id"),
        nullable=False,
        index=True
    )

    question = Column(
        Text,
        nullable=False
    )

    answer = Column(
        Text,
        nullable=True
    )

    evaluation = Column(
        Text,
        nullable=True
    )

    score = Column(
        Float,
        nullable=True
    )