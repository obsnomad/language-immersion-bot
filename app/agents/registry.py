from app.agents.specialists import (
    ConversationAgent,
    ExaminerAgent,
    FeedbackAgent,
    ReviewAgent,
    TeacherAgent,
)
from app.domain.enums import AgentRole
from app.llm.base import LLMClient


class AgentRegistry:
    def __init__(self, llm_client: LLMClient) -> None:
        self._agents = {
            AgentRole.CONVERSATION: ConversationAgent(llm_client),
            AgentRole.TEACHER: TeacherAgent(llm_client),
            AgentRole.EXAMINER: ExaminerAgent(llm_client),
            AgentRole.FEEDBACK: FeedbackAgent(llm_client),
            AgentRole.REVIEW: ReviewAgent(llm_client),
        }

    def get(self, role: AgentRole):
        return self._agents[role]
