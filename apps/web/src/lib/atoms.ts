import { atom } from "recoil";

interface User {
  id: string;
  email: string;
  username: string;
}

export const authState = atom<{
  token: string | null;
  user: User | null;
}>({
  key: "authState",
  default: {
    token: localStorage.getItem("token"),
    user: JSON.parse(localStorage.getItem("user") || "null"),
  },
});
