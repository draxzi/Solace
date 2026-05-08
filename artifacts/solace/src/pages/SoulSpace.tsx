import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import LetterToSelf from "@/components/LetterToSelf";
import ThoughtReframing from "@/components/ThoughtReframing";
import GriefSpace from "@/components/GriefSpace";
import HeartbreakSpace from "@/components/HeartbreakSpace";
import ForSomeoneMiss from "@/components/ForSomeoneMiss";
import { ChevronLeft, Sparkles, Mail, Brain, Heart, HeartCrack, Feather, ChevronDown } from "lucide-react";

type Tool = "letter" | "reframe" | "grief" | "heartbreak" | "miss" | null;

const TOOLS = [
  {
    id: "letter" as Tool,
    icon: Mail,
    title: "Letter to Yourself",
    subtitle: "Write to your future or past self. Private. Always.",
    accent: "#E8A882",
    border: "rgba(255,187,148,0.2)",
    bg: "rgba(255,187,148,0.06)",
    glow: null,
  },
  {
    id: "reframe" as Tool,
    icon: Brain,
    title: "Thought Reframing",
    subtitle: "Gently examine a thought that's been weighing on you.",
    accent: "#C4516A",
    border: "rgba(220,88,109,0.2)",
    bg: "rgba(220,88,109,0.06)",
    glow: null,
  },
  {
    id: "grief" as Tool,
    icon: Heart,
    title: "Grief & Loss Space",
    subtitle: "No advice. No fixing. Just deep presence.",
    accent: "#DFB6B2",
    border: "rgba(223,182,178,0.2)",
    bg: "rgba(223,182,178,0.06)",
    glow: null,
  },
  {
    id: "heartbreak" as Tool,
    icon: HeartCrack,
    title: "Heartbreak & Lonely Souls",
    subtitle: "For the ache that's hard to name.",
    accent: "#A33757",
    border: "rgba(163,55,87,0.28)",
    bg: "rgba(163,55,87,0.07)",
    glow: "0 0 24px rgba(163,55,87,0.18), 0 2px 20px rgba(24,0,24,0.3)",
  },
  {
    id: "miss" as Tool,
    icon: Feather,
    title: "For Someone You Miss",
    subtitle: "For the words still waiting to be said.",
    accent: "#C4923A",
    border: "rgba(196,146,58,0.25)",
    bg: "rgba(196,146,58,0.06)",
    glow: "0 0 24px rgba(196,146,58,0.14), 0 2px 20px rgba(24,0,24,0.3)",
  },
] as const;

export default function SoulSpace() {
  const [, navigate] = useLocation();
  const [openTool, setOpenTool] = useState<Tool>(null);

  function toggle(id: Tool) {
    setOpenTool(prev => prev === id ? null : id);
  }

  return (
    <motion.div
      className="flex flex-col min-h-screen"
      style={{ background: "linear-gradient(160deg, #180018 0%, #2A114B 100%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center px-4 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(130,77,105,0.2)", background: "rgba(29,26,57,0.8)", boxShadow: "0 1px 20px rgba(24,0,24,0.4)" }}>
        <motion.button
          onClick={() => navigate("/chat")}
          className="w-9 h-9 rounded-2xl flex items-center justify-center mr-3 flex-shrink-0"
          style={{ background: "rgba(130,77,105,0.2)" }}
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft size={20} color="#FAE5D8" strokeWidth={1.5} />
        </motion.button>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -5, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 5 }}
            >
              <Sparkles size={20} color="#E8A882" strokeWidth={1.5} />
            </motion.div>
            <h1 className="text-base font-semibold" style={{ color: "#FAE5D8" }}>Soul Space</h1>
          </div>
          <p className="text-xs" style={{ color: "#824D69" }}>Your private sanctuary</p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 solace-scroll">
        <div className="max-w-lg mx-auto flex flex-col gap-3">

          <motion.p
            className="text-xs text-center leading-relaxed px-4 pb-2"
            style={{ color: "#824D69" }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            A quiet corner, just for you. Take your time.
          </motion.p>

          {TOOLS.map((tool, i) => {
            const Icon = tool.icon;
            const isHeartbreak = tool.id === "heartbreak";
            return (
              <motion.div
                key={tool.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  border: `1px solid ${tool.border}`,
                  boxShadow: tool.glow ?? "0 2px 20px rgba(24,0,24,0.3)",
                }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.45, ease: "easeOut" }}
              >
                <motion.button
                  onClick={() => toggle(tool.id)}
                  className="w-full flex items-center gap-4 px-4 py-4 text-left"
                  style={{
                    background: openTool === tool.id ? "rgba(42,17,75,0.9)" : tool.bg,
                    borderBottom: openTool === tool.id ? `1px solid ${tool.border}` : "none",
                  }}
                  whileHover={{ filter: "brightness(1.08)" } as never}
                  whileTap={{ scale: 0.995 }}
                >
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: tool.bg, border: `1px solid ${tool.border}` }}>
                    {isHeartbreak ? (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Icon size={20} color={tool.accent} strokeWidth={1.5} />
                      </motion.div>
                    ) : (
                      <Icon size={20} color={tool.accent} strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: tool.accent }}>
                      {tool.title}
                    </p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#DFB6B2" }}>
                      {tool.subtitle}
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: openTool === tool.id ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ChevronDown size={16} color={tool.accent} strokeWidth={1.5} />
                  </motion.div>
                </motion.button>

                <AnimatePresence initial={false}>
                  {openTool === tool.id && (
                    <motion.div
                      className="px-4 py-4"
                      style={{
                        background: isHeartbreak ? "rgba(29,15,24,0.7)" : "rgba(42,17,75,0.6)",
                        borderTop: `1px solid ${tool.border}`,
                      }}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        duration: isHeartbreak ? 0.6 : 0.4,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                    >
                      {tool.id === "letter"     && <LetterToSelf />}
                      {tool.id === "reframe"    && <ThoughtReframing />}
                      {tool.id === "grief"      && <GriefSpace />}
                      {tool.id === "heartbreak" && <HeartbreakSpace />}
                      {tool.id === "miss"       && <ForSomeoneMiss />}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          <motion.p
            className="text-xs text-center mt-4 pb-6"
            style={{ color: "rgba(130,77,105,0.6)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Everything here is private. Nothing leaves your device.
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
