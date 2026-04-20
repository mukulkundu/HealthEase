import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";

interface Props {
  otherPersonName: string;
  isDoctor: boolean;
  onEnd: () => void;
}

function fmtDuration(total: number) {
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function MockVideoCall({ otherPersonName, isDoctor, onEnd }: Props) {
  const [state, setState] = useState<"joining" | "joined">("joining");
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  useEffect(() => {
    const joinTimer = window.setTimeout(() => setState("joined"), 2000);
    return () => window.clearTimeout(joinTimer);
  }, []);

  useEffect(() => {
    if (state !== "joined") return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [state]);

  return (
    <div className="h-screen w-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-violet-800" />
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <div>
          <p className="font-semibold">HealthEase</p>
          <p className="text-xs text-white/80">{otherPersonName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">MOCK CALL</Badge>
          <Badge variant="secondary">{fmtDuration(seconds)}</Badge>
        </div>
      </div>

      {state === "joining" ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Joining call...</p>
        </div>
      ) : (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl font-bold">{otherPersonName}</p>
            <p className="text-sm text-white/80">
              {isDoctor ? "Patient connected" : "Doctor connected"}
            </p>
          </div>
        </div>
      )}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        <Button variant="secondary" onClick={() => setIsMuted((v) => !v)}>
          {isMuted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
          {isMuted ? "Unmute" : "Mute"}
        </Button>
        <Button variant="secondary" onClick={() => setIsCameraOff((v) => !v)}>
          {isCameraOff ? (
            <VideoOff className="mr-2 h-4 w-4" />
          ) : (
            <Video className="mr-2 h-4 w-4" />
          )}
          {isCameraOff ? "Start Video" : "Stop Video"}
        </Button>
        <Button variant="destructive" onClick={onEnd}>
          <PhoneOff className="mr-2 h-4 w-4" />
          End Call
        </Button>
      </div>
    </div>
  );
}

