import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
}

type Phase = "ready" | "inhale" | "exhale" | "done";
const TOTAL_CYCLES = 4;

export default function WaveBreathing({ onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [count, setCount] = useState(6);
  const [cycle, setCycle] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function start() { runPhase("inhale", 0); }

  function runPhase(p: "inhale" | "exhale", cycleNum: number) {
    setPhase(p);
    setCount(6);
    let remaining = 6;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setCount(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        if (p === "inhale") {
          runPhase("exhale", cycleNum);
        } else {
          const next = cycleNum + 1;
          setCycle(next);
          if (next < TOTAL_CYCLES) runPhase("inhale", next);
          else setPhase("done");
        }
      }
    }, 1000);
  }

  const isInhale = phase === "inhale";
  const isActive = phase === "inhale" || phase === "exhale";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(24,0,24,0.94)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-xs rounded-3xl p-8 text-center flex flex-col items-center overflow-hidden"
        style={{
          background: "#2A114B",
          border: "1px solid rgba(130,77,105,0.25)",
          boxShadow: "0 24px 60px rgba(24,0,24,0.7)",
        }}
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 250 }}
      >
        <button onClick={onClose} className="self-end w-7 h-7 rounded-full flex items-center justify-center mb-4"
          style={{ background: "rgba(130,77,105,0.2)" }}>
          <X size={14} color="#FAE5D8" strokeWidth={1.5} />
        </button>

        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#824D69" }}>
          Wave Breathing · {cycle + 1}/{TOTAL_CYCLES}
        </p>
        <p className="text-xs mb-6" style={{ color: "rgba(130,77,105,0.6)" }}>6 seconds in · 6 seconds out</p>

        {/* Wave container */}
        <div className="relative w-full mb-6 overflow-hidden rounded-2xl" style={{ height: 120 }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(24,0,24,0.8) 0%, rgba(42,17,75,0.9) 100%)" }} />

          <motion.div
            className="absolute w-[200%] bottom-0"
            style={{ height: "70%", left: "-50%" }}
            animate={{ x: isInhale ? "0%" : "-25%" }}
            transition={{ duration: isActive ? 6 : 0.3, ease: "easeInOut" }}
          >
            <svg viewBox="0 0 800 120" preserveAspectRatio="none" className="w-full h-full">
              <motion.path
                d="M0,60 C100,20 200,100 300,60 C400,20 500,100 600,60 C700,20 800,100 800,60 L800,120 L0,120 Z"
                fill="#824D69"
                fillOpacity="0.5"
                animate={{
                  d: isInhale
                    ? "M0,40 C100,0 200,80 300,40 C400,0 500,80 600,40 C700,0 800,80 800,40 L800,120 L0,120 Z"
                    : "M0,80 C100,40 200,120 300,80 C400,40 500,120 600,80 C700,40 800,120 800,80 L800,120 L0,120 Z"
                }}
                transition={{ duration: isActive ? 6 : 0.5, ease: "easeInOut" }}
              />
              <motion.path
                d="M0,70 C120,30 240,110 360,70 C480,30 600,110 720,70 L800,70 L800,120 L0,120 Z"
                fill="#C4516A"
                fillOpacity="0.4"
                animate={{
                  d: isInhale
                    ? "M0,50 C120,10 240,90 360,50 C480,10 600,90 720,50 L800,50 L800,120 L0,120 Z"
                    : "M0,90 C120,50 240,110 360,90 C480,50 600,110 720,90 L800,90 L800,120 L0,120 Z"
                }}
                transition={{ duration: isActive ? 6 : 0.5, ease: "easeInOut", delay: 0.3 }}
              />
            </svg>
          </motion.div>

          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={`${phase}-${count}`}
                className="text-4xl font-light"
                style={{ color: "#FAE5D8", textShadow: "0 2px 16px rgba(255,187,148,0.4)" }}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.25 }}
              >
                {isActive ? count : ""}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            className="text-base font-medium mb-2"
            style={{ color: "#FAE5D8" }}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
          >
            {phase === "ready" && "Find a comfortable position"}
            {phase === "inhale" && "Breathe in..."}
            {phase === "exhale" && "Breathe out..."}
            {phase === "done" && "Beautiful. Well done."}
          </motion.p>
        </AnimatePresence>

        <p className="text-xs mb-6" style={{ color: "#824D69" }}>
          {phase === "ready" ? "slow and fluid, like ocean waves" : "let your whole body soften"}
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
          >I feel calmer</motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
