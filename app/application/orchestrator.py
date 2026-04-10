from app.domain.enums import AgentRole, CorrectionMode, LanguageCode, LearningMode
from app.domain.schemas import RouteDecision


class LearningOrchestrator:
    async def route(
        self,
        *,
        user_text: str,
        preferred_correction_mode: CorrectionMode | None = None,
    ) -> RouteDecision:
        text = user_text.lower()
        language = self._detect_language(text)
        mode = self._detect_mode(text)
        agent = self._select_agent(mode)
        correction_mode = preferred_correction_mode or self._detect_correction_mode(text)
        scenario_hint = self._extract_scenario_hint(text, mode)
        return RouteDecision(
            language=language,
            mode=mode,
            agent=agent,
            correction_mode=correction_mode,
            save_memory=True,
            scenario_hint=scenario_hint,
        )

    def _detect_language(self, text: str) -> LanguageCode:
        if "spanish" in text or "espanol" in text:
            return LanguageCode.SPANISH
        if any(keyword in text for keyword in ("serbian", "srpski", "srpskom", "srpski jezik")):
            return LanguageCode.SERBIAN
        return LanguageCode.ENGLISH

    def _detect_mode(self, text: str) -> LearningMode:
        if any(keyword in text for keyword in ("essay", "rewrite", "letter", "check my writing")):
            return LearningMode.WRITING
        if any(keyword in text for keyword in ("grammar", "difference between", "explain")):
            return LearningMode.GRAMMAR
        if any(keyword in text for keyword in ("phrasal verbs", "vocabulary", "words")):
            return LearningMode.VOCABULARY
        if any(keyword in text for keyword in ("interview", "exam", "ielts", "stress interview")):
            return LearningMode.EXAM
        if any(keyword in text for keyword in ("review", "repeat", "mistakes", "revise")):
            return LearningMode.REVIEW
        if any(
            keyword in text
            for keyword in (
                "airport",
                "restaurant",
                "doctor",
                "roleplay",
                "landlord",
            )
        ):
            return LearningMode.SCENARIO
        return LearningMode.CONVERSATION

    def _select_agent(self, mode: LearningMode) -> AgentRole:
        if mode in {LearningMode.GRAMMAR, LearningMode.WRITING, LearningMode.VOCABULARY}:
            return AgentRole.TEACHER
        if mode is LearningMode.EXAM:
            return AgentRole.EXAMINER
        if mode is LearningMode.REVIEW:
            return AgentRole.REVIEW
        return AgentRole.CONVERSATION

    def _detect_correction_mode(self, text: str) -> CorrectionMode:
        if "only after 3 errors" in text or "do not interrupt" in text:
            return CorrectionMode.DELAYED
        if "correct me immediately" in text or "correct every mistake" in text:
            return CorrectionMode.INLINE
        if "only if critical" in text or "only critical mistakes" in text:
            return CorrectionMode.CRITICAL_ONLY
        return CorrectionMode.DELAYED

    def _extract_scenario_hint(self, text: str, mode: LearningMode) -> str | None:
        if mode is LearningMode.SCENARIO:
            return text
        if mode is LearningMode.EXAM and "frontend" in text:
            return "frontend developer interview"
        return None
