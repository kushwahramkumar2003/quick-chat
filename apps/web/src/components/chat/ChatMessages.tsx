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

  const groupedMessages = groupMessagesByDate();

  //   console.log("messages", messages);

  return (
    <ScrollArea className="flex-1 p-4 overflow-y-auto">
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
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
