from enum import StrEnum


class LanguageCode(StrEnum):
    ENGLISH = "en"
    SPANISH = "es"
    SERBIAN = "sr"


class LearningMode(StrEnum):
    CONVERSATION = "conversation"
    SCENARIO = "scenario"
    GRAMMAR = "grammar"
    VOCABULARY = "vocabulary"
    EXAM = "exam"
    WRITING = "writing"
    REVIEW = "review"


class AgentRole(StrEnum):
    CONVERSATION = "conversation_agent"
    TEACHER = "teacher_agent"
    EXAMINER = "examiner_agent"
    FEEDBACK = "feedback_agent"
    REVIEW = "review_agent"


class CorrectionMode(StrEnum):
    INLINE = "inline"
    DELAYED = "delayed"
    CRITICAL_ONLY = "critical_only"


class SessionStatus(StrEnum):
    ACTIVE = "active"
    COMPLETED = "completed"


class MistakeType(StrEnum):
    GRAMMAR = "grammar"
    VOCABULARY = "vocabulary"
    TENSE = "tense"
    PREPOSITION = "preposition"
    AGREEMENT = "agreement"
    WORD_ORDER = "word_order"
    STYLE = "style"
