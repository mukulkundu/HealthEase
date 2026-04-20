import { env } from "./env.js";

const isMockMode = !env.DAILY_API_KEY || env.DAILY_API_KEY === "mock";

interface DailyRoomResponse {
  name: string;
  url: string;
}

async function dailyRequest<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(`${env.DAILY_API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.DAILY_API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Daily API ${method} ${path} failed: ${res.status} ${text}`);
  }

  return (await res.json()) as T;
}

export async function createRoom(roomName: string, expiryTimestamp: number) {
  if (isMockMode) {
    // Set DAILY_API_KEY to a real key in server/.env to switch off mock mode.
    return {
      roomName,
      roomUrl: `https://mock.daily.co/mock-room-${roomName}`,
    };
  }

  const room = await dailyRequest<DailyRoomResponse>("/rooms", "POST", {
    name: roomName,
    privacy: "private",
    properties: {
      exp: expiryTimestamp,
      enable_chat: true,
      enable_screenshare: false,
      start_video_off: false,
      start_audio_off: false,
    },
  });

  return {
    roomName: room.name,
    roomUrl: room.url,
  };
}

export async function createMeetingToken(
  roomName: string,
  userId: string,
  userName: string,
  isOwner: boolean
) {
  if (isMockMode) {
    return `mock-token-${userId}-${Date.now()}`;
  }

  const expiryTimestamp = Math.floor(Date.now() / 1000) + 60 * 90;
  const data = await dailyRequest<{ token: string }>("/meeting-tokens", "POST", {
    properties: {
      room_name: roomName,
      user_id: userId,
      user_name: userName,
      is_owner: isOwner,
      exp: expiryTimestamp,
    },
  });

  return data.token;
}

export async function deleteRoom(roomName: string) {
  if (isMockMode) {
    return;
  }
  await dailyRequest(`/rooms/${roomName}`, "DELETE");
}

