import { ChatClient } from "@/components/ChatClient";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ model: string }>
}) {
  const modelName = (await params).model;

  return <ChatClient modelName={modelName} />;
}