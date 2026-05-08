import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon } from "lucide-react";

const OPTIONS = [
  { label: "Less than 2 hours", value: "low" },
  { label: "2–5 hours", value: "medium" },
  { label: "5–8 hours", value: "high" },
  { label: "More than 8 hours", value: "veryhigh" },
];

const RESPONSES: Record<string, string> = {
  low: "That's really healthy. How has your day felt offline? Sometimes the quiet moments are where we find ourselves again.",
  medium: "That's pretty typical. Maybe after this chat, try 20 minutes away from screens — a walk, a stretch, just looking out a window. I'll be here when you're back.",
  high: "That's okay. Screens are hard to step back from. Maybe after this chat, try 20 minutes away — no guilt, just a small break. Your eyes and mind will thank you. I'll be right here.",
  veryhigh: "That's a lot to carry. Your mind and eyes deserve some rest. Even 10 minutes away from all screens — just sitting, breathing, being — can shift something. Be gentle with yourself about it.",
};

export default function DigitalDetox() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-center italic" style={{ color: "#DFB6B2" }}>
        "How much screen time have you had today?"
      </p>

      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map(o => (
          <motion.button
            key={o.value}
            onClick={() => setSelected(o.value)}
            className="px-3 py-3 rounded-2xl text-sm text-left font-medium"
            style={{
              background: selected === o.value ? "rgba(220,88,109,0.15)" : "rgba(130,77,105,0.1)",
              border: `1.5px solid ${selected === o.value ? "rgba(220,88,109,0.4)" : "rgba(130,77,105,0.2)"}`,
              color: selected === o.value ? "#FAE5D8" : "#DFB6B2",
            }}
            animate={selected === o.value ? { scale: [1, 1.04, 1] } : { scale: 1 } as never}
            whileTap={{ scale: 0.96 }}
          >
            {o.label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(24,0,24,0.5)",
              border: "1px solid rgba(130,77,105,0.2)",
              boxShadow: "0 4px 20px rgba(24,0,24,0.3)",
            }}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "rgba(220,88,109,0.2)", border: "1px solid rgba(220,88,109,0.25)" }}>
                <Moon size={14} color="#C4516A" strokeWidth={1.5} />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#DFB6B2" }}>
                {RESPONSES[selected]}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selected && (
        <motion.button
          onClick={() => setSelected(null)}
          className="text-xs self-center mt-1"
          style={{ color: "#824D69" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        >
          Check in again
        </motion.button>
      )}
    </div>
  );
}
