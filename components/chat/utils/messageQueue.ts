import { useState, useRef, useCallback } from 'react';

export const useMessageQueue = (setMessages: React.Dispatch<React.SetStateAction<any[]>>, assistantMessageId: string, delay = 50) => {
  const queue = useRef<string[]>([]);
  const [processing, setProcessing] = useState(false);

  const processQueue = useCallback(() => {
    if (queue.current.length === 0) {
      setProcessing(false);
      return;
    }
    
    const next = queue.current.shift();
    if (next) {
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: next }
          : msg
      ));
    }
    
    setTimeout(processQueue, delay);
  }, [setMessages, assistantMessageId, delay]);

  const addToQueue = (message: string) => {
    queue.current.push(message);
    if (!processing) {
      setProcessing(true);
      processQueue();
    }
  };

  return addToQueue;
};