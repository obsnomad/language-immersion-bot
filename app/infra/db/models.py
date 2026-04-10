from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    first_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    profile: Mapped[UserProfile | None] = relationship(back_populates="user")
    sessions: Mapped[list[LearningSession]] = relationship(back_populates="user")
    mistakes: Mapped[list[Mistake]] = relationship(back_populates="user")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    native_language: Mapped[str] = mapped_column(String(8), default="ru")
    target_languages: Mapped[str] = mapped_column(String(64), default="en")
    current_level: Mapped[str | None] = mapped_column(String(16), nullable=True)
    preferred_mode: Mapped[str | None] = mapped_column(String(32), nullable=True)
    feedback_style: Mapped[str] = mapped_column(String(32), default="delayed")
    goals: Mapped[str | None] = mapped_column(Text(), nullable=True)

    user: Mapped[User] = relationship(back_populates="profile")


class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    language: Mapped[str] = mapped_column(String(8))
    mode: Mapped[str] = mapped_column(String(32))
    agent_role: Mapped[str] = mapped_column(String(64))
    correction_mode: Mapped[str] = mapped_column(String(32), default="delayed")
    scenario_hint: Mapped[str | None] = mapped_column(Text(), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active")
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped[User] = relationship(back_populates="sessions")
    turns: Mapped[list[MessageTurn]] = relationship(back_populates="session")


class MessageTurn(Base):
    __tablename__ = "message_turns"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("learning_sessions.id"), index=True)
    role: Mapped[str] = mapped_column(String(32))
    text: Mapped[str] = mapped_column(Text())
    corrected_text: Mapped[str | None] = mapped_column(Text(), nullable=True)
    metadata_json: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped[LearningSession] = relationship(back_populates="turns")


class Mistake(Base):
    __tablename__ = "mistakes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    language: Mapped[str] = mapped_column(String(8), index=True)
    type: Mapped[str] = mapped_column(String(32))
    source_text: Mapped[str] = mapped_column(Text())
    correction: Mapped[str] = mapped_column(Text())
    explanation: Mapped[str] = mapped_column(Text())
    severity: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(32), default="open")
    next_review_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="mistakes")
