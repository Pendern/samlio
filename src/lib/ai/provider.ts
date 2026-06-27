// AI Provider interface — swap mock for Claude later by changing getProvider()

export interface AiSuggestionInput {
  type: string;
  context: Record<string, unknown>;
}

export interface AiSuggestionOutput {
  type: string;
  suggestion_text: string;
  source_refs: string[];
  context_json: Record<string, unknown>;
  model_used: string;
}

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiProvider {
  /** Generate contextual suggestions based on data analysis */
  generateSuggestions(inputs: AiSuggestionInput[]): Promise<AiSuggestionOutput[]>;

  /** Chat with AI about housing co-op data */
  chat(messages: AiChatMessage[], context: Record<string, unknown>): Promise<string>;
}
