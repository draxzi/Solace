import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendChatMessage } from "@/lib/api";
import { getPrefs } from "@/lib/storage";
import { Send, Heart } from "lucide-react";

const GRIEF_SYSTEM = `You are Solace in a grief and loss space. The user is here because they are grieving — 
a person, a relationship, a pet, a version of themselves, a dream.
Your role is pure presence. No advice unless explicitly asked. No coping tips unless asked.
No silver linings. No "at least" statements. No fixing.
Just deep, warm acknowledgment. Let them feel fully heard.
Reflect back what they share. Ask gentle open questions if they seem to want to keep talking.
Speak slowly and softly. Never rush them. Never minimize.
Keep responses shorter than you normally would — grief doesn't need a lot of words, just the right ones.`;

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const OPENING = "This space is just for grief. There's no right way to feel here. Would you like to tell me about them?";

export default function GriefSpace() {
  const prefs = getPrefs();
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: OPENING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const history = next.map(m => ({ role: m.role as "user" | "assistant", content: m.content }));
      const data = await sendChatMessage({
        messages: history,
        userName: prefs?.name,
        systemContext: GRIEF_SYSTEM,
      });
      setMessages([...next, { role: "assistant", content: data.message }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "I'm still here. Take all the time you need." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Muted header */}
      <div className="flex items-center gap-2 mb-1">
        <Heart size={16} color="#DFB6B2" strokeWidth={1.5} />
        <p className="text-xs leading-relaxed" style={{ color: "#DFB6B2" }}>
          No advice. No fixes. Just presence.
        </p>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-3 max-h-72 overflow-y-auto solace-scroll pr-1">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div
              className="max-w-[88%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
              style={m.role === "user" ? {
                background: "#824D69",
                color: "#FAE5D8",
                borderBottomRightRadius: 6,
              } : {
                background: "rgba(24,0,24,0.6)",
                color: "#DFB6B2",
                border: "1px solid rgba(223,182,178,0.15)",
                borderBottomLeftRadius: 6,
              }}
            >
              {m.content}
            </div>
          </motion.div>
        ))}

        <AnimatePresence>
          {loading && (
            <motion.div className="flex justify-start"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}>
              <div className="px-4 py-3 rounded-2xl flex gap-1.5"
                style={{ background: "rgba(24,0,24,0.6)", border: "1px solid rgba(223,182,178,0.15)" }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-2 h-2 rounded-full"
                    style={{ background: "#DFB6B2" }}
                    animate={{ y: [0, -4, 0], opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.3 }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Take your time..."
          className="flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none resize-none"
          rows={2}
          style={{
            background: "rgba(24,0,24,0.5)",
            border: "1px solid rgba(223,182,178,0.2)",
            color: "#FAE5D8",
          }}
          disabled={loading}
        />
        <motion.button
          onClick={send}
          disabled={!input.trim() || loading}
          className="w-10 rounded-2xl flex items-center justify-center flex-shrink-0 self-end"
          style={{
            height: 40,
            background: input.trim() && !loading ? "#824D69" : "rgba(130,77,105,0.2)",
          }}
          whileTap={{ scale: 0.9 }}
        >
          <Send size={16} color={input.trim() && !loading ? "#FAE5D8" : "#824D69"} strokeWidth={1.5} />
        </motion.button>
      </div>
    </div>
  );
}
