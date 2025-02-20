export interface BaseMessage {
  type: "join" | "leave" | "message" | "chat";
}

export interface JoinMessage extends BaseMessage {
  type: "join";
  payload: {
    roomId: string;
    username: string;
  };
}

export interface ChatMessage extends BaseMessage {
  type: "chat";
  payload: {
    content: string;
    sender: string;
  };
}

export interface LeaveMessage extends BaseMessage {
  type: "leave";
  payload: {
    roomId: string;
  };
}

export type Message = JoinMessage | ChatMessage | LeaveMessage;

export interface SocketRoomsValue {
  roomId: string;
  userName: string;
  userId: string;
}
