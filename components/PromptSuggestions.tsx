// components/PromptSuggestions.tsx
import React from 'react';
import { Loader2, ChevronDown } from 'lucide-react';

interface Suggestion {
  id: string;
  prompt: string;
}

interface PromptSuggestionsProps {
  isSuggestionsLoading: boolean;
  showSuggestions: boolean;
  promptSuggestions: Suggestion[];
  isLoading: boolean;
  handleSuggestionClick: (suggestion: Suggestion) => void;
}

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  isSuggestionsLoading,
  showSuggestions,
  promptSuggestions,
  isLoading,
  handleSuggestionClick,
}) => {
  return (
    <>
      <span>Prompt Suggestions</span>
      <div className="flex items-center gap-2">
        {isSuggestionsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {showSuggestions && (
          <div className="suggestions-container">
            {promptSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="suggestion-item">
                <button
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full p-2 text-left text-sm rounded-lg transition-colors hover:bg-gray-100"
                  disabled={isLoading}
                  aria-disabled={isLoading}
                >
                  {suggestion.prompt}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default PromptSuggestions;