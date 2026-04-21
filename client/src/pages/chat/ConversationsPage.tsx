import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { chatApi } from "../../api/chat.api";
import { useAuthStore } from "../../store/authStore";
import { useNotificationsStore } from "../../store/notificationsStore";
import { socket } from "../../socket/socket";
import type { Conversation } from "../../types";

function isConversationChatAvailable(appointmentDate: string) {
  const date = new Date(appointmentDate);
  const expiryDate = new Date(date.getTime() + 3 * 24 * 60 * 60 * 1000);
  return Date.now() <= expiryDate.getTime();
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString("en-IN", { weekday: "short" });
  }
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearUnread = useNotificationsStore((s) => s.clearUnread);
  const setUnread = useNotificationsStore((s) => s.setUnread);

  const fetchConversations = async () => {
    try {
      const data = await chatApi.getConversations();
      const activeConversations = data.filter((conv) =>
        isConversationChatAvailable(conv.appointmentDate)
      );
      setConversations(activeConversations);
      const total = activeConversations.reduce((sum, c) => sum + c.unreadCount, 0);
      setUnread(total);
    } catch {
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Refresh conversations when a new message arrives
    function onNewMessage() {
      fetchConversations();
    }
    socket.on("new_message", onNewMessage);

    return () => {
      socket.off("new_message", onNewMessage);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const displayName = (conv: Conversation) => {
    const role = user?.role;
    // If I'm the patient, other user is the doctor
    if (role === "PATIENT") return `Dr. ${conv.otherUser.name}`;
    return conv.otherUser.name;
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-6 px-4">
        <h1 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          Messages
        </h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">No conversations yet.</p>
            <p className="text-sm mt-1">Book an appointment to start chatting with a doctor.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            {conversations.map((conv) => (
              <button
                key={conv.appointmentId}
                onClick={() => {
                  clearUnread();
                  navigate(`/chat/${conv.appointmentId}`);
                }}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                {/* Avatar */}
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                  {getInitials(conv.otherUser.name)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900 text-sm truncate">
                      {displayName(conv)}
                    </span>
                    {conv.lastMessageTime && (
                      <span className="text-xs text-gray-400 shrink-0">
                        {formatTime(conv.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-gray-500 truncate">
                      {conv.lastMessage
                        ? conv.lastMessage.length > 50
                          ? conv.lastMessage.slice(0, 50) + "…"
                          : conv.lastMessage
                        : "No messages yet"}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
