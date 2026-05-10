import { callAgent } from '@/lib/llm';
import { buildSystemPrompt } from '@/lib/agents/specialists';
import { route } from '@/lib/orchestrator';
import { upsertSession } from './session.service';
import { saveTurn, getRecentTurns } from './turn.service';
import { analyzeText } from './feedback.service';
import { saveMistakes } from './mistake.service';
import { getOrCreateProfile } from './profile.service';
import type { LanguageCode, PracticeMessageResponse } from '@/types';

export async function handleMessage(
  userId: string,
  language: LanguageCode,
  text: string,
): Promise<PracticeMessageResponse> {
  const profile = await getOrCreateProfile(userId, language);

  const routing = route(text, { feedbackStyle: profile.feedbackStyle });

  const session = await upsertSession(userId, language, {
    mode: routing.mode,
    agentRole: routing.agentRole,
    correctionMode: routing.correctionMode,
    scenarioHint: routing.scenarioHint,
  });

  await saveTurn(session.id, 'user', text);

  const history = await getRecentTurns(session.id);
  const systemPrompt = buildSystemPrompt({
    role: routing.agentRole,
    language,
    supportLanguage: profile.nativeLanguage,
    correctionMode: routing.correctionMode,
    scenarioHint: routing.scenarioHint,
  });

  const reply = await callAgent(systemPrompt, history);

  await saveTurn(session.id, 'assistant', reply);

  const { mistakes, summary } = await analyzeText(text, language, profile.nativeLanguage);
  await saveMistakes(userId, language, mistakes);

  return { reply, feedback: summary, mistakes };
}
