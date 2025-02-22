import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { toast } from "sonner";
import { MessageCircle, LogOut, Plus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { chats } from "@/lib/api";
import { authState } from "@/lib/atoms";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  id: string;
  content: string;
  senderId: string;
  chatId: string;
  createdAt: string;
  updatedAt: string;
}

interface Chat {
  id: string;
  user1: {
    id: string;
    email: string;
    username: string;
  };
  user2: {
    id: string;
    email: string;
    username: string;
  };
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export function Chats() {
  const navigate = useNavigate();
  const { user } = useRecoilValue(authState);
  const setAuth = useSetRecoilState(authState);
  const [chatList, setChatList] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newChatUsername, setNewChatUsername] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  async function fetchChats() {
    try {
      const response = await chats.getAll();
      setChatList(response);
    } catch (error) {
      console.log("error", error);
      toast.error("Failed to load chats");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartNewChat() {
    if (!newChatUsername.trim()) {
      toast.error("Please enter a username");
      return;
    }

    setIsCreatingChat(true);
    try {
      const chat = await chats.create(newChatUsername);
      setIsNewChatOpen(false);
      setNewChatUsername("");
      navigate(`/chat/${chat.id}`);
    } catch (error) {
      console.log("error", error);
      toast.error("Failed to start new chat");
    } finally {
      setIsCreatingChat(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth({ token: null, user: null });
    navigate("/login");
  }

  const filteredChats = chatList.filter((chat) => {
    const otherUser = chat.user1.id === user?.id ? chat.user2 : chat.user1;
    return otherUser.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  function formatDate(dateString: string): string {
    console.log("dateString", dateString);

    const date = new Date(dateString);
    const now = new Date();

    const diff = now.getTime() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return "Just now";
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500/10 p-2 rounded-full">
                <MessageCircle className="w-6 h-6 text-green-500" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                Chats
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-zinc-400 hidden sm:inline">
                {user?.username}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:ring-green-500/20 focus:border-green-500/50"
              />
            </div>
            <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-500 hover:bg-green-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800">
                <DialogHeader>
                  <DialogTitle className="text-zinc-100">
                    Start New Chat
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Enter username"
                    value={newChatUsername}
                    onChange={(e) => setNewChatUsername(e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:ring-green-500/20 focus:border-green-500/50"
                  />
                  <Button
                    onClick={handleStartNewChat}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                    disabled={isCreatingChat || !newChatUsername.trim()}
                  >
                    {isCreatingChat ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Start Chat
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="space-y-4 max-w-3xl mx-auto">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4 bg-zinc-800/50 border-zinc-700">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full bg-zinc-700" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px] bg-zinc-700" />
                    <Skeleton className="h-4 w-[300px] bg-zinc-700" />
                  </div>
                </div>
              </Card>
            ))
          ) : filteredChats.length > 0 ? (
            filteredChats.map((chat) => {
              const otherUser =
                chat.user1.id === user?.id ? chat.user2 : chat.user1;
              const lastMessage = chat.messages[chat.messages.length - 1];

              return (
                <Card
                  key={chat.id}
                  className={cn(
                    "p-4 cursor-pointer transition-all duration-200 bg-zinc-800/50 border-zinc-700",
                    "hover:bg-zinc-700/50 hover:border-zinc-600",
                    "active:scale-[0.99] active:bg-zinc-700/70"
                  )}
                  onClick={() => navigate(`/chat/${chat.id}`)}
                >
                  <div className="flex items-center  space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-green-500/10 rounded-full p-3 text-green-500">
                        {otherUser.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate text-zinc-100">
                          {otherUser.username}
                        </h3>
                        {lastMessage && (
                          <span className="text-xs text-zinc-500">
                            {formatDate(lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {lastMessage ? (
                        <p className="text-sm text-zinc-400 truncate mt-1">
                          {lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-sm text-zinc-500 italic mt-1">
                          No messages yet
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="bg-green-500/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-zinc-100">
                No chats found
              </h3>
              <p className="text-zinc-400 mb-4">
                {searchQuery
                  ? "No chats match your search"
                  : "Start a new conversation to begin chatting"}
              </p>
              <Button
                onClick={() => setIsNewChatOpen(true)}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
