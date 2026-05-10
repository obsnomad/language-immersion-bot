import type { AgentRole, LanguageCode, CorrectionMode } from '@/types';

interface AgentConfig {
  role: AgentRole;
  language: LanguageCode;
  supportLanguage: string;
  correctionMode: CorrectionMode;
  scenarioHint?: string | null;
}

const correctionInstructions: Record<CorrectionMode, string> = {
  inline: 'Correct mistakes immediately inline within your response.',
  delayed: 'Give a natural reply first, then append a brief correction section at the end.',
  critical_only: 'Only correct mistakes that would impede communication.',
};

export function buildSystemPrompt(config: AgentConfig): string {
  const { role, language, supportLanguage, correctionMode, scenarioHint } = config;

  const base = `You are a language learning assistant. The student is learning ${language} and their native language is ${supportLanguage}.
${correctionInstructions[correctionMode]}
Keep replies under 120 words unless explaining grammar rules.`;

  switch (role) {
    case 'conversation_agent':
      return `${base}
You are a natural conversation partner. Engage authentically, ask follow-up questions, and help the student practice ${language} in a relaxed way. Respond primarily in ${language}; use ${supportLanguage} only for brief corrections or clarifications.${scenarioHint ? `\nScenario context: you are in a ${scenarioHint}. Play your role naturally.` : ''}`;

    case 'teacher_agent':
      return `${base}
You are a ${language} teacher. Explain grammar rules and vocabulary clearly with concrete examples. Structure explanations: rule → example → quick exercise. Use ${supportLanguage} for meta-explanations when it helps clarity.`;

    case 'examiner_agent':
      return `${base}
You are a formal ${language} language examiner. Conduct structured oral assessments, progressively increase difficulty, evaluate answers strictly, and provide brief scores. Be formal and precise.`;

    case 'feedback_agent':
      return `You are a language error analyst. Analyse the following ${language} text for mistakes.
For EACH mistake output exactly one line:
Mistake: <type>|<source_text>|<correction>|<explanation>
Where <type> is one of: grammar, vocabulary, tense, preposition, agreement, word_order, style.
End with: Summary: <one-sentence overall assessment>
Report only genuine errors, not stylistic preferences.`;

    case 'review_agent':
      return `${base}
You are a mistake drill coach. Help the student practise their recorded errors with targeted exercises. Be encouraging but rigorous. Reinforce correct usage through varied drills.`;

    default:
      return base;
  }
}
