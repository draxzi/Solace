import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { respondToCheckin } from "@/lib/api";
import { saveMood, setLastCheckinDate, getLast7Moods } from "@/lib/storage";
import { Moon, X } from "lucide-react";

interface Props {
  userName?: string;
  onClose: () => void;
  onChatResponse?: (msg: string) => void;
}

type Mood = "good" | "meh" | "notgreat" | "rough";

const MOODS: { value: Mood; label: string; color: string; bg: string }[] = [
  { value: "good",     label: "Good",      color: "#E8A882", bg: "rgba(255,187,148,0.1)"  },
  { value: "meh",      label: "Meh",       color: "#DFB6B2", bg: "rgba(223,182,178,0.1)"  },
  { value: "notgreat", label: "Not great", color: "#C4516A", bg: "rgba(220,88,109,0.1)"   },
  { value: "rough",    label: "Rough day", color: "#824D69", bg: "rgba(130,77,105,0.12)"  },
];

const CHECKIN_MESSAGES = [
  "Hey, just checking in — how's your day been?",
  "What's on your mind today?",
  "You doing okay? No pressure, just asking.",
];

export default function CheckInModal({ userName, onClose, onChatResponse }: Props) {
  const [selected, setSelected] = useState<Mood | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const prompt = CHECKIN_MESSAGES[Math.floor(Math.random() * CHECKIN_MESSAGES.length)]!;

  async function handleMoodSelect(mood: Mood) {
    setSelected(mood);
    setLoading(true);

    saveMood(mood);
    const today = new Date().toISOString().split("T")[0]!;
    setLastCheckinDate(today);

    try {
      const recentMoods = getLast7Moods().map(m => m.mood);
      const data = await respondToCheckin({ mood, userName, recentMoods });
      setResponse(data.message);
      onChatResponse?.(data.message);
    } catch {
      setResponse("I'm here with you. How are you feeling today?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 pb-4 sm:pb-0"
      style={{ background: "rgba(24,0,24,0.6)", backdropFilter: "blur(6px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="w-full max-w-sm rounded-3xl p-6"
        style={{
          background: "#2A114B",
          border: "1px solid rgba(130,77,105,0.25)",
          boxShadow: "0 24px 60px rgba(24,0,24,0.7)",
        }}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(220,88,109,0.2)", border: "1px solid rgba(220,88,109,0.25)" }}>
            <Moon size={18} color="#C4516A" strokeWidth={1.5} />
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "rgba(130,77,105,0.2)" }}>
            <X size={14} color="#FAE5D8" strokeWidth={1.5} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!response ? (
            <motion.div key="question" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-base font-medium mb-1" style={{ color: "#FAE5D8" }}>Solace</p>
              <p className="text-sm mb-5" style={{ color: "#DFB6B2" }}>{prompt}</p>

              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ background: "#C4516A" }}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {MOODS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => handleMoodSelect(m.value)}
                      className="flex flex-col items-center py-3.5 rounded-2xl border-2 transition-all duration-200 active:scale-95"
                      style={{
                        borderColor: selected === m.value ? m.color : "rgba(130,77,105,0.2)",
                        background: selected === m.value ? m.bg : "rgba(130,77,105,0.08)",
                      }}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1"
                        style={{ background: m.bg, border: `1px solid ${m.color}30` }}>
                        <div className="w-3 h-3 rounded-full" style={{ background: m.color }} />
                      </div>
                      <span className="text-xs font-medium" style={{ color: "#FAE5D8" }}>{m.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="response"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-2"
            >
              <p className="text-base font-medium mb-2" style={{ color: "#FAE5D8" }}>Solace</p>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "#DFB6B2" }}>{response}</p>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl text-sm font-semibold"
                style={{ background: "#C4516A", color: "#FAE5D8", boxShadow: "0 4px 20px rgba(220,88,109,0.25)" }}
              >
                Thanks, Solace
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
