"use client";

import { useSearchParams } from "next/navigation";

interface ChatClientProps {
  modelName: string;
}

export function ChatClient({ modelName }: ChatClientProps) {
  const searchParams = useSearchParams();
  const version = searchParams.get("version") || "default";

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          Chat with {modelName} ({version})
        </h1>

        <p>{modelName.toLocaleLowerCase()}</p>
        {/* Chat interface implementation */}
      </div>
    </div>
  );
}