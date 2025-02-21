import { Navigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { authState } from "@/lib/atoms";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useRecoilValue(authState);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
