import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

interface ChatMessagesProps {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  messages: any[];
  user: { id: string; username: string };
  otherUser?: { username: string };
  getAvatarFallback: (username: string) => string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  user,
  otherUser,
  getAvatarFallback,
  messagesEndRef,
}) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }

      // Get today's date without time
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get yesterday's date
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Get the message date without time
      const messageDate = new Date(date);
      messageDate.setHours(0, 0, 0, 0);

      // Check if the date is today or yesterday
      if (messageDate.getTime() === today.getTime()) {
        return "Today";
      } else if (messageDate.getTime() === yesterday.getTime()) {
        return "Yesterday";
      } else {
        // For other dates, use the Indian format
        return new Intl.DateTimeFormat("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(date);
      }
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid date";
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }

      return new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch (error) {
      console.error("Time formatting error:", error);
      return "";
    }
  };

  const groupMessagesByDate = () => {
    const groups: { [key: string]: typeof messages } = {};
    messages.forEach((message) => {
      try {
        const date = new Date(message.createdAt);
        // Validate date
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date");
        }
        // Use ISO string and split to get just the date part
        const dateKey = date.toISOString().split("T")[0];
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(message);
      } catch (error) {
        console.error("Error grouping message:", error);
      }
    });
    return groups;
  };

  const groupedMessages = groupMessagesByDate();

  return (
    <ScrollArea className="flex-1 p-4 overflow-y-auto">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date} className="mb-6">
          <div className="flex justify-center mb-4">
            <span className="bg-zinc-700 text-zinc-300 px-3 py-1 rounded-full text-sm">
              {formatDate(date)}
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
                        isOwnMessage ? user.username : otherUser?.username || ""
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
                    <p className="text-sm break-words">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwnMessage ? "text-green-200" : "text-zinc-400"
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </ScrollArea>
  );
};
