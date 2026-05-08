import { motion, AnimatePresence } from "framer-motion";
import {
  Wind, Waves, Leaf, ScanLine, Heart, Music,
  Eye, Focus, PenLine, MessageCircle, Snowflake,
  Moon, HandHeart, Sun, X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Exercise {
  id: string;
  icon: LucideIcon;
  label: string;
  desc: string;
  type: "modal" | "chat";
}

export const EXERCISES: Exercise[] = [
  { id: "breathe",       icon: Wind,          label: "Breathe",             desc: "Box breathing · 4-4-4",                  type: "modal" },
  { id: "wave",          icon: Waves,          label: "Wave Breathing",      desc: "Slow ocean breath · 6 in · 6 out",       type: "modal" },
  { id: "ground",        icon: Leaf,           label: "Ground Me",           desc: "5-4-3-2-1 senses · in the chat",         type: "chat"  },
  { id: "bodyscan",      icon: ScanLine,       label: "Body Scan",           desc: "Feet to head · release tension",          type: "chat"  },
  { id: "butterfly",     icon: Heart,          label: "Butterfly Hug",       desc: "Bilateral tapping · soothes your nervous system", type: "modal" },
  { id: "hum",           icon: Music,          label: "Hum With Me",         desc: "30 seconds · activates vagus nerve",      type: "modal" },
  { id: "visualize",     icon: Eye,            label: "Visualization",       desc: "Find your safe place · eyes closed",      type: "chat"  },
  { id: "focus",         icon: Focus,          label: "Focus Point",         desc: "Pick an object · anchor to now",          type: "chat"  },
  { id: "braindump",     icon: PenLine,        label: "Brain Dump",          desc: "Say everything · no filter",              type: "modal" },
  { id: "letitout",      icon: MessageCircle,  label: "Let It Out",          desc: "Tell me everything · I'm here",           type: "chat"  },
  { id: "coldreset",     icon: Snowflake,      label: "Cold Reset",          desc: "Splash water · instant reset",            type: "chat"  },
  { id: "winddown",      icon: Moon,           label: "Wind Down",           desc: "Muscle relaxation · good for sleep",      type: "chat"  },
  { id: "selfcompass",   icon: HandHeart,      label: "Self Compassion",     desc: "Hand on heart · say something kind",      type: "chat"  },
  { id: "onegoodthing",  icon: Sun,            label: "One Good Thing",      desc: "Find one small light in the day",         type: "chat"  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export default function ExerciseMenu({ isOpen, onClose, onSelect }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(24,0,24,0.7)", backdropFilter: "blur(6px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col"
            style={{
              maxHeight: "75vh",
              background: "#2A114B",
              borderRadius: "24px 24px 0 0",
              boxShadow: "0 -8px 48px rgba(24,0,24,0.6)",
              border: "1px solid rgba(130,77,105,0.25)",
              borderBottom: "none",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: "rgba(130,77,105,0.4)" }} />
            </div>

            <div className="px-5 pb-2 flex-shrink-0 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: "#FAE5D8" }}>Exercises</p>
                <p className="text-xs mt-0.5" style={{ color: "#DFB6B2" }}>Choose something that feels right for you</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(130,77,105,0.2)" }}
              >
                <X size={16} color="#FAE5D8" strokeWidth={1.5} />
              </button>
            </div>

            {/* Scrollable list */}
            <div className="overflow-y-auto flex-1 px-4 pb-6 solace-scroll">
              <div className="flex flex-col gap-2 mt-2">
                {EXERCISES.map((ex, i) => {
                  const Icon = ex.icon;
                  return (
                    <motion.button
                      key={ex.id}
                      onClick={() => { onSelect(ex); onClose(); }}
                      className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left"
                      style={{
                        background: "rgba(130,77,105,0.1)",
                        border: "1px solid rgba(130,77,105,0.2)",
                      }}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04, ease: "easeOut" }}
                      whileHover={{ background: "rgba(130,77,105,0.2)", borderColor: "rgba(220,88,109,0.3)" } as never}
                      whileTap={{ scale: 0.975 }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(130,77,105,0.2)" }}>
                        <Icon size={20} color="#FAE5D8" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "#FAE5D8" }}>{ex.label}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "#DFB6B2" }}>{ex.desc}</p>
                      </div>
                      <span className="text-xs flex-shrink-0 px-2 py-1 rounded-full"
                        style={{
                          background: ex.type === "modal" ? "rgba(220,88,109,0.15)" : "rgba(255,187,148,0.12)",
                          color: ex.type === "modal" ? "#C4516A" : "#E8A882",
                          border: `1px solid ${ex.type === "modal" ? "rgba(220,88,109,0.25)" : "rgba(255,187,148,0.2)"}`,
                        }}
                      >
                        {ex.type === "modal" ? "guided" : "chat"}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
