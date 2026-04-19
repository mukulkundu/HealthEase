import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { chatApi } from "../../api/chat.api";
import { appointmentApi } from "../../api/appointment.api";
import { useAuthStore } from "../../store/authStore";
import { useNotificationsStore } from "../../store/notificationsStore";
import { socket } from "../../socket/socket";
import type { Appointment, Message } from "../../types";

const statusColors: Record<string, string> = {
  CONFIRMED: "bg-green-50 text-green-700 border-green-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  NO_SHOW: "bg-gray-50 text-gray-600 border-gray-200",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export default function ChatPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const decrementUnread = useNotificationsStore((s) => s.setUnread);

  const [messages, setMessages] = useState<Message[]>([]);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pendingOptimisticId = useRef<string | null>(null);

  const otherUser = appointment
    ? user?.role === "PATIENT"
      ? { id: appointment.doctor?.user?.id ?? "", name: appointment.doctor?.user?.name ?? "" }
      : { id: appointment.patient?.id ?? "", name: appointment.patient?.name ?? "" }
    : null;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load appointment info (reuse existing API)
  useEffect(() => {
    if (!appointmentId) return;

    const loadData = async () => {
      try {
        // Load appointment info
        const appts =
          user?.role === "PATIENT"
            ? await (await import("../../api/appointment.api")).appointmentApi.getMyAppointments()
            : await (await import("../../api/appointment.api")).appointmentApi.getDoctorAppointments();

        const appt = appts.find((a) => a.id === appointmentId) ?? null;
        setAppointment(appt);

        // Load messages
        const msgs = await chatApi.getMessages(appointmentId);
        setMessages(msgs);
      } catch {
        toast.error("Failed to load chat");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [appointmentId, user?.role]);

  // Socket listeners
  useEffect(() => {
    if (!appointmentId) return;

    socket.emit("join_appointment_room", { appointmentId });

    function onNewMessage(msg: Message) {
      setMessages((prev) => {
        // Replace optimistic message if IDs match, otherwise append
        if (pendingOptimisticId.current && msg.senderId === user?.id) {
          pendingOptimisticId.current = null;
          return [...prev.filter((m) => !m.id.startsWith("optimistic_")), msg];
        }
        return [...prev, msg];
      });
    }

    function onMessagesRead({ senderId }: { senderId: string }) {
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === senderId ? { ...m, isRead: true } : m
        )
      );
    }

    function onError(err: string) {
      toast.error(err);
    }

    socket.on("new_message", onNewMessage);
    socket.on("messages_read", onMessagesRead);
    socket.on("error", onError);

    return () => {
      socket.off("new_message", onNewMessage);
      socket.off("messages_read", onMessagesRead);
      socket.off("error", onError);
    };
  }, [appointmentId, user?.id]);

  // Mark messages as read when we open the chat
  useEffect(() => {
    if (!appointmentId || !otherUser?.id) return;
    socket.emit("mark_read", { appointmentId, senderId: otherUser.id });

    // Also update global unread count
    chatApi.getConversations().then((convs) => {
      const total = convs.reduce((sum, c) => sum + c.unreadCount, 0);
      decrementUnread(total);
    }).catch(() => {/* ignore */});
  }, [appointmentId, otherUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    if (!input.trim() || !appointmentId || !otherUser?.id || sending) return;

    const content = input.trim();
    setInput("");
    setSending(true);

    // Optimistic update
    const optimisticId = `optimistic_${Date.now()}`;
    pendingOptimisticId.current = optimisticId;
    const optimisticMsg: Message = {
      id: optimisticId,
      content,
      senderId: user!.id,
      receiverId: otherUser.id,
      appointmentId: appointmentId!,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: { id: user!.id, name: user!.name },
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    socket.emit("send_message", {
      appointmentId,
      receiverId: otherUser.id,
      content,
    });

    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formattedApptDate = appointment
    ? new Date(appointment.date).toLocaleDateString("en-IN", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shrink-0">
          <button
            onClick={() => navigate("/chat")}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          {otherUser && (
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
              {getInitials(otherUser.name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">
              {user?.role === "PATIENT" && otherUser
                ? `Dr. ${otherUser.name}`
                : otherUser?.name ?? "—"}
            </p>
            {appointment && (
              <p className="text-xs text-gray-500 truncate">{formattedApptDate}</p>
            )}
          </div>
          {appointment && (
            <Badge
              variant="outline"
              className={`text-[10px] shrink-0 ${statusColors[appointment.status] ?? ""}`}
            >
              {appointment.status}
            </Badge>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              No messages yet. Say hello!
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isOwn = msg.senderId === user?.id;
              const prev = messages[idx - 1];
              const showDateSep = !prev || !isSameDay(prev.createdAt, msg.createdAt);
              const showSenderName =
                !isOwn && (!prev || prev.senderId !== msg.senderId || showDateSep);

              return (
                <div key={msg.id}>
                  {/* Date separator */}
                  {showDateSep && (
                    <div className="flex items-center gap-2 my-3">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-[10px] text-gray-400 font-medium px-2">
                        {formatDate(msg.createdAt)}
                      </span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}

                  <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} mb-1`}>
                    {showSenderName && (
                      <span className="text-[10px] text-gray-400 ml-1 mb-0.5">
                        {msg.sender.name}
                      </span>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        isOwn
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm"
                      } ${msg.id.startsWith("optimistic_") ? "opacity-70" : ""}`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-0.5 mx-1">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 px-4 py-3 border-t bg-white flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32 min-h-[2.5rem]"
            style={{ overflowY: input.split("\n").length > 3 ? "auto" : "hidden" }}
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="h-10 w-10 p-0 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
