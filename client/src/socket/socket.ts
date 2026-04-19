import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

const BASE_URL = (import.meta.env.VITE_API_URL as string || "http://localhost:5000/api").replace(/\/api$/, "");

export const socket = io(BASE_URL, {
  autoConnect: false,
  withCredentials: true,
  auth: (cb) => {
    cb({ userId: useAuthStore.getState().user?.id });
  },
});
