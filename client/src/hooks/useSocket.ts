import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { socket } from "../socket/socket";
import { useNotificationsStore } from "../store/notificationsStore";
import { chatApi } from "../api/chat.api";

export function useSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setUnread = useNotificationsStore((s) => s.setUnread);
  const incrementUnread = useNotificationsStore((s) => s.incrementUnread);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      socket.disconnect();
      return;
    }

    // Connect with fresh userId in auth
    socket.auth = { userId: user.id };
    socket.connect();

    // Load initial unread count
    chatApi.getConversations().then((convs) => {
      const total = convs.reduce((sum, c) => sum + c.unreadCount, 0);
      setUnread(total);
    }).catch(() => {/* ignore */});

    // Listen for new messages globally to update unread count
    function onNewMessage() {
      incrementUnread();
    }
    socket.on("new_message", onNewMessage);

    return () => {
      socket.off("new_message", onNewMessage);
      socket.disconnect();
    };
  }, [isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return socket;
}
