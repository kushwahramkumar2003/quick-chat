export const config = {
  wsUrl: import.meta.env.VITE_WS_URL,
  httpUrl: import.meta.env.VITE_HTTP_URL,
  admin: import.meta.env.VITE_ADMIN || "",
  isAdminRole: import.meta.env.VITE_IS_ADMIN_ROLE || "",
};
