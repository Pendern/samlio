import type { AiProvider } from "./provider";
import { MockAiProvider } from "./mock-provider";

/**
 * Get the active AI provider.
 * Currently returns MockAiProvider (free, no API calls).
 * To switch to Claude: create a ClaudeProvider and return it here
 * when ANTHROPIC_API_KEY is set in env.
 */
export function getAiProvider(): AiProvider {
  // Future: check for real API key
  // if (process.env.ANTHROPIC_API_KEY) {
  //   return new ClaudeProvider(process.env.ANTHROPIC_API_KEY);
  // }
  return new MockAiProvider();
}

export type { AiProvider, AiSuggestionInput, AiSuggestionOutput, AiChatMessage } from "./provider";
