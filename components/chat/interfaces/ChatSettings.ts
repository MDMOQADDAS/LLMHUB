export interface ChatSettings {
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
  }
  
  export interface PromptSuggestion {
    id: string;
    prompt: string;
  }