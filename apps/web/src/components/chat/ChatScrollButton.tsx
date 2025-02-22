import React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface ChatScrollButtonProps {
  scrollToBottom: () => void;
}

export const ChatScrollButton: React.FC<ChatScrollButtonProps> = ({
  scrollToBottom,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed bottom-20 right-6 z-20"
    >
      <Button
        onClick={scrollToBottom}
        size="icon"
        className="rounded-full bg-green-600 hover:bg-green-500 shadow-lg"
      >
        <ChevronDown size={24} />
      </Button>
    </motion.div>
  );
};
