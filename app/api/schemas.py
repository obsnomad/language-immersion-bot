from datetime import datetime

from pydantic import BaseModel, Field

from app.domain.enums import AgentRole, CorrectionMode, LanguageCode, LearningMode


class TelegramMiniAppAuthRequest(BaseModel):
    init_data: str = Field(min_length=1)


class UserResponse(BaseModel):
    id: int
    telegram_id: int
    username: str | None = None
    first_name: str | None = None
    created_at: datetime


class ProfileResponse(BaseModel):
    native_language: str
    target_languages: list[str]
    current_level: str | None = None
    preferred_mode: str | None = None
    feedback_style: str
    goals: str | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    user: UserResponse
    profile: ProfileResponse


class UpdateProfileRequest(BaseModel):
    native_language: str | None = Field(default=None, min_length=2, max_length=8)
    target_languages: list[LanguageCode] | None = None
    current_level: str | None = Field(default=None, max_length=16)
    preferred_mode: LearningMode | None = None
    feedback_style: CorrectionMode | None = None
    goals: str | None = None


class PracticeMessageRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class PracticeMessageResponse(BaseModel):
    reply_text: str
    session_id: int
    language: LanguageCode
    mode: LearningMode
    agent: AgentRole
    correction_mode: CorrectionMode
    feedback_summary: str | None = None
    mistakes_detected: int = 0


class RecentSessionResponse(BaseModel):
    id: int
    language: str
    mode: str
    started_at: datetime
    status: str


class ProgressSummaryResponse(BaseModel):
    sessions_total: int
    open_mistakes: int
    review_due_now: int
    recent_sessions: list[RecentSessionResponse]


class ReviewItemResponse(BaseModel):
    id: int
    language: str
    category: str
    source_text: str
    correction: str
    explanation: str
    severity: int
    next_review_at: datetime | None = None


class ReviewListResponse(BaseModel):
    items: list[ReviewItemResponse]
