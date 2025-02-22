export enum WebSocketMessageType {
  CHAT = "chat",
  JOIN = "join",
  TYPING = "typing",
  CONNECTION = "connection",
  ERROR = "error",
  PRESENCE = "presence",
  ONLINE = "online",
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  payload: T;
}

interface WebSocketManagerConfig {
  url: string;
  token: string;
  onMessage: (message: WebSocketMessage) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  autoReconnect?: boolean;
}

export class WebSocketManager {
  private socket: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private typingTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private isConnected = false;
  private isTyping = false;

  private readonly config: Required<WebSocketManagerConfig>;

  constructor(config: WebSocketManagerConfig) {
    this.config = {
      reconnectAttempts: 5,
      reconnectInterval: 3000,
      autoReconnect: true,
      ...config,
    };
    this.connect();
  }

  public connect(): void {
    if (this.socket || this.isConnected) {
      return;
    }

    this.cleanup();

    try {
      const wsUrl = `${this.config.url}?token=${this.config.token}`;
      const ws = new WebSocket(wsUrl);
      this.socket = ws;

      ws.onopen = this.handleOpen.bind(this);
      ws.onmessage = this.handleMessage.bind(this);
      ws.onclose = this.handleClose.bind(this);
      ws.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      this.isConnected = false;
      throw new Error("Failed to create WebSocket connection");
    }
  }

  public disconnect(): void {
    this.cleanup();
  }

  public sendMessage(message: WebSocketMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("Cannot send message: WebSocket is not connected");
    }

    try {
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error("Error sending message:", error);
      throw new Error("Failed to send message");
    }
  }

  public setTyping(typing: boolean, chatId: string, userId: string): void {
    this.isTyping = typing;

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.sendMessage({
        type: WebSocketMessageType.TYPING,
        payload: { isTyping: true, chatId, userId },
      });

      this.typingTimeout = setTimeout(() => {
        this.isTyping = false;
        if (this.socket?.readyState === WebSocket.OPEN) {
          this.sendMessage({
            type: WebSocketMessageType.TYPING,
            payload: { isTyping: false, chatId, userId },
          });
        }
      }, 2000);
    }
  }

  public getConnectionStatus():
    | "Connected"
    | "Connecting"
    | "Disconnected"
    | "Error" {
    if (!this.socket) return "Disconnected";
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return "Connecting";
      case WebSocket.OPEN:
        return "Connected";
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return "Disconnected";
      default:
        return "Error";
    }
  }

  public getIsTyping(): boolean {
    return this.isTyping;
  }

  private handleOpen(): void {
    this.reconnectAttempts = 0;
    this.isConnected = true;
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      this.config.onMessage(message);
    } catch (error) {
      console.error("Error processing message:", error);
      throw new Error("Error processing message");
    }
  }

  private handleClose(): void {
    this.socket = null;
    this.isConnected = false;

    if (
      this.config.autoReconnect &&
      this.reconnectAttempts < this.config.reconnectAttempts
    ) {
      this.reconnectAttempts += 1;
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, this.config.reconnectInterval);
    }
  }

  private handleError(error: Event): void {
    console.error("WebSocket error:", error);
    this.isConnected = false;
    throw new Error("WebSocket connection error");
  }

  private cleanup(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }
}
