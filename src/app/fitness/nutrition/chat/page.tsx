"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/sidebar-context";
import { ChatLoadingSkeleton } from "@/components/nutrition/chat/chat-loading-skeleton";

const ChatClient = dynamic(
  () => import("@/components/nutrition/chat/chat-client").then((m) => m.ChatClient),
  { ssr: false, loading: () => <ChatLoadingSkeleton /> },
);

export default function AiChatPage() {
  const { collapsed } = useSidebar();

  return (
    <div className={cn(
      "fixed inset-0 bottom-14 md:bottom-0 bg-card z-10 transition-[left] duration-200",
      collapsed ? "md:left-14" : "md:left-56",
    )}>
      <ChatClient />
    </div>
  );
}
