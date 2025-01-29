"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from "next/navigation";
import { Send, Loader2, Bot, User, Copy, Check, StopCircle, RotateCcw, Share2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useHotkeys } from 'react-hotkeys-hook';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ChatSettings {
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

// Add new interfaces
interface PromptSuggestion {
  id: string;
  prompt: string;
}

export function ChatClient({ modelName }: { modelName: string }) {
  const searchParams = useSearchParams();
  const version = searchParams.get("version") || "default";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: "You are a helpful AI assistant.",
  });
  const [showSettings, setShowSettings] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // Add new states
  const [promptSuggestions, setPromptSuggestions] = useState<PromptSuggestion[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keyboard shortcuts
  useHotkeys('ctrl+enter', (keyboardEvent) => {
    keyboardEvent.preventDefault();
    handleSubmit();
  });
  useHotkeys('esc', () => setShowSettings(false));

  // Enhanced keyboard handling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Handle file uploads for context
  const handleFileUpload = async (file: File) => {
    const text = await file.text();
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'system',
      content: `Context from file ${file.name}:\n${text}`,
      timestamp: Date.now()
    }]);
  };

  // Export chat history
  const exportChat = () => {
    const chatHistory = JSON.stringify(messages, null, 2);
    const blob = new Blob([chatHistory], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString()}.json`;
    a.click();
  };

  // Stream handling with abort capability
  const handleStream = async (response: Response) => {
    if (!response.body) throw new Error('No response body');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantMessage = '';
    const messageId = crypto.randomUUID();

    setMessages(prev => [...prev, {
      id: messageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    }]);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (!line) continue;
          try {
            const parsed = JSON.parse(line);
            assistantMessage += parsed.response;
            
            setMessages(prev => prev.map(msg => 
              msg.id === messageId 
                ? { ...msg, content: assistantMessage }
                : msg
            ));
          } catch (e) {
            console.error('Error parsing JSON:', e);
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        toast.info('Response generation stopped');
      } else {
        throw error;
      }
    }
  };

  // Add new helper function for API calls
  const makeAPICall = async (prompt: string, systemPrompt: string, streamCallback?: (content: string) => void) => {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `${modelName.toLowerCase()}:${version}`,
        prompt,
        system: systemPrompt,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        stream: true,
      }),
    });
  
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
  };

  // Modify handleSubmit to handle parallel calls
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
  
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };
  
    const assistantMessageId = crypto.randomUUID();

    // Initialize assistant message immediately
    setMessages(prev => [...prev, 
      userMessage,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      }
    ]);
    
    setInput('');
    setIsLoading(true);
    setIsSuggestionsLoading(true);
  
    try {
      // Create both API calls
      const mainCall = makeAPICall(
        input,
        settings.systemPrompt,
        (content) => {
          // Update main chat message in real-time
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content }
              : msg
          ));
        }
      );
  
      const suggestionsCall = makeAPICall(
        `Rewrite the following prompt in 10 different ways to get better results. Return only the numbered list of prompts in plain text:\n\n${input}`,
        "You are an AI prompt engineer. Your task is to improve and rewrite prompts."
      ).then(result => {
        const suggestions = result
          .split('\n')
          .filter(line => /^\d+\./.test(line))
          .map(line => ({
            id: crypto.randomUUID(),
            prompt: line.replace(/^\d+\.\s*/, '').trim()
          }));
  
        setPromptSuggestions(suggestions);
        setShowSuggestions(true);
      });
  
      // Execute both calls concurrently
      await Promise.all([mainCall, suggestionsCall]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to process request');
    } finally {
      setIsLoading(false);
      setIsSuggestionsLoading(false);
    }
  };

  // Add suggestion click handler
  const handleSuggestionClick = (suggestion: PromptSuggestion) => {
    setInput(suggestion.prompt);
    handleSubmit();
  };

  // UI Components
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold text-gray-800">LLMHUB</h1>
          <div className="mt-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm inline-block">
            {modelName} ({version})
          </div>
        </div>
        
        <div className="flex-1 p-4">
          <button
            onClick={() => setShowSettings(s => !s)}
            className="w-full p-2 mb-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
          >
            Settings
          </button>
          
          {/* Prompt Suggestions Dropdown */}
          <div className="mb-2">
            <button
              onClick={() => setShowSuggestions(s => !s)}
              className="w-full p-2 flex items-center justify-between hover:bg-gray-100 rounded-lg transition-colors"
            >
              Prompt Suggestions
              {isSuggestionsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            </button>
            
            {showSuggestions && promptSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-1 py-1 bg-white rounded-lg shadow-lg border border-gray-200"
              >
                {promptSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 truncate"
                  >
                    {suggestion.prompt}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
          
          <button
            onClick={exportChat}
            className="w-full p-2 flex items-center gap-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Chat
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto px-4">
          <div className="max-w-4xl mx-auto py-6 space-y-6">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex items-start space-x-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Message content with Markdown support */}
                  <div className={`rounded-2xl px-6 py-3 max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-50 text-gray-800'
                  }`}>
                    <ReactMarkdown
                      components={{
                        code({ inline, className, children, ...props }: { inline?: boolean, className?: string, children?: React.ReactNode }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              language={match[1]}
                              style={atomDark as any}
                              PreTag="div"
                              {...(props as any)}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message... (Enter to send, Shift + Enter for new line)"
                className="w-full pl-4 pr-20 py-3 text-base bg-white border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                style={{ minHeight: '60px' }}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-2">
                {isLoading && (
                  <button
                    type="button"
                    onClick={() => abortController?.abort()}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                  >
                    <StopCircle className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Settings Modal remains the same */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Settings content */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}