import { callAgent } from '@/lib/llm';
import { buildSystemPrompt } from '@/lib/agents/specialists';
import type { MistakeRecord, MistakeType } from '@/types';

interface FeedbackResult {
  mistakes: MistakeRecord[];
  summary: string | null;
}

const VALID_TYPES = new Set<MistakeType>([
  'grammar',
  'vocabulary',
  'tense',
  'preposition',
  'agreement',
  'word_order',
  'style',
]);

export async function analyzeText(
  text: string,
  language: string,
  supportLanguage = 'en',
): Promise<FeedbackResult> {
  const systemPrompt = buildSystemPrompt({
    role: 'feedback_agent',
    language: language as never,
    supportLanguage,
    correctionMode: 'delayed',
  });

  const raw = await callAgent(systemPrompt, [{ role: 'user', content: text }]);

  const mistakes: MistakeRecord[] = [];
  let summary: string | null = null;

  for (const line of raw.split('\n')) {
    const mistakeLine = line.match(/^Mistake:\s*(.+)/);
    if (mistakeLine) {
      const parts = mistakeLine[1].split('|').map((s) => s.trim());
      if (parts.length >= 3) {
        const type = parts[0] as MistakeType;
        if (VALID_TYPES.has(type)) {
          mistakes.push({
            type,
            sourceText: parts[1] ?? '',
            correction: parts[2] ?? '',
            explanation: parts[3] ?? null,
            severity: 3,
          });
        }
      }
    }

    const summaryLine = line.match(/^Summary:\s*(.+)/);
    if (summaryLine) summary = summaryLine[1].trim();
  }

  return { mistakes, summary };
}
