import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Users, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import useWebSocket from "@/hook/useWebSocket";

interface ChatProps {
  chatId: string;
  user: { id: string; username: string };
  token: string;
  navigate: (path: string) => void;
}

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
  } = useWebSocket({
    chatId,
    user,
    token,
  });

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { [key: string]: typeof messages } = {};
    messages.forEach((message) => {
      const date = new Date(message.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  // Handle scroll
  const handleScroll = () => {
    if (!scrollAreaRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const isBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
    setShowScrollButton(!isBottom);
  };

  // Scroll to bottom
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

  // Auto scroll on new messages
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
      <div className="flex items-center justify-center min-h-screen bg-zinc-900 text-zinc-100">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate();

  return (
    <div className="h-screen bg-zinc-900 text-zinc-100 flex flex-col">
      <AnimatePresence>
        <motion.div
          key="chat"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex h-full"
        >
          {/* Sidebar for larger screens */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: isSidebarOpen ? 250 : 0 }}
            transition={{ duration: 0.3 }}
            className="hidden md:block bg-zinc-800 overflow-hidden border-r border-zinc-700"
          >
            <div className="p-4">
              <h2 className="font-semibold mb-4">Chat Participants</h2>
              {chatDetails && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-zinc-700 transition-colors">
                    <Avatar>
                      <AvatarFallback className="text-white bg-zinc-600">
                        {getAvatarFallback(chatDetails.user1.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium">
                        {chatDetails.user1.username}
                      </span>
                      <p className="text-xs text-zinc-400">
                        {chatDetails.user1.id === user.id ? "You" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-zinc-700 transition-colors">
                    <Avatar>
                      <AvatarFallback className="text-white bg-zinc-600">
                        {getAvatarFallback(chatDetails.user2.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium">
                        {chatDetails.user2.username}
                      </span>
                      <p className="text-xs text-zinc-400">
                        {chatDetails.user2.id === user.id ? "You" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-zinc-800 p-4 flex items-center justify-between border-b border-zinc-700">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/chats")}
                  className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600"
                >
                  <ArrowLeft size={24} />
                </Button>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-white bg-zinc-600">
                      {otherUser && getAvatarFallback(otherUser.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">{otherUser?.username}</h2>
                    <p className="text-sm text-zinc-400">
                      {connectionStatus === "Connected" ? (
                        <div>
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Online
                          </span>
                          {isTyping && (
                            <span className="flex items-center">
                              {/* <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> */}
                              Typing...
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                          Connecting...
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="hidden md:flex text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600"
                >
                  {isSidebarOpen ? <X size={24} /> : <Users size={24} />}
                </Button>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600"
                    >
                      <Users size={24} />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[280px] sm:w-[300px] bg-zinc-900 text-white border-r border-zinc-700"
                  >
                    <SheetHeader>
                      <SheetTitle className="text-white">
                        Chat Participants
                      </SheetTitle>
                    </SheetHeader>
                    {chatDetails && (
                      <div className="space-y-4 mt-6">
                        <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                          <Avatar>
                            <AvatarFallback className="text-white bg-zinc-600">
                              {getAvatarFallback(chatDetails.user1.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium">
                              {chatDetails.user1.username}
                            </span>
                            <p className="text-xs text-zinc-400">
                              {chatDetails.user1.id === user.id ? "You" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                          <Avatar>
                            <AvatarFallback className="text-white bg-zinc-600">
                              {getAvatarFallback(chatDetails.user2.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium">
                              {chatDetails.user2.username}
                            </span>
                            <p className="text-xs text-zinc-400">
                              {chatDetails.user2.id === user.id ? "You" : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 relative" ref={scrollAreaRef}>
              {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date} className="mb-6">
                  <div className="flex justify-center mb-4">
                    <span className="bg-zinc-700 text-zinc-300 px-3 py-1 rounded-full text-sm">
                      {new Date(date).toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {dateMessages.map((message) => {
                    const isOwnMessage = message.senderId === user.id;
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex mb-4 ${
                          isOwnMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex items-start gap-2 max-w-[80%] sm:max-w-[70%] ${
                            isOwnMessage ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-white bg-zinc-600">
                              {getAvatarFallback(
                                isOwnMessage
                                  ? user.username
                                  : otherUser?.username || ""
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`p-3 rounded-lg ${
                              isOwnMessage
                                ? "bg-green-600 rounded-br-none"
                                : "bg-zinc-700 rounded-bl-none"
                            }`}
                          >
                            <p className="text-sm break-words">
                              {message.content}
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwnMessage
                                  ? "text-green-200"
                                  : "text-zinc-400"
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}

              {/* {typingUsers.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-zinc-400 italic mb-2">
                  <div className="flex space-x-1">
                    <span className="animate-bounce">•</span>
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    >
                      •
                    </span>
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    >
                      •
                    </span>
                  </div>
                  <span>
                    {typingUsers.map((u) => u.username).join(", ")} typing...
                  </span>
                </div>
              )} */}

              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Scroll to bottom button */}
            <AnimatePresence>
              {showScrollButton && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-20 right-6"
                >
                  <Button
                    onClick={scrollToBottom}
                    size="icon"
                    className="rounded-full bg-green-600 hover:bg-green-500 shadow-lg"
                  >
                    <ChevronDown size={24} />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="bg-zinc-800 p-4 flex items-center space-x-2 border-t border-zinc-700">
              <Input
                type="text"
                placeholder={
                  connectionStatus === "Connected"
                    ? "Type a message"
                    : "Connecting..."
                }
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage(e)}
                className="flex-1 bg-zinc-700 border-zinc-600 text-zinc-100 focus:ring-green-500 focus:border-green-500"
                disabled={connectionStatus !== "Connected"}
              />
              <Button
                onClick={handleSendMessage}
                className={`bg-green-600 hover:bg-green-500 transition-colors ${
                  connectionStatus !== "Connected"
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={connectionStatus !== "Connected"}
              >
                <Send size={18} className="mr-1" />
                <span className="hidden sm:inline">Send</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Chat;
