import { APICallOptions } from '../interfaces/ApiTypes';

export const makeAPICall = async (
  prompt: string,
  systemPrompt: string,
  signal?: AbortSignal,
  streamCallback?: (content: string) => void,
  options: APICallOptions = {}
) => {
  const {
    temperature = 0.7,
    maxTokens = 2048,
    retry = 2
  } = options;

  const makeRequest = async (attempt: number = 0): Promise<string> => {
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'model:version',
          prompt,
          system: systemPrompt,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }),
        signal,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      let result = '';
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line) continue;
          try {
            const parsed = JSON.parse(line);
            result += parsed.response;
            streamCallback?.(result);
          } catch (e) {
            console.error('Error parsing JSON:', e);
          }
        }
      }

      return result;
    } catch (error) {
      if (attempt < retry && (error as Error).name !== 'AbortError') {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        return makeRequest(attempt + 1);
      }
      throw error;
    }
  };

  return makeRequest();
};