import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendChatMessage } from "@/lib/api";
import { getPrefs } from "@/lib/storage";
import { PenLine, X } from "lucide-react";

interface Props {
  onClose: () => void;
  onResponse: (msg: string) => void;
}

export default function BrainDump({ onClose, onResponse }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const prefs = getPrefs();

  async function handleSubmit() {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      const data = await sendChatMessage({
        messages: [
          { role: "user", content: `[Brain Dump exercise] The user has just written a raw, unfiltered brain dump. Respond with pure warmth and acknowledgment — no advice, no analysis, no fixing. Just make them feel heard, safe, and not alone. Here's what they wrote: "${text}"` }
        ],
        userName: prefs?.name,
        tone: prefs?.tone,
      });
      onResponse(data.message);
      setSent(true);
    } catch {
      onResponse("I see you. All of it. Thank you for trusting me with this.");
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 pb-4 sm:pb-0"
      style={{ background: "rgba(24,0,24,0.7)", backdropFilter: "blur(6px)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <motion.div
        className="w-full max-w-sm rounded-3xl p-6 flex flex-col"
        style={{
          background: "#2A114B",
          border: "1px solid rgba(130,77,105,0.25)",
          boxShadow: "0 24px 60px rgba(24,0,24,0.7)",
          maxHeight: "80vh",
        }}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <PenLine size={20} color="#C4516A" strokeWidth={1.5} />
            <p className="text-sm font-semibold" style={{ color: "#FAE5D8" }}>Brain Dump</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "rgba(130,77,105,0.2)" }}>
            <X size={14} color="#FAE5D8" strokeWidth={1.5} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div key="sent" className="py-4 text-center"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-sm leading-relaxed" style={{ color: "#DFB6B2" }}>
                Solace received your words. Check the chat for a response.
              </p>
              <button onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-2xl text-sm font-medium"
                style={{ background: "#C4516A", color: "#FAE5D8" }}>
                Back to chat
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-xs mb-4 mt-1" style={{ color: "#DFB6B2" }}>
                Say everything. No filter. I'm not going anywhere.
              </p>
              <textarea
                autoFocus
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Just start typing. Whatever's in your head..."
                className="w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none transition-all leading-relaxed"
                rows={7}
                style={{
                  background: "rgba(24,0,24,0.4)",
                  border: "1.5px solid rgba(130,77,105,0.3)",
                  color: "#FAE5D8",
                }}
                onFocus={e => (e.target.style.borderColor = "#C4516A")}
                onBlur={e => (e.target.style.borderColor = "rgba(130,77,105,0.3)")}
                disabled={loading}
              />
              <motion.button
                onClick={handleSubmit}
                disabled={!text.trim() || loading}
                className="w-full mt-3 py-3 rounded-2xl text-sm font-semibold transition-all"
                style={{
                  background: text.trim() && !loading ? "#C4516A" : "rgba(130,77,105,0.2)",
                  color: text.trim() && !loading ? "#FAE5D8" : "#824D69",
                  boxShadow: text.trim() && !loading ? "0 4px 20px rgba(220,88,109,0.3)" : "none",
                }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? "Sending to Solace..." : "Send it all to Solace"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
