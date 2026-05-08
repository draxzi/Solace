import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendChatMessage } from "@/lib/api";
import { getPrefs } from "@/lib/storage";
import { Send } from "lucide-react";

const CBT_SYSTEM = `You are Solace, a warm and gentle mental health companion helping with CBT-style thought reframing. 
The user has shared a negative thought. Guide them gently through examining it one step at a time.
Ask ONE question at a time. Keep questions warm, non-clinical, never dismissive. Never toxic positivity.
The CBT questions to work through (adapt naturally):
1. Acknowledge the thought with deep empathy first.
2. "What evidence supports this thought?"
3. "What would you say to a close friend who had this same thought about themselves?"
4. "Is there another way you could look at this situation?"
5. "What's the most compassionate thing you can tell yourself right now?"
After 5 exchanges, offer a gentle closing reflection.
Keep responses to 2-3 sentences max. Warm, patient, never rushing.`;

interface Step {
  role: "user" | "assistant";
  content: string;
}

export default function ThoughtReframing() {
  const prefs = getPrefs();
  const [thought, setThought] = useState("");
  const [started, setStarted] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps, loading]);

  async function startReframing() {
    if (!thought.trim()) return;
    setStarted(true);
    const userStep: Step = { role: "user", content: thought };
    setSteps([userStep]);
    setLoading(true);
    try {
      const data = await sendChatMessage({
        messages: [{ role: "user", content: `I'm having this thought: "${thought}"` }],
        userName: prefs?.name,
        systemContext: CBT_SYSTEM,
      });
      setSteps([userStep, { role: "assistant", content: data.message }]);
    } catch {
      setSteps([userStep, { role: "assistant", content: "I'm here. Let's gently look at this thought together. What feels true about it to you?" }]);
    } finally {
      setLoading(false);
    }
  }

  async function sendReply() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    const next = [...steps, { role: "user" as const, content: text }];
    setSteps(next);
    setLoading(true);
    try {
      const history = next.map(s => ({ role: s.role as "user" | "assistant", content: s.content }));
      const data = await sendChatMessage({
        messages: history,
        userName: prefs?.name,
        systemContext: CBT_SYSTEM,
      });
      setSteps([...next, { role: "assistant", content: data.message }]);
    } catch {
      setSteps([...next, { role: "assistant", content: "I'm still here. Take your time." }]);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setThought("");
    setStarted(false);
    setSteps([]);
    setInput("");
  }

  if (!started) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-center italic" style={{ color: "#DFB6B2" }}>
          "Share a thought that's been weighing on you. We'll look at it together, gently."
        </p>
        <div className="rounded-2xl p-4" style={{ background: "rgba(24,0,24,0.4)", border: "1px solid rgba(220,88,109,0.2)" }}>
          <textarea
            value={thought}
            onChange={e => setThought(e.target.value)}
            placeholder="The thought I keep having is..."
            className="w-full resize-none outline-none text-sm leading-relaxed"
            style={{ background: "transparent", color: "#FAE5D8", minHeight: 100 }}
          />
        </div>
        <motion.button
          onClick={startReframing}
          disabled={!thought.trim()}
          className="w-full py-3 rounded-2xl text-sm font-semibold"
          style={{
            background: thought.trim() ? "#C4516A" : "rgba(130,77,105,0.2)",
            color: thought.trim() ? "#FAE5D8" : "#824D69",
            boxShadow: thought.trim() ? "0 4px 20px rgba(220,88,109,0.25)" : "none",
          }}
          whileHover={thought.trim() ? { background: "#A33757" } : {}}
          whileTap={{ scale: 0.97 }}
        >
          Start reframing
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#824D69" }}>
          Thought Reframing
        </p>
        <button onClick={reset} className="text-xs" style={{ color: "#C4516A" }}>
          Start over
        </button>
      </div>

      <div className="flex flex-col gap-3 max-h-64 overflow-y-auto solace-scroll pr-1">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            className={`flex ${s.role === "user" ? "justify-end" : "justify-start"}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div
              className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
              style={s.role === "user" ? {
                background: "#824D69",
                color: "#FAE5D8",
                borderBottomRightRadius: 6,
              } : {
                background: "rgba(42,17,75,0.8)",
                color: "#FAE5D8",
                border: "1px solid rgba(220,88,109,0.2)",
                borderBottomLeftRadius: 6,
              }}
            >
              {s.content}
            </div>
          </motion.div>
        ))}

        <AnimatePresence>
          {loading && (
            <motion.div className="flex justify-start"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="px-4 py-3 rounded-2xl flex gap-1.5"
                style={{ background: "rgba(42,17,75,0.8)", border: "1px solid rgba(220,88,109,0.2)" }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-2 h-2 rounded-full"
                    style={{ background: "#C4516A" }}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18 }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 mt-1">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendReply()}
          placeholder="Your response..."
          className="flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none"
          style={{
            background: "rgba(24,0,24,0.4)",
            border: "1px solid rgba(130,77,105,0.3)",
            color: "#FAE5D8",
          }}
          disabled={loading}
        />
        <motion.button
          onClick={sendReply}
          disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: input.trim() && !loading ? "#C4516A" : "rgba(130,77,105,0.2)",
            boxShadow: input.trim() && !loading ? "0 4px 16px rgba(220,88,109,0.25)" : "none",
          }}
          whileTap={{ scale: 0.9 }}
        >
          <Send size={16} color={input.trim() && !loading ? "#FAE5D8" : "#824D69"} strokeWidth={1.5} />
        </motion.button>
      </div>
    </div>
  );
}
