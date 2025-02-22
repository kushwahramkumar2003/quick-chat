import React from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  newMessage: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSendMessage: (e: React.KeyboardEvent | React.MouseEvent) => void;
  connectionStatus: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  newMessage,
  handleInputChange,
  handleSendMessage,
  connectionStatus,
}) => {
  return (
    <div className="bg-zinc-800 p-4 flex items-center space-x-2 border-t border-zinc-700 sticky bottom-0 z-10">
      <Input
        type="text"
        placeholder={
          connectionStatus === "Connected" ? "Type a message" : "Connecting..."
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
  );
};
