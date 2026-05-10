import type { LanguageCode, LearningMode, AgentRole, CorrectionMode } from '@/types';

export interface RoutingResult {
  mode: LearningMode;
  agentRole: AgentRole;
  correctionMode: CorrectionMode;
  scenarioHint: string | null;
}

const EN_WORDS = new Set(['the', 'is', 'are', 'was', 'were', 'hello', 'hi', 'i', 'you', 'what', 'how', 'why', 'when', 'where', 'this', 'that', 'have', 'had']);
const ES_WORDS = new Set(['hola', 'el', 'la', 'los', 'las', 'es', 'son', 'que', 'como', 'donde', 'cuando', 'tengo', 'está', 'muy', 'también']);
const SR_WORDS = new Set(['kako', 'sta', 'gde', 'zašto', 'kada', 'sam', 'je', 'su', 'koji', 'koja', 'ovo', 'nije', 'imam', 'mogu', 'šta']);

function detectLanguage(text: string): LanguageCode | null {
  const words = text.toLowerCase().split(/\s+/);
  let en = 0, es = 0, sr = 0;
  for (const w of words) {
    if (EN_WORDS.has(w)) en++;
    if (ES_WORDS.has(w)) es++;
    if (SR_WORDS.has(w)) sr++;
  }
  const max = Math.max(en, es, sr);
  if (max === 0) return null;
  if (max === en) return 'en';
  if (max === es) return 'es';
  return 'sr';
}

function detectMode(text: string): LearningMode {
  const t = text.toLowerCase();
  if (/\b(exam|test|quiz|certification|certificate)\b/.test(t)) return 'exam';
  if (/\b(grammar|gramma|gramática|граматика)\b/.test(t)) return 'grammar';
  if (/\b(word|words|vocab|vocabulary|vocabulario|reč|reči)\b/.test(t)) return 'vocabulary';
  if (/\b(write|writing|essay|compose|written)\b/.test(t)) return 'writing';
  if (/\b(review|mistake|error|correct|repeat|повтор)\b/.test(t)) return 'review';
  if (/\b(scenario|role.?play|restaurant|hotel|shop|airport|doctor|bank)\b/.test(t)) return 'scenario';
  return 'conversation';
}

const SCENARIOS = ['restaurant', 'hotel', 'airport', 'shop', 'doctor', 'pharmacy', 'bank', 'post office', 'gym', 'supermarket'];

function extractScenario(text: string): string | null {
  const t = text.toLowerCase();
  return SCENARIOS.find((s) => t.includes(s)) ?? null;
}

function modeToRole(mode: LearningMode): AgentRole {
  switch (mode) {
    case 'grammar':
    case 'vocabulary': return 'teacher_agent';
    case 'exam': return 'examiner_agent';
    case 'review': return 'review_agent';
    default: return 'conversation_agent';
  }
}

export function route(
  text: string,
  profile?: { feedbackStyle: string },
): RoutingResult {
  const mode = detectMode(text);
  const agentRole = modeToRole(mode);
  const correctionMode = (profile?.feedbackStyle ?? 'delayed') as CorrectionMode;
  const scenarioHint = mode === 'scenario' ? extractScenario(text) : null;
  return { mode, agentRole, correctionMode, scenarioHint };
}

export { detectLanguage };
