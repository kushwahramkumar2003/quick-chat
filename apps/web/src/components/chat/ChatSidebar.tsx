import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface ChatSidebarProps {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  chatDetails: any;
  user: { id: string; username: string };
  getAvatarFallback: (username: string) => string;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chatDetails,
  user,
  getAvatarFallback,
}) => {
  return (
    <SheetContent
      side="left"
      className="w-[280px] sm:w-[300px] bg-zinc-900 text-white border-r border-zinc-700"
    >
      <SheetHeader>
        <SheetTitle className="text-white">Chat Participants</SheetTitle>
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
              <span className="font-medium">{chatDetails.user1.username}</span>
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
              <span className="font-medium">{chatDetails.user2.username}</span>
              <p className="text-xs text-zinc-400">
                {chatDetails.user2.id === user.id ? "You" : ""}
              </p>
            </div>
          </div>
        </div>
      )}
    </SheetContent>
  );
};
