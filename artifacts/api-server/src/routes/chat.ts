import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

const CRISIS_KEYWORDS = {
  high: [
    "suicide", "kill myself", "end my life", "don't want to be here",
    "want to die", "end it all", "take my life"
  ],
  moderate: [
    "hopeless", "can't do this anymore", "disappear", "nobody would care",
    "what's the point", "I give up", "no reason to live", "tired of everything"
  ],
  mild: [
    "struggling", "breaking down", "falling apart", "can't cope",
    "overwhelmed", "not okay", "depressed", "anxious", "worthless"
  ]
};

function detectCrisisLevel(text: string): "none" | "mild" | "moderate" | "high" {
  const lower = text.toLowerCase();
  for (const kw of CRISIS_KEYWORDS.high) if (lower.includes(kw)) return "high";
  for (const kw of CRISIS_KEYWORDS.moderate) if (lower.includes(kw)) return "moderate";
  for (const kw of CRISIS_KEYWORDS.mild) if (lower.includes(kw)) return "mild";
  return "none";
}

function buildSystemPrompt(tone?: string | null, userName?: string | null, systemContext?: string | null): string {
  const nameStr = userName ? ` The user's name is ${userName}.` : "";
  const toneStr = tone === "direct"
    ? "Be direct and practical, but still warm and caring."
    : tone === "warm"
    ? "Be extra warm, gentle, and nurturing in every response."
    : "Strike a balance between warmth and practicality.";

  const base = `You are Solace, a warm and empathetic mental health companion.${nameStr} Your job is to make users feel heard, less alone, and supported. You are NOT a replacement for professional help. Speak naturally and gently like a caring friend. If someone seems to be in crisis or mentions suicide or self-harm, immediately show empathy first, then gently provide crisis resources. Always prioritize the user's emotional safety. Never be robotic or clinical. Keep responses concise, warm, and conversational — no bullet points, no headers, just natural flowing sentences. ${toneStr} Never give medical diagnoses. Always encourage professional help when appropriate.`;

  return systemContext ? `${base}\n\n${systemContext}` : base;
}

router.post("/", async (req: Request, res: Response) => {
  const { messages, userName, tone, systemContext } = req.body as {
    messages: { role: string; content: string }[];
    userName?: string;
    tone?: string;
    systemContext?: string;
  };

  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "Groq API key not configured" });
    return;
  }

  const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
  const crisisLevel = lastUserMsg ? detectCrisisLevel(lastUserMsg.content) : "none";
  const systemPrompt = buildSystemPrompt(tone, userName, systemContext);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.filter(m => m.role !== "system"),
        ],
        max_tokens: 350,
        temperature: 0.85
      })
    });

    if (!response.ok) {
      const err = await response.text();
      req.log.error({ err }, "Groq API error");
      res.status(500).json({ error: "AI service error" });
      return;
    }

    const data = await response.json() as {
      choices: { message: { content: string } }[]
    };
    const message = data.choices[0]?.message?.content ?? "I'm here with you.";
    res.json({ message, crisisLevel });
  } catch (err) {
    req.log.error({ err }, "Chat route error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
