import axios from "axios";
import { config } from "./config";
import { getWithExpiry } from "./utils";

const api = axios.create({
  baseURL: config.httpUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getWithExpiry("token");
  if (token) {
    config.headers.Authorization = `token ${token}`;
  }
  return config;
});

export const auth = {
  login: async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    return data;
  },
  signup: async (email: string, username: string, password: string) => {
    const { data } = await api.post("/auth/signup", {
      email,
      username,
      password,
    });
    return data;
  },
};

export const chats = {
  getAll: async () => {
    const { data } = await api.get("/chats");
    // console.log("data", data);
    return data.data.chats;
  },
  create: async (username: string) => {
    const { data } = await api.post("/chats", { secondUserName: username });
    return data.data.chat;
  },
  getById: async (id: string) => {
    const { data } = await api.get(`/chats/${id}`);
    // console.log("data", data);
    return data.data.chat;
  },
  getMessages: async (id: string) => {
    const { data } = await api.get(`/chats/${id}/messages`);
    return data.messages;
  },
  sendMessage: async (id: string, content: string) => {
    const { data } = await api.post(`/chats/${id}/messages`, { content });
    return data.message;
  },
};
