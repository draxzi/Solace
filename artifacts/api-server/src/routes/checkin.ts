import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

const MOOD_PROMPTS: Record<string, string> = {
  good: "The user just said they're feeling good today. Respond warmly, celebrate this with them gently, and maybe ask what's been making their day good. Keep it light and brief.",
  meh: "The user said they're feeling 'meh' — not great, not terrible. Acknowledge this with warmth, normalize it, and gently invite them to share more if they want. Don't push.",
  notgreat: "The user said they're not feeling great today. Respond with genuine empathy, let them know it's okay to not be okay, and gently open the door for them to share more if they want.",
  rough: "The user said they're having a rough day. Respond with deep empathy and warmth. Let them feel heard and not alone. Gently invite them to share what's going on if they feel comfortable."
};

const PATTERN_ADDITION = `Also, I want you to acknowledge gently that you've noticed they've been having a tough time lately across multiple days. Bring this up softly — say something like "Hey, I've noticed you've been having a tough time lately — want to talk about what's been going on?" Work this naturally into your response.`;

router.post("/respond", async (req: Request, res: Response) => {
  const { mood, userName, recentMoods } = req.body as {
    mood: string;
    userName?: string;
    recentMoods?: string[];
  };

  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "Groq API key not configured" });
    return;
  }

  const negativeMoods = ["notgreat", "rough", "meh"];
  const negativeCount = recentMoods?.filter(m => negativeMoods.includes(m)).length ?? 0;
  const showPattern = negativeCount >= 4;

  const nameStr = userName ? ` The user's name is ${userName}.` : "";
  const systemPrompt = `You are Solace, a warm and empathetic mental health companion.${nameStr} Keep responses brief, warm, and conversational — 2-3 sentences max. No bullet points, no headers. Speak like a caring friend.`;

  let userPrompt = MOOD_PROMPTS[mood] ?? MOOD_PROMPTS["meh"];
  if (showPattern) {
    userPrompt += " " + PATTERN_ADDITION;
  }

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
          { role: "user", content: userPrompt }
        ],
        max_tokens: 150,
        temperature: 0.85
      })
    });

    if (!response.ok) {
      const err = await response.text();
      req.log.error({ err }, "Groq API error in checkin");
      res.status(500).json({ error: "AI service error" });
      return;
    }

    const data = await response.json() as {
      choices: { message: { content: string } }[]
    };
    const message = data.choices[0]?.message?.content ?? "I'm here with you.";

    res.json({ message, crisisLevel: "none" });
  } catch (err) {
    req.log.error({ err }, "Checkin route error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
