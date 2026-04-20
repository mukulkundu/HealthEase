import { useEffect, useMemo, useRef, useState } from "react";
import DailyIframe from "@daily-co/daily-js";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { videoApi } from "../../api/video.api";
import { chatApi } from "../../api/chat.api";
import { socket } from "../../socket/socket";
import { useAuthStore } from "../../store/authStore";
import MockVideoCall from "./MockVideoCall";
import type { Message } from "../../types";

type CallState = "idle" | "joining" | "joined" | "error" | "ended";
type VideoType = "independent" | "hospital";

interface Props {
  appointmentId: string;
  type: VideoType;
  onCallEnd: () => void;
  otherPersonName: string;
  otherPersonId: string;
  isDoctor: boolean;
}

function fmtDuration(total: number) {
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function VideoCallRoom({
  appointmentId,
  type,
  onCallEnd,
  otherPersonName,
  otherPersonId,
  isDoctor,
}: Props) {
  const user = useAuthStore((s) => s.user);
  const mockMode = import.meta.env.VITE_DAILY_MOCK_MODE === "true";
  const callRef = useRef<ReturnType<typeof DailyIframe.createCallObject> | null>(null);
  const [callState, setCallState] = useState<CallState>(mockMode ? "joined" : "joining");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const receiverId = otherPersonId;
  const canShowMock = useMemo(() => mockMode, [mockMode]);

  useEffect(() => {
    if (canShowMock) return;

    let mounted = true;

    const joinCall = async () => {
      try {
        const tokenData = await videoApi.getToken(appointmentId, type);
        if (!mounted) return;

        const callObject = DailyIframe.createCallObject();
        callRef.current = callObject;
        socket.emit("call_started", {
          appointmentId,
          callerName: user?.name ?? "User",
          callerRole: user?.role ?? "UNKNOWN",
          type,
        });

        callObject.on("joined-meeting", () => setCallState("joined"));
        callObject.on("error", (e: { errorMsg?: string }) => {
          setErrorMessage(e.errorMsg ?? "Failed to join call");
          setCallState("error");
        });
        callObject.on("left-meeting", () => {
          setCallState("ended");
          onCallEnd();
        });

        await callObject.join({
          url: tokenData.roomUrl,
          token: tokenData.token,
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unable to start video call";
        setErrorMessage(message);
        setCallState("error");
      }
    };

    joinCall();
    return () => {
      mounted = false;
      if (callRef.current) {
        callRef.current.leave().catch(() => undefined);
        callRef.current.destroy().catch(() => undefined);
      }
    };
  }, [appointmentId, type, onCallEnd, user?.name, user?.role, canShowMock]);

  useEffect(() => {
    if (callState !== "joined") return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [callState]);

  useEffect(() => {
    if (type === "hospital") return;
    chatApi
      .getMessages(appointmentId)
      .then((res) => setMessages(res))
      .catch(() => undefined);

    socket.emit("join_appointment_room", { appointmentId, type });
    const onMsg = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      if (!chatOpen) setUnreadCount((n) => n + 1);
    };
    socket.on("new_message", onMsg);
    return () => socket.off("new_message", onMsg);
  }, [appointmentId, chatOpen, type]);

  const handleToggleMute = async () => {
    if (!canShowMock && callRef.current) {
      await callRef.current.setLocalAudio(isMuted);
    }
    setIsMuted((v) => !v);
  };

  const handleToggleCamera = async () => {
    if (!canShowMock && callRef.current) {
      await callRef.current.setLocalVideo(isCameraOff);
    }
    setIsCameraOff((v) => !v);
  };

  const endCall = async () => {
    try {
      await videoApi.endCall(appointmentId, type);
      socket.emit("call_ended", { appointmentId });
      if (!canShowMock && callRef.current) {
        await callRef.current.leave();
      }
      setCallState("ended");
      onCallEnd();
    } catch {
      toast.error("Failed to end call");
    }
  };

  if (canShowMock) {
    return <MockVideoCall otherPersonName={otherPersonName} isDoctor={isDoctor} onEnd={endCall} />;
  }

  if (callState === "joining") {
    return (
      <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Joining call...</p>
        <Button variant="outline" onClick={onCallEnd}>
          Cancel
        </Button>
      </div>
    );
  }

  if (callState === "error") {
    return (
      <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center gap-3">
        <p>{errorMessage}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black text-white relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <div>
          <p className="font-semibold">HealthEase</p>
          <p className="text-xs text-white/80">{otherPersonName}</p>
        </div>
        <Badge variant="secondary">{fmtDuration(seconds)}</Badge>
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <p className="text-white/85">Waiting for {otherPersonName} to join...</p>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        <Button variant="secondary" onClick={handleToggleMute}>
          {isMuted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
          {isMuted ? "Unmute" : "Mute"}
        </Button>
        <Button variant="secondary" onClick={handleToggleCamera}>
          {isCameraOff ? <VideoOff className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}
          {isCameraOff ? "Start Video" : "Stop Video"}
        </Button>
        {type === "independent" && (
          <Button variant="secondary" onClick={() => setChatOpen(true)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat
            {unreadCount > 0 && <Badge className="ml-2">{unreadCount}</Badge>}
          </Button>
        )}
        <Button variant="destructive" onClick={endCall}>
          <PhoneOff className="mr-2 h-4 w-4" />
          End Call
        </Button>
      </div>

      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="w-full sm:max-w-md bg-white text-black">
          <DialogHeader>
            <DialogTitle>In-call chat</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex h-[75vh] flex-col">
            <div className="flex-1 overflow-y-auto space-y-2 border rounded p-2">
              {messages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <span className="font-medium">{msg.sender.name}: </span>
                  <span>{msg.content}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type message..."
              />
              <Button
                onClick={() => {
                  if (!chatInput.trim()) return;
                  socket.emit("send_message", {
                    appointmentId,
                    receiverId,
                    content: chatInput.trim(),
                    type,
                  });
                  setChatInput("");
                }}
              >
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

