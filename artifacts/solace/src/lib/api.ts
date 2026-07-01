const BASE = "/api";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  message: string;
  crisisLevel: "none" | "mild" | "moderate" | "high";
}

export async function sendChatMessage(params: {
  messages: ChatMessage[];
  userName?: string;
  tone?: string;
  systemContext?: string;
}): Promise<ChatResponse> {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error(`Failed to get response: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function respondToCheckin(params: {
  mood: string;
  userName?: string;
  recentMoods?: string[];
}): Promise<ChatResponse> {
  const res = await fetch(`${BASE}/checkin/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error(`Failed to get response: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
