"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from "next/navigation";
import { Send, Loader2, Bot, User, Copy, Check, StopCircle, RotateCcw, Share2, Download, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useHotkeys } from 'react-hotkeys-hook';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import PromptSuggestions from './PromptSuggestions';

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

// Add new interfaces
interface APICallOptions {
  temperature?: number;
  maxTokens?: number;
  retry?: number;
}

// Add message queue utility
const useMessageQueue = (assistantMessageId: string, delay = 50) => {
  const queue = useRef<string[]>([]);
  const [processing, setProcessing] = useState(false);

  const processQueue = useCallback(() => {
    if (queue.current.length === 0) {
      setProcessing(false);
      return;
    }
    // Process next message
    const next = queue.current.shift();
    if (next) {
      postMessage((prev: any[]) => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: next }
          : msg
      ));
    }
    setTimeout(processQueue, delay);
  }, []);

  const addToQueue = (message: string) => {
    queue.current.push(message);
    if (!processing) {
      setProcessing(true);
      processQueue();
    }
  };

  return addToQueue;
};

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
  const [suggestionsAbortController, setSuggestionsAbortController] = useState<AbortController | null>(null);

  // Add new state
  const [enableSuggestions, setEnableSuggestions] = useState(true); // Default value without localStorage

  const [isCheckboxDisabled, setIsCheckboxDisabled] = useState(false);

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
  const makeAPICall = async (
    prompt: string, 
    systemPrompt: string, 
    signal?: AbortSignal, 
    streamCallback?: (content: string) => void,
    options: APICallOptions = {}
  ) => {
    const {
      temperature = settings.temperature,
      maxTokens = settings.maxTokens,
      retry = 2
    } = options;
  
    const makeRequest = async (attempt: number = 0): Promise<string> => {
      try {
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: `${modelName.toLowerCase()}:${version}`,
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

  // Message queue ref at component level
  const messageQueueRef = useRef<string[]>([]);
  const processingRef = useRef(false);

  // Process queue function
  const processQueue = useCallback((assistantMessageId: string) => {
    if (messageQueueRef.current.length === 0) {
      processingRef.current = false;
      return;
    }
    const next = messageQueueRef.current.shift();
    if (next) {
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: next }
          : msg
      ));
    }
    setTimeout(() => processQueue(assistantMessageId), 50);
  }, []);

  // Add to queue function
  const addToQueue = useCallback((message: string, assistantMessageId: string) => {
    messageQueueRef.current.push(message);
    if (!processingRef.current) {
      processingRef.current = true;
      processQueue(assistantMessageId);
    }
  }, [processQueue]);

  // Modified handleSubmit
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
  
    // Initialize messages
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
    setIsCheckboxDisabled(true);
  
    const cleanup = () => {
      setIsLoading(false);
      setIsSuggestionsLoading(false);
      setAbortController(null);
      setSuggestionsAbortController(null);
      setIsCheckboxDisabled(false);
    };
  
    try {
      const mainController = new AbortController();
      const suggestionsController = new AbortController();
      
      setAbortController(mainController);
      setSuggestionsAbortController(suggestionsController);
  
      const mainCall = makeAPICall(
        input,
        settings.systemPrompt,
        mainController.signal,
        (content) => addToQueue(content, assistantMessageId)
      );
  
      if (enableSuggestions) {
        await Promise.all([
          mainCall,
          makeAPICall(
            `Improve this prompt (5 brief alternatives):\n${input}`,
            "You are a prompt optimizer. Be concise.",
            suggestionsController.signal,
            undefined,
            { temperature: 0.3, maxTokens: 1024 }
          ).then(result => {
            const suggestions = result
              .split('\n')
              .filter(line => /^\d+\./.test(line))
              .slice(0, 5)
              .map(line => ({
                id: crypto.randomUUID(),
                prompt: line.replace(/^\d+\.\s*/, '').trim()
              }));
            setPromptSuggestions(suggestions);
            setShowSuggestions(true);
          })
        ]);
      } else {
        await mainCall;
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        toast.info('Generation stopped');
      } else {
        console.error('Error:', error);
        toast.error('Failed to process request');
      }
    } finally {
      cleanup();
    }
  };

  // Modify suggestion click handler to only update input
  const handleSuggestionClick = (suggestion: PromptSuggestion) => {
    setInput(suggestion.prompt);
    // Focus the textarea after setting input
    textareaRef.current?.focus();
  };

  // Add cleanup on component unmount
  useEffect(() => {
    return () => {
      abortController?.abort();
      suggestionsAbortController?.abort();
    };
  }, []);

  // Add useEffect to save preference
  useEffect(() => {
    localStorage.setItem('enableSuggestions', JSON.stringify(enableSuggestions));
  }, [enableSuggestions]);

  // Add this useEffect below other useEffect hooks:
  useEffect(() => {
    // Check localStorage after component mounts
    const saved = localStorage.getItem('enableSuggestions');
    if (saved !== null) {
      setEnableSuggestions(JSON.parse(saved));
    }
  }, []); // Empty dependency array means this runs once on mount

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
        
        {/* Modified Sidebar with Suggestions Display */}
        <div className="flex-1 p-4">
          <button
            onClick={() => setShowSettings(s => !s)}
            className="w-full p-2 mb-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
          >
            Settings
          </button>
          
          {/* Prompt Suggestions Dropdown */}
          <div className="mb-2">
            {enableSuggestions && (
              <>
                <div 
                  onClick={() => setShowSuggestions(s => !s)}
                  className="w-full p-2 flex items-center justify-between hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>Prompt Suggestions</span>
                    {isSuggestionsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
                </div>

                {showSuggestions && (
                  <div className="mt-2 space-y-1">
                    {promptSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full p-2 text-left text-sm rounded-lg transition-colors hover:bg-gray-100 cursor-pointer"
                      >
                        {suggestion.prompt}
                      </div>
                    ))}
                  </div>
                )}
              </>
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
        <div className="border-t bg-white px-6 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <label className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSuggestions}
                  onChange={(e) => setEnableSuggestions(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  disabled={isCheckboxDisabled}
                />
                Suggestions
              </label>
            </div>
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message... (Enter to send, Shift + Enter for new line)"
                className="w-full pl-6 pr-24 py-4 text-base bg-white border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                style={{ minHeight: '60px' }}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                {isLoading && (
                  <button
                    type="button"
                    onClick={() => {
                      abortController?.abort();
                      suggestionsAbortController?.abort();
                    }}
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