import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { toast } from "sonner";
import { MessageCircle, LogOut, Plus, Search } from "lucide-react";
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

interface ChatsResponse {
  chats: Chat[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalChats: number;
  };
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

  useEffect(() => {
    fetchChats();
  }, []);

  async function fetchChats() {
    try {
      const response = await chats.getAll();
      setChatList(response);
    } catch (error) {
      toast.error("Failed to load chats");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartNewChat() {
    try {
      const chat = await chats.create(newChatUsername);
      setIsNewChatOpen(false);
      setNewChatUsername("");
      navigate(`/chat/${chat.id}`);
    } catch (error) {
      toast.error("Failed to start new chat");
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="bg-primary p-2 rounded-full">
                <MessageCircle className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">Chats</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {user?.username}
              </span>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Chat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Enter username"
                    value={newChatUsername}
                    onChange={(e) => setNewChatUsername(e.target.value)}
                  />
                  <Button onClick={handleStartNewChat} className="w-full">
                    Start Chat
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[300px]" />
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
                  className="p-4 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => navigate(`/chat/${chat.id}`)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 rounded-full p-3 text-primary">
                      <span className="text-lg font-semibold">
                        {otherUser.username[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">
                          {otherUser.username}
                        </h3>
                        {lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              lastMessage.createdAt
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {lastMessage ? (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic mt-1">
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
              <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">No chats found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No chats match your search"
                  : "Start a new conversation to begin chatting"}
              </p>
              <Button onClick={() => setIsNewChatOpen(true)}>
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
