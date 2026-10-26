"use client";

import dynamic from "next/dynamic";

const ChatClient = dynamic(
  () => import("@/components/nutrition/chat/chat-client").then((m) => m.ChatClient),
  { ssr: false },
);

export default function AiChatPage() {
  // Fixed positioning to fill the viewport next to the sidebar,
  // breaking out of the parent layout's container constraints.
  return (
    <div className="fixed inset-0 md:left-56 bg-card z-10">
      <ChatClient />
    </div>
  );
}
