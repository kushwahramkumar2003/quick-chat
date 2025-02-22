import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import useWebSocket from "@/hook/useWebSocket";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatScrollButton } from "@/components/chat/ChatScrollButton";
import { ChatInput } from "@/components/chat/ChatInput";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatProps {
  chatId: string;
  user: { id: string; username: string };
  token: string;
  navigate: (path: string) => void;
}

const MessageSkeleton = () => (
  <div className="flex gap-4 p-4 animate-pulse">
    <Skeleton className="h-10 w-10 rounded-full bg-zinc-800" />
    <div className="space-y-2 flex-1">
      <Skeleton className="h-4 w-1/4 bg-zinc-800" />
      <Skeleton className="h-16 w-3/4 bg-zinc-800" />
    </div>
  </div>
);

const HeaderSkeleton = () => (
  <div className="border-b border-zinc-800 p-4 animate-pulse">
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 w-10 rounded-full bg-zinc-800" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/4 bg-zinc-800" />
        <Skeleton className="h-3 w-1/6 bg-zinc-800" />
      </div>
    </div>
  </div>
);

const LoadingAnimation = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-zinc-700 border-t-green-500 animate-spin" />
      {/* <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-zinc-700 border-t-green-500 animate-spin-reverse" />
      </div> */}
    </div>
  </div>
);

export const Chat: React.FC<ChatProps> = ({
  chatId,
  user,
  token,
  navigate,
}) => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const {
    getAvatarFallback,
    handleInputChange,
    handleSendMessage,
    isSidebarOpen,
    setIsSidebarOpen,
    connectionStatus,
    loading,
    otherUser,
    messages,
    chatDetails,
    newMessage,
    messagesEndRef,
    isTyping,
    lastSeen,
    isOnline,
  } = useWebSocket({
    chatId,
    user,
    token,
  });

  const handleScroll = () => {
    if (!scrollAreaRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const isBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
    setShowScrollButton(!isBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    const isScrolledToBottom =
      scrollAreaRef.current &&
      Math.abs(
        scrollAreaRef.current.scrollHeight -
          scrollAreaRef.current.clientHeight -
          scrollAreaRef.current.scrollTop
      ) < 50;

    if (isScrolledToBottom) {
      scrollToBottom();
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-zinc-900 text-zinc-100">
        <HeaderSkeleton />
        <div className="space-y-4 py-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <MessageSkeleton key={index} />
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800">
          <Skeleton className="h-12 w-full bg-zinc-800 rounded-lg" />
        </div>
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-900 text-zinc-100 flex flex-col">
      <ChatHeader
        otherUser={otherUser}
        connectionStatus={connectionStatus}
        isTyping={isTyping}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        navigate={navigate}
        chatDetails={chatDetails}
        user={user}
        getAvatarFallback={getAvatarFallback}
        isOnline={isOnline}
        lastSeen={lastSeen}
      />

      <ChatMessages
        messages={messages}
        user={user}
        otherUser={otherUser}
        getAvatarFallback={getAvatarFallback}
        messagesEndRef={messagesEndRef}
      />

      <AnimatePresence>
        {showScrollButton && (
          <ChatScrollButton scrollToBottom={scrollToBottom} />
        )}
      </AnimatePresence>

      <ChatInput
        newMessage={newMessage}
        handleInputChange={handleInputChange}
        handleSendMessage={handleSendMessage}
        connectionStatus={connectionStatus}
      />
    </div>
  );
};

export default Chat;
