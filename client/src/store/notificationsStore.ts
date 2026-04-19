import { create } from "zustand";

interface NotificationsState {
  unreadMessages: number;
  incrementUnread: () => void;
  setUnread: (count: number) => void;
  clearUnread: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  unreadMessages: 0,
  incrementUnread: () => set((s) => ({ unreadMessages: s.unreadMessages + 1 })),
  setUnread: (count) => set({ unreadMessages: count }),
  clearUnread: () => set({ unreadMessages: 0 }),
}));
