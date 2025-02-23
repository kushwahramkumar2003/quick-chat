import { chats } from "@/lib/api";
import { config } from "@/lib/config";
import { WebSocketManager } from "@/lib/WebSocketManager";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

export enum WebSocketMessageType {
  CHAT = "chat",
  JOIN = "join",
  TYPING = "typing",
  CONNECTION = "connection",
  ERROR = "error",
  PRESENCE = "presence",
  ONLINE = "online",
}

interface UseWebSocketReturn {
  connectionStatus: "Connected" | "Connecting" | "Disconnected" | "Error";
  isTyping: boolean;
  getAvatarFallback: (username: string) => string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSendMessage: (e: React.FormEvent) => Promise<void>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  loading: boolean;
  otherUser: { id: string; username: string } | undefined;
  messages: Message[];
  chatDetails: ChatDetails | null;
  newMessage: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  isOnline: boolean;
  lastSeen: string | null;
}

interface ChatProps {
  chatId: string;
  user: { id: string; username: string };
  token: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

interface ChatDetails {
  id: string;
  user1: { id: string; username: string };
  user2: { id: string; username: string };
}

export default function useWebSocket({
  chatId,
  user,
  token,
}: ChatProps): UseWebSocketReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatDetails, setChatDetails] = useState<ChatDetails | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [senderIsTyping, setSenderIsTyping] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "Connected" | "Connecting" | "Disconnected" | "Error"
  >("Disconnected");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [wsManager, setWsManager] = useState<WebSocketManager | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (wsManager && chatDetails) {
        wsManager.sendMessage({
          type: WebSocketMessageType.ONLINE,
          payload: {
            userId: user.id,
            user2Id:
              chatDetails.user2.id === user.id
                ? chatDetails.user1.id
                : chatDetails.user2.id,
          },
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [wsManager, chatDetails, user.id]);

  useEffect(() => {
    const wsInstance = new WebSocketManager({
      url: config.wsUrl,
      token,
      onMessage: handleWebSocketMessage,
      reconnectAttempts: 3,
      autoReconnect: true,
    });
    setWsManager(wsInstance);

    return () => {
      if (wsInstance) {
        wsInstance.disconnect();
      }
      setMessages([]);
      setChatDetails(null);
    };
  }, [chatId, token]);

  useEffect(() => {
    if (!wsManager) return;

    const status = wsManager.getConnectionStatus();
    setConnectionStatus(status);

    if (status === "Connected") {
      setLoading(false);
      if (chatId) {
        wsManager.sendMessage({
          type: WebSocketMessageType.JOIN,
          payload: { chatId },
        });
      }
    }
  }, [wsManager?.getConnectionStatus()]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (wsManager) {
        setConnectionStatus(wsManager.getConnectionStatus());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [wsManager]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatDetail = useCallback(async () => {
    if (connectionStatus === "Connected") {
      const res = await chats.getById(chatId);
      setChatDetails(res);
    }
  }, [connectionStatus, chatId]);

  useEffect(() => {
    fetchChatDetail();
  }, [connectionStatus]);

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case WebSocketMessageType.CHAT:
        setMessages((prev) => [...prev, message.payload.message]);
        break;
      case WebSocketMessageType.TYPING:
        handleTypingStatus(message.payload);
        break;
      case WebSocketMessageType.ONLINE:
        // console.log("Online status payload", message.payload);
        setIsOnline(message.payload.online);
        setLastSeen(message.payload.lastSeen || null);
        break;
      case WebSocketMessageType.ERROR:
        toast.error(message.payload.message);
        break;
    }
  };

  const handleTypingStatus = ({
    isTyping: isTyping2,
    userId,
  }: {
    chatId: string;
    isTyping: boolean;
    userId: string;
  }) => {
    if (userId === user.id) return;
    setSenderIsTyping(isTyping2);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId || !newMessage.trim() || !user || !wsManager) return;

    try {
      wsManager.sendMessage({
        type: WebSocketMessageType.CHAT,
        payload: {
          chatId,
          content: newMessage.trim(),
          senderId: user.id,
        },
      });
      wsManager.setTyping(false, chatId, user.id);
      setNewMessage("");
    } catch (error) {
      console.log("Error : ", error);
      toast.error("Failed to send message");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    wsManager?.setTyping(true, chatId, user.id);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getOtherUser = () => {
    return chatDetails?.user1.id === user.id
      ? chatDetails?.user2
      : chatDetails?.user1;
  };

  const getAvatarFallback = (username: string): string => {
    if (!username) return "?";
    return username.charAt(0).toUpperCase() || "?";
  };

  const otherUser = getOtherUser();

  return {
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
    isTyping: senderIsTyping,
    isOnline,
    lastSeen,
  };
}
