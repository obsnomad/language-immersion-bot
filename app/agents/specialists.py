from collections.abc import Sequence

from app.agents.base import BaseAgent
from app.domain.enums import CorrectionMode, LearningMode
from app.domain.schemas import AgentReply, RouteDecision
from app.llm.base import MessagePayload


class ConversationAgent(BaseAgent):
    system_prompt = (
        "You are a friendly language conversation partner. "
        "Keep the interaction immersive, natural, and level-aware. "
        "Ask follow-up questions that move the dialogue forward."
    )

    def build_messages(
        self,
        *,
        route: RouteDecision,
        user_text: str,
        history: Sequence[MessagePayload],
    ) -> list[MessagePayload]:
        correction_instruction = {
            CorrectionMode.INLINE: (
                "If there is a clear mistake, briefly correct it before continuing."
            ),
            CorrectionMode.DELAYED: "Do not interrupt with corrections. Focus on the conversation.",
            CorrectionMode.CRITICAL_ONLY: "Only mention a mistake if it blocks understanding.",
        }[route.correction_mode]
        scenario_text = (
            f"Scenario hint: {route.scenario_hint}. "
            if route.mode is LearningMode.SCENARIO and route.scenario_hint
            else ""
        )
        return [
            {
                "role": "system",
                "content": (
                    f"{self.system_prompt} {scenario_text}"
                    f"Target language for the main dialogue: {route.language.value}. "
                    f"User support language for explanations, corrections, labels, and meta guidance: "
                    f"{route.support_language}. "
                    "Keep the roleplay, conversation, and practice content in the target language. "
                    "Use the support language only for service information such as brief corrections or guidance when needed. "
                    f"{correction_instruction} Keep replies under 120 words."
                ),
            },
            *history,
            {"role": "user", "content": user_text},
        ]


class TeacherAgent(BaseAgent):
    system_prompt = (
        "You are a precise language teacher. Explain grammar and usage clearly. "
        "Use concise examples and then prompt the learner to try."
    )

    def build_messages(
        self,
        *,
        route: RouteDecision,
        user_text: str,
        history: Sequence[MessagePayload],
    ) -> list[MessagePayload]:
        return [
            {
                "role": "system",
                "content": (
                    f"{self.system_prompt} "
                    f"Target language for examples and learner output: {route.language.value}. "
                    f"User support language for explanations and instructions: {route.support_language}. "
                    "Explain rules and meta guidance in the support language. "
                    "Keep exercises, examples, corrected phrases, and final learner tasks in the target language."
                ),
            },
            *history,
            {"role": "user", "content": user_text},
        ]


class ExaminerAgent(BaseAgent):
    system_prompt = (
        "You are a strict but fair language examiner and interviewer. Run structured prompts, "
        "ask one question at a time, and keep pressure appropriate to the requested situation."
    )

    def build_messages(
        self,
        *,
        route: RouteDecision,
        user_text: str,
        history: Sequence[MessagePayload],
    ) -> list[MessagePayload]:
        return [
            {
                "role": "system",
                "content": (
                    f"{self.system_prompt} "
                    f"Run the interview in {route.language.value}. "
                    f"If you need short procedural guidance or correction notes, use {route.support_language}. "
                    "Keep the main interview content in the target language."
                ),
            },
            *history,
            {"role": "user", "content": user_text},
        ]


class ReviewAgent(BaseAgent):
    system_prompt = (
        "You are a review coach. Recycle past mistakes and vocabulary through short drills. "
        "Ask focused questions and wait for the learner to answer."
    )

    def build_messages(
        self,
        *,
        route: RouteDecision,
        user_text: str,
        history: Sequence[MessagePayload],
    ) -> list[MessagePayload]:
        return [
            {
                "role": "system",
                "content": (
                    f"{self.system_prompt} "
                    f"Target language for drills and answers: {route.language.value}. "
                    f"User support language for explanations and task instructions: {route.support_language}. "
                    "Keep review content and prompts anchored to the target language, but explain what to do in the support language."
                ),
            },
            *history,
            {"role": "user", "content": user_text},
        ]


class FeedbackAgent(BaseAgent):
    system_prompt = (
        "You analyze learner text. Return compact, practical language feedback in plain text only."
    )

    async def respond(
        self,
        *,
        route: RouteDecision,
        user_text: str,
        history: Sequence[MessagePayload],
    ) -> AgentReply:
        del history
        prompt = [
            {
                "role": "system",
                "content": (
                    f"{self.system_prompt} Target language: {route.language.value}. "
                    f"User support language for summary and explanations: {route.support_language}. "
                    "Return the summary and explanations in the support language. "
                    "Keep the correction text in the target language. "
                    "For category use only one of these canonical English tokens: "
                    "grammar, vocabulary, tense, preposition, agreement, word_order, style. "
                    "Format:\nSummary: <one sentence in support language>\n"
                    "Mistake 1: <category> | <correction in target language> | <short explanation in support language>\n"
                    "Mistake 2: ...\n"
                    "If there are no meaningful mistakes, write 'Mistake 1: none'."
                ),
            },
            {"role": "user", "content": user_text},
        ]
        text = await self._llm_client.complete(messages=prompt, temperature=0.0)
        return AgentReply(text=text.strip())
