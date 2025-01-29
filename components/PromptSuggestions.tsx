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
        <ChevronDown
          className={`w-4 h-4 transition-transform ${showSuggestions ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Add Suggestions List */}
      {showSuggestions && promptSuggestions.length > 0 && (
        <div className="mt-1 space-y-1">
          {promptSuggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => !isLoading && handleSuggestionClick(suggestion)}
              className={`w-full p-2 text-left text-sm rounded-lg transition-colors ${
                isLoading
                  ? 'opacity-50 bg-gray-100 cursor-not-allowed'
                  : 'hover:bg-gray-50 active:bg-gray-100'
              }`}
              disabled={isLoading}
              aria-disabled={isLoading}
            >
              <span className={isLoading ? 'text-gray-400' : 'text-gray-700'}>
                {suggestion.prompt}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default PromptSuggestions;