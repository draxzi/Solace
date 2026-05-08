import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart } from "lucide-react";

interface Props {
  onClose: () => void;
}

const TOTAL_TAPS = 20;

export default function ButterflyHug({ onClose }: Props) {
  const [started, setStarted] = useState(false);
  const [tapSide, setTapSide] = useState<"left" | "right">("left");
  const [tapCount, setTapCount] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  function start() {
    setStarted(true);
    setTapCount(0);
    setTapSide("left");
    let count = 0;
    let side: "left" | "right" = "left";
    intervalRef.current = setInterval(() => {
      count += 1;
      side = side === "left" ? "right" : "left";
      setTapSide(side);
      setTapCount(count);
      if (count >= TOTAL_TAPS) {
        clearInterval(intervalRef.current!);
        setTimeout(() => setDone(true), 800);
      }
    }, 900);
  }

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
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 250 }}
      >
        <button onClick={onClose} className="self-end w-7 h-7 rounded-full flex items-center justify-center mb-4"
          style={{ background: "rgba(130,77,105,0.2)" }}>
          <X size={14} color="#FAE5D8" strokeWidth={1.5} />
        </button>

        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#824D69" }}>Butterfly Hug</p>
        <p className="text-xs mb-6 leading-relaxed" style={{ color: "#DFB6B2" }}>
          {!started ? "Cross your arms over your chest,\nhands resting on your shoulders." : "Gently tap, alternating left then right."}
        </p>

        {/* Visual */}
        <div className="relative flex items-center justify-center mb-8" style={{ width: 160, height: 160 }}>
          <div
            className="absolute rounded-3xl"
            style={{ width: 80, height: 100, background: "rgba(130,77,105,0.1)", border: "1.5px solid rgba(130,77,105,0.2)" }}
          />
          {/* Left arm */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 60, height: 18,
              background: started && tapSide === "left" ? "#C4516A" : "rgba(130,77,105,0.25)",
              top: 36, left: 10,
              transformOrigin: "right center",
              boxShadow: started && tapSide === "left" ? "0 0 20px rgba(220,88,109,0.5)" : "none"
            }}
            animate={{ rotate: started && tapSide === "left" ? -12 : -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          />
          {/* Right arm */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 60, height: 18,
              background: started && tapSide === "right" ? "#E8A882" : "rgba(130,77,105,0.25)",
              top: 36, right: 10,
              transformOrigin: "left center",
              boxShadow: started && tapSide === "right" ? "0 0 20px rgba(255,187,148,0.5)" : "none"
            }}
            animate={{ rotate: started && tapSide === "right" ? 12 : 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          />
          <Heart size={36} color="#C4516A" strokeWidth={1.5} fill="rgba(220,88,109,0.2)" className="relative z-10" />

          <AnimatePresence mode="wait">
            {started && !done && (
              <motion.div
                key={tapSide}
                className="absolute -bottom-2 text-xs font-semibold"
                style={{ color: tapSide === "left" ? "#C4516A" : "#E8A882" }}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {tapSide === "left" ? "← left" : "right →"}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.p key="done" className="text-base font-medium mb-4" style={{ color: "#FAE5D8" }}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              That's it. You just held yourself.
            </motion.p>
          ) : started ? (
            <motion.div key="progress" className="flex flex-col items-center mb-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-sm mb-2" style={{ color: "#FAE5D8" }}>{tapCount}/{TOTAL_TAPS}</p>
              <div className="flex gap-1 flex-wrap justify-center" style={{ maxWidth: 160 }}>
                {Array.from({ length: TOTAL_TAPS }).map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{ background: i < tapCount ? "#C4516A" : "rgba(130,77,105,0.2)" }} />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.p key="idle" className="text-sm mb-4 leading-relaxed"
              style={{ color: "#DFB6B2" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              This soothes your nervous system<br/>through bilateral stimulation.
            </motion.p>
          )}
        </AnimatePresence>

        {!started && !done && (
          <motion.button onClick={start}
            className="px-8 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: "#C4516A", color: "#FAE5D8", boxShadow: "0 4px 20px rgba(220,88,109,0.3)" }}
            whileHover={{ background: "#A33757" } as never} whileTap={{ scale: 0.96 }}
          >I'm ready</motion.button>
        )}
        {done && (
          <motion.button onClick={onClose}
            className="px-8 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: "#C4516A", color: "#FAE5D8" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            whileHover={{ background: "#A33757" } as never} whileTap={{ scale: 0.96 }}
          >Thank you, Solace</motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
