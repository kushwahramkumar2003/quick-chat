import { atom } from "recoil";
import { getWithExpiry } from "./utils";

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
    token: getWithExpiry("token"),
    user: JSON.parse(getWithExpiry("user") || "null"),
  },
});
