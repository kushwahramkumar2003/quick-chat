import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ProtectedRoute } from "@/components/protected-route";
import { Login } from "@/pages/login";
import { SignUp } from "@/pages/signup";
import { Chats } from "./pages/chats";
import { ChatWrapper } from "./components/ChatWrapper";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/chats"
          element={
            <ProtectedRoute>
              <Chats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:id"
          element={
            <ProtectedRoute>
              <ChatWrapper />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/chats" replace />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
