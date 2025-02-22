import React from "react";
import { ArrowLeft, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { ChatSidebar } from "./ChatSidebar";
import { config } from "@/lib/config";

interface ChatHeaderProps {
  otherUser?: { username: string };
  connectionStatus: string;
  isTyping: boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  navigate: (path: string) => void;

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  chatDetails: any;
  user: { id: string; username: string };
  getAvatarFallback: (username: string) => string;
  isOnline: boolean;
  lastSeen: string | null;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  otherUser,
  connectionStatus,
  isTyping,
  isSidebarOpen,
  setIsSidebarOpen,
  navigate,
  chatDetails,
  user,
  getAvatarFallback,
  isOnline,
  lastSeen,
}) => {
  //   console.log("chat details", chatDetails);
  return (
    <div className="bg-zinc-800 p-4 flex items-center justify-between border-b border-zinc-700 sticky top-0 z-10">
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
                  {isOnline ? (
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>

                      {isTyping ? "Typing..." : "Online"}
                    </span>
                  ) : isOnline === false && !lastSeen ? (
                    "Wait for last seen"
                  ) : config.isAdminRole === "true" &&
                    config.admin === otherUser?.username ? (
                    ""
                  ) : (
                    <span className="flex items-center text-sm sm:text-base text-gray-500">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Last seen{" "}
                      {lastSeen
                        ? new Date(lastSeen).toLocaleString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                            day: "numeric",
                            month: "short",
                          })
                        : "unknown"}
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
          <ChatSidebar
            chatDetails={chatDetails}
            user={user}
            getAvatarFallback={getAvatarFallback}
          />
        </Sheet>
      </div>
    </div>
  );
};
