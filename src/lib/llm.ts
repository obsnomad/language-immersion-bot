import { createMistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';

const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

export async function callAgent(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<string> {
  const model = process.env.MISTRAL_MODEL ?? 'mistral-small-latest';
  const { text } = await generateText({
    model: mistral(model),
    system: systemPrompt,
    messages,
    temperature: 0.3,
    maxTokens: 600,
  });
  return text;
}
