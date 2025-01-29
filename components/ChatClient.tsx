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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keyboard shortcuts
  useHotkeys('ctrl+enter', (keyboardEvent) => {
    keyboardEvent.preventDefault();
    handleSubmit();
  });
  useHotkeys('esc', () => setShowSettings(false));

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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const controller = new AbortController();
    setAbortController(controller);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `${modelName.toLowerCase()}:${version}`,
          prompt: input,
          system: settings.systemPrompt,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          stream: true,
        }),
        signal: controller.signal
      });

      await handleStream(response);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate response');
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  // UI Components
  return (
    <motion.div 
      className="flex flex-col h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Enhanced Header */}
      <header className="border-b bg-white py-4 px-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-gray-800">LLMHUB</h1>
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm">
              {modelName} ({version})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(s => !s)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Settings
            </button>
            <button
              onClick={exportChat}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
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

      {/* Enhanced Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto py-6 px-6 space-y-6">
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

      {/* Enhanced Input Container */}
      <div className="border-t bg-white px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message... (Ctrl + Enter to send)"
              className="w-full pl-6 pr-24 py-4 text-base bg-white border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              style={{ minHeight: '60px' }}
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              {isLoading && (
                <button
                  type="button"
                  onClick={() => abortController?.abort()}
                  className="p-2.5 rounded-xl text-red-600 hover:bg-red-50"
                >
                  <StopCircle className="w-5 h-5" />
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
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
    </motion.div>
  );
}