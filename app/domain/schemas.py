from datetime import datetime

from pydantic import BaseModel, Field

from app.domain.enums import AgentRole, CorrectionMode, LanguageCode, LearningMode, MistakeType


class RouteDecision(BaseModel):
    language: LanguageCode = LanguageCode.ENGLISH
    support_language: str = "ru"
    mode: LearningMode = LearningMode.CONVERSATION
    agent: AgentRole = AgentRole.CONVERSATION
    correction_mode: CorrectionMode = CorrectionMode.DELAYED
    save_memory: bool = True
    scenario_hint: str | None = None


class AgentReply(BaseModel):
    text: str
    short_correction: str | None = None
    suggested_reply: str | None = None


class MistakeRecord(BaseModel):
    category: MistakeType
    source_text: str
    correction: str
    explanation: str
    severity: int = Field(default=1, ge=1, le=5)


class FeedbackResult(BaseModel):
    mistakes: list[MistakeRecord] = Field(default_factory=list)
    summary: str | None = None


class SessionSnapshot(BaseModel):
    session_id: int
    language: LanguageCode
    mode: LearningMode
    agent: AgentRole
    correction_mode: CorrectionMode
    started_at: datetime


class PracticeResult(BaseModel):
    reply_text: str
    route: RouteDecision
    feedback: FeedbackResult
    session: SessionSnapshot
