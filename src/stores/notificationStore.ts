import { create } from "zustand";

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "success" | "warning" | "info" | "memory" | "vision";
}

interface Store {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clear: () => void;
}

export const useNotificationStore = create<Store>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications] })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clear: () => set({ notifications: [] }),
}));
