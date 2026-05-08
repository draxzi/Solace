import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
}

type Phase = "ready" | "inhale" | "hold" | "exhale" | "done";

const PHASES: Phase[] = ["inhale", "hold", "exhale"];
const PHASE_LABELS: Record<Phase, string> = {
  ready: "Get comfortable",
  inhale: "Breathe in...",
  hold: "Hold...",
  exhale: "Breathe out...",
  done: "Well done",
};
const PHASE_DURATION: Record<string, number> = { inhale: 4, hold: 4, exhale: 4 };
const TOTAL_CYCLES = 3;

export default function BreathingExercise({ onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [count, setCount] = useState(4);
  const [cycle, setCycle] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function start() { runPhase(0, 0); }

  function runPhase(pIdx: number, cycleNum: number) {
    const p = PHASES[pIdx]!;
    const duration = PHASE_DURATION[p]!;
    setPhase(p);
    setCount(duration);
    let remaining = duration;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setCount(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        const nextPIdx = pIdx + 1;
        if (nextPIdx < PHASES.length) {
          runPhase(nextPIdx, cycleNum);
        } else {
          const nextCycle = cycleNum + 1;
          setCycle(nextCycle);
          if (nextCycle < TOTAL_CYCLES) runPhase(0, nextCycle);
          else setPhase("done");
        }
      }
    }, 1000);
  }

  const isExpanded = phase === "inhale" || phase === "hold";
  const animDuration = phase === "inhale" || phase === "exhale" ? 4 : 0.15;
  const glowColor = phase === "inhale" ? "rgba(220,88,109,0.6)"
    : phase === "hold" ? "rgba(255,187,148,0.5)"
    : phase === "exhale" ? "rgba(163,55,87,0.4)"
    : "rgba(130,77,105,0.3)";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(24,0,24,0.92)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-xs rounded-3xl p-8 text-center flex flex-col items-center"
        style={{
          background: "#2A114B",
          border: "1px solid rgba(130,77,105,0.25)",
          boxShadow: "0 24px 60px rgba(24,0,24,0.7)",
        }}
        initial={{ scale: 0.88, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 24 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
      >
        <button onClick={onClose} className="self-end w-7 h-7 rounded-full flex items-center justify-center mb-4"
          style={{ background: "rgba(130,77,105,0.2)" }}>
          <X size={14} color="#FAE5D8" strokeWidth={1.5} />
        </button>

        <p className="text-xs uppercase tracking-widest mb-6" style={{ color: "#824D69" }}>
          Box Breathing · {cycle + 1}/{TOTAL_CYCLES}
        </p>

        {/* Breathing circle */}
        <div className="relative flex items-center justify-center mb-8" style={{ width: 180, height: 180 }}>
          <motion.div
            className="absolute rounded-full"
            style={{ width: 180, height: 180, background: "transparent" }}
            animate={{
              boxShadow: isExpanded
                ? `0 0 60px 20px ${glowColor}, 0 0 100px 40px rgba(130,77,105,0.15)`
                : `0 0 20px 4px rgba(130,77,105,0.1)`,
              scale: isExpanded ? 1 : 0.85,
            }}
            transition={{ duration: animDuration, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{ width: 160, height: 160, border: "1.5px solid rgba(220,88,109,0.2)", background: "transparent" }}
            animate={{ scale: isExpanded ? 1.3 : 1 }}
            transition={{ duration: animDuration, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 108, height: 108,
              background: "radial-gradient(circle at 40% 35%, #C4516A 0%, #A33757 60%, #824D69 100%)",
            }}
            animate={{
              scale: isExpanded ? 1.42 : 1,
              boxShadow: isExpanded
                ? "0 0 32px 8px rgba(220,88,109,0.4), inset 0 0 20px rgba(255,187,148,0.1)"
                : "0 0 12px 2px rgba(130,77,105,0.3)",
            }}
            transition={{ duration: animDuration, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{ width: 60, height: 60, background: "radial-gradient(circle, rgba(255,187,148,0.15) 0%, transparent 70%)" }}
            animate={{ scale: isExpanded ? 1.5 : 1, opacity: isExpanded ? 1 : 0.4 }}
            transition={{ duration: animDuration, ease: "easeInOut" }}
          />
          <AnimatePresence mode="wait">
            <motion.span
              key={count}
              className="relative z-10 text-3xl font-light"
              style={{ color: "#FAE5D8", textShadow: "0 2px 12px rgba(255,187,148,0.5)" }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.2 }}
            >
              {phase === "ready" || phase === "done" ? "" : count}
            </motion.span>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            className="text-lg font-medium mb-2"
            style={{ color: "#FAE5D8" }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {PHASE_LABELS[phase]}
          </motion.p>
        </AnimatePresence>

        <p className="text-xs mb-8" style={{ color: "#824D69" }}>
          {phase === "ready" ? "4 seconds each phase" : "inhale · hold · exhale"}
        </p>

        {phase === "ready" && (
          <motion.button onClick={start}
            className="px-8 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: "#C4516A", color: "#FAE5D8", boxShadow: "0 4px 20px rgba(220,88,109,0.3)" }}
            whileHover={{ background: "#A33757" } as never} whileTap={{ scale: 0.96 }}
          >Begin</motion.button>
        )}
        {phase === "done" && (
          <motion.button onClick={onClose}
            className="px-8 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: "#C4516A", color: "#FAE5D8" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            whileHover={{ background: "#A33757" } as never} whileTap={{ scale: 0.96 }}
          >I feel better</motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
