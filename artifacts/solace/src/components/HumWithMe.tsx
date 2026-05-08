import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
}

const DURATION = 30;

export default function HumWithMe({ onClose }: Props) {
  const [started, setStarted] = useState(false);
  const [remaining, setRemaining] = useState(DURATION);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function start() {
    setStarted(true);
    let r = DURATION;
    timerRef.current = setInterval(() => {
      r -= 1;
      setRemaining(r);
      if (r <= 0) {
        clearInterval(timerRef.current!);
        setDone(true);
      }
    }, 1000);
  }

  const progress = ((DURATION - remaining) / DURATION) * 100;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(24,0,24,0.94)" }}
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

        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#824D69" }}>Hum With Me</p>
        <p className="text-xs mb-6 leading-relaxed" style={{ color: "#DFB6B2" }}>
          Humming activates your vagus nerve,<br/>naturally slowing your heart rate.
        </p>

        {/* Sound wave bars */}
        <div className="relative flex items-center justify-center gap-1.5 mb-8" style={{ height: 80 }}>
          {Array.from({ length: 9 }).map((_, i) => {
            const center = 4;
            const dist = Math.abs(i - center);
            const baseH = 12 + (4 - dist) * 14;
            const activeColor = i % 2 === 0 ? "#C4516A" : "#E8A882";
            return (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: 6,
                  background: started && !done ? activeColor : "rgba(130,77,105,0.3)",
                }}
                animate={started && !done ? {
                  height: [baseH, baseH * 1.6, baseH],
                  opacity: [0.7, 1, 0.7],
                } : { height: baseH }}
                transition={{
                  duration: 1.4,
                  repeat: started && !done ? Infinity : 0,
                  delay: i * 0.12,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.p key="done" className="text-base font-medium mb-4" style={{ color: "#FAE5D8" }}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              Feel that? Your body just calmed itself.
            </motion.p>
          ) : started ? (
            <motion.div key="going" className="w-full flex flex-col items-center mb-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-2xl font-light mb-3" style={{ color: "#FAE5D8" }}>{remaining}s</p>
              <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: "rgba(130,77,105,0.2)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #C4516A, #E8A882)" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs mt-3" style={{ color: "#824D69" }}>hmmm... keep going</p>
            </motion.div>
          ) : (
            <motion.p key="idle" className="text-sm mb-4 leading-relaxed"
              style={{ color: "#DFB6B2" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Close your lips and hum softly.<br/>Feel the vibration in your chest.
            </motion.p>
          )}
        </AnimatePresence>

        {!started && !done && (
          <motion.button onClick={start}
            className="px-8 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: "#C4516A", color: "#FAE5D8", boxShadow: "0 4px 20px rgba(220,88,109,0.3)" }}
            whileHover={{ background: "#A33757" } as never} whileTap={{ scale: 0.96 }}
          >Start humming</motion.button>
        )}
        {done && (
          <motion.button onClick={onClose}
            className="px-8 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: "#C4516A", color: "#FAE5D8" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            whileHover={{ background: "#A33757" } as never} whileTap={{ scale: 0.96 }}
          >I feel it</motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
