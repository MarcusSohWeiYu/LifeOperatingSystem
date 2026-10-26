"use client";

import dynamic from "next/dynamic";

const ChatClient = dynamic(
  () => import("@/components/nutrition/chat/chat-client").then((m) => m.ChatClient),
  { ssr: false },
);

export default function AiChatPage() {
  return <ChatClient />;
}
