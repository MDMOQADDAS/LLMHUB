"use client";
import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from "next/navigation";
import { Send, Loader2, Bot, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatClientProps {
  modelName: string;
}

export function ChatClient({ modelName }: ChatClientProps) {
  const searchParams = useSearchParams();
  const version = searchParams.get("version") || "default";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: `${modelName.toLowerCase()}:${version}`,
          prompt: input,
          stream: true,
        }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

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
            
            setMessages(prev => [
              ...prev.slice(0, -1),
              { role: 'assistant', content: assistantMessage }
            ]);
          } catch (e) {
            console.error('Error parsing JSON:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800">
          Chat with {modelName} ({version})
        </h1>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start space-x-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-2 max-w-[85%] ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Container */}
      <div className="border-t bg-white px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              rows={1}
              className="w-full pl-4 pr-12 py-3 text-sm bg-gray-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              style={{ maxHeight: '200px' }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 bottom-2.5 p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


// "use client";
// import { useState, useRef, useEffect } from 'react';
// import { useSearchParams } from "next/navigation";

// interface Message {
//   role: 'user' | 'assistant';
//   content: string;
// }

// interface ChatClientProps {
//   modelName: string;
// }

// export function ChatClient({ modelName }: ChatClientProps) {
//   const searchParams = useSearchParams();
//   const version = searchParams.get("version") || "default";
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!input.trim()) return;

//     // Add user message
//     const userMessage: Message = { role: 'user', content: input };
//     setMessages(prev => [...prev, userMessage]);
//     setInput('');
//     setIsLoading(true);

//     try {
//       const response = await fetch('http://localhost:11434/api/generate', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           model: `${modelName.toLowerCase()}:${version}`,
//           prompt: input,
//           stream: true,
//         }),
//       });

//       if (!response.body) throw new Error('No response body');

//       const reader = response.body.getReader();
//       const decoder = new TextDecoder();
//       let assistantMessage = '';

//       // Add initial assistant message
//       setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;

//         const chunk = decoder.decode(value);
//         const lines = chunk.split('\n');
        
//         for (const line of lines) {
//           if (!line) continue;
//           try {
//             const parsed = JSON.parse(line);
//             assistantMessage += parsed.response;
            
//             // Update the last message (assistant's message)
//             setMessages(prev => [
//               ...prev.slice(0, -1),
//               { role: 'assistant', content: assistantMessage }
//             ]);
//           } catch (e) {
//             console.error('Error parsing JSON:', e);
//           }
//         }
//       }
//     } catch (error) {
//       console.error('Error:', error);
//       setMessages(prev => [...prev, { 
//         role: 'assistant', 
//         content: 'Sorry, there was an error processing your request.' 
//       }]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
//       <div className="max-w-4xl mx-auto">
//         <h1 className="text-3xl font-bold mb-6">
//           Chat with {modelName} ({version})
//         </h1>
        
//         {/* Messages Container */}
//         <div className="bg-white rounded-lg shadow-md p-6 mb-6 h-[600px] overflow-y-auto">
//           {messages.map((message, index) => (
//             <div
//               key={index}
//               className={`mb-4 ${
//                 message.role === 'user' ? 'text-right' : 'text-left'
//               }`}
//             >
//               <div
//                 className={`inline-block p-4 rounded-lg ${
//                   message.role === 'user'
//                     ? 'bg-blue-500 text-white'
//                     : 'bg-gray-100 text-gray-800'
//                 }`}
//               >
//                 <p className="whitespace-pre-wrap">{message.content}</p>
//               </div>
//             </div>
//           ))}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* Input Form */}
//         <form onSubmit={handleSubmit} className="flex gap-4">
//           <input
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             placeholder="Type your message..."
//             className="flex-1 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             disabled={isLoading}
//           />
//           <button
//             type="submit"
//             disabled={isLoading}
//             className="px-6 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
//           >
//             {isLoading ? 'Sending...' : 'Send'}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }
