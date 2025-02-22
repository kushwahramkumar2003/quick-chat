export const config = {
  wsUrl: import.meta.env.VITE_WS_URL || "ws://localhost:8081",
  httpUrl: import.meta.env.VITE_HTTP_URL || "http://localhost:8080",
  admin: import.meta.env.VITE_ADMIN || "",
  isAdminRole: import.meta.env.VITE_IS_ADMIN_ROLE || "",
};
