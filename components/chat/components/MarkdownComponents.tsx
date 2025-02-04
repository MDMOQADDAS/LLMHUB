import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const MarkdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter
        style={oneLight}
        language={match[1]}
        PreTag="div"
        {...props}
        className="rounded-lg text-sm"
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code 
        className={`bg-gray-100 rounded px-1 py-0.5 text-sm font-mono ${className}`} 
        {...props}
      >
        {children}
      </code>
    );
  },
  h1: ({ children }: any) => <h1 className="text-2xl font-bold mb-2">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-xl font-semibold mb-2">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-lg font-medium mb-1">{children}</h3>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">
      {children}
    </blockquote>
  ),
};