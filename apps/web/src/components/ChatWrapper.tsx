import { useParams, useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { authState } from "@/lib/atoms";
import { Chat } from "@/pages/chat";

export function ChatWrapper() {
  const { id: chatId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useRecoilValue(authState);

  console.log("ChatWrapper", chatId, user, token);

  if (!chatId || !user || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        No chat selected or user not authenticated
      </div>
    );
  }

  return <Chat chatId={chatId} user={user} token={token} navigate={navigate} />;
}
