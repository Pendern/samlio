import type { AiProvider } from "./provider";
import { MockAiProvider } from "./mock-provider";
import { OpenAiProvider } from "./openai-provider";

/**
 * Get the active AI provider.
 * Priority: OpenAI (if OPENAI_API_KEY set) > Mock (free fallback).
 */
export function getAiProvider(): AiProvider {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return new OpenAiProvider(openaiKey);
  }
  return new MockAiProvider();
}

export type { AiProvider, AiSuggestionInput, AiSuggestionOutput, AiChatMessage } from "./provider";
