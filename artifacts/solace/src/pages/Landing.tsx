import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { getPrefs } from "@/lib/storage";
import { Moon, Shield, Heart } from "lucide-react";

const WHISPERS = [
  "You don't have to explain yourself here.",
  "Whatever you're carrying — set it down.",
  "No judgment. No pressure. Just you.",
  "It's okay to not be okay.",
  "You came. That's enough.",
];

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  driftX: number;
  opacity: number;
  phase: number;
}

function makeParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: h + Math.random() * 150,
    size: 0.8 + Math.random() * 2,
    speedY: 0.22 + Math.random() * 0.4,
    driftX: (Math.random() - 0.5) * 0.2,
    opacity: 0.05 + Math.random() * 0.10,
    phase: Math.random() * Math.PI * 2,
  };
}

export default function Landing() {
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const [whisperIdx, setWhisperIdx] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Rotate whispers every 4 s
  useEffect(() => {
    const id = setInterval(() => setWhisperIdx(i => (i + 1) % WHISPERS.length), 4000);
    return () => clearInterval(id);
  }, []);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      particlesRef.current = Array.from({ length: 26 }, () =>
        makeParticle(canvas.width, canvas.height)
      );
    }
    resize();
    window.addEventListener("resize", resize);

    function drawThread(t: number) {
      if (!canvas) return;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Slow heartbeat pulse ~5 s period
      const heartbeat = 1 + Math.sin(t * 0.00125) * 0.035;
      // Unravel oscillation ~22 s period
      const unravel = (Math.sin(t * 0.000285) + 1) * 0.5;

      const ARMS = 5;
      for (let arm = 0; arm < ARMS; arm++) {
        const armAngle = (arm / ARMS) * Math.PI * 2;
        ctx.beginPath();
        let first = true;

        for (let s = 0; s <= 280; s++) {
          const frac = s / 280;
          const revolutions = 3.2 + unravel * 4.2;
          const angle = armAngle + frac * Math.PI * 2 * revolutions;
          const baseR = frac * 95 * heartbeat;
          const wobble = Math.sin(frac * 14 + t * 0.0009 + arm * 1.3) * 2.2;
          const r = baseR + wobble;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle) * 0.74;
          if (first) { ctx.moveTo(x, y); first = false; }
          else ctx.lineTo(x, y);
        }

        const grad = ctx.createLinearGradient(cx - 95, cy, cx + 95, cy);
        grad.addColorStop(0,    `rgba(255,187,148,${0.88 - arm * 0.08})`);
        grad.addColorStop(0.38, `rgba(232,168,130,${0.75 - arm * 0.07})`);
        grad.addColorStop(0.68, `rgba(196,81,106,${0.52 - arm * 0.07})`);
        grad.addColorStop(1,    `rgba(130,77,105,${0.18 - arm * 0.02})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2 - arm * 0.12;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = "rgba(255,187,148,0.32)";
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    function tickParticles(t: number) {
      if (!canvas) return;
      particlesRef.current = particlesRef.current.map(p => {
        const nx = p.x + p.driftX + Math.sin(t * 0.0006 + p.phase) * 0.2;
        const ny = p.y - p.speedY;
        ctx.beginPath();
        ctx.arc(nx, ny, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,168,130,${p.opacity})`;
        ctx.fill();
        if (ny < -8) return makeParticle(canvas.width, canvas.height);
        return { ...p, x: nx, y: ny };
      });
    }

    function frame(t: number) {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawThread(t);
      tickParticles(t);
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function handleStart() {
    setIsExiting(true);
    setTimeout(() => {
      const prefs = getPrefs();
      if (prefs?.onboardingDone) navigate("/chat");
      else navigate("/onboarding");
    }, 580);
  }

  return (
    <>
      {/* Dark curtain on exit */}
      <AnimatePresence>
        {isExiting && (
          <motion.div className="fixed inset-0 z-50" style={{ background: "#180018" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }} />
        )}
      </AnimatePresence>

      {/* Breathing background */}
      <motion.div
        className="relative overflow-hidden"
        style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", backgroundColor: "#180018" }}
        animate={{ backgroundColor: ["#180018", "#1D1A39", "#180018"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", times: [0, 0.5, 1] }}
      >
        {/* Full-screen canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Layout: top section — title + subtitle */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-[10vh]">

          {/* 1. Solace — Playfair Display */}
          <motion.h1
            style={{
              color: "#FAE5D8",
              fontFamily: "'Playfair Display', serif",
              fontWeight: 400,
              fontSize: "clamp(3rem, 10vw, 4.5rem)",
              letterSpacing: "0.12em",
              lineHeight: 1,
              textShadow: "0 0 40px rgba(255,187,148,0.12)",
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Solace
          </motion.h1>

          {/* 2. Subtitle */}
          <motion.p
            style={{
              color: "#DFB6B2",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 300,
              fontSize: "0.62rem",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              marginTop: "0.9rem",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.1, ease: "easeOut" }}
          >
            Your mind. Your space. Your pace.
          </motion.p>
        </div>

        {/* Middle: pure canvas zone — flex-1 makes thread visible */}
        <div className="flex-1 relative z-0" style={{ minHeight: "clamp(160px, 30vh, 260px)" }} />

        {/* Bottom section: whisper + hints + button + note */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 pb-[9vh] gap-0">

          {/* 4. Rotating whisper */}
          <motion.div
            style={{ height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2.0 }}
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={whisperIdx}
                style={{
                  color: "rgba(223,182,178,0.72)",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 300,
                  fontStyle: "italic",
                  fontSize: "0.82rem",
                  textAlign: "center",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.85 }}
              >
                {WHISPERS[whisperIdx]}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          {/* 5. Feature hints */}
          <motion.div
            className="flex items-center justify-center"
            style={{ gap: "0.75rem", marginTop: "1.4rem" }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 2.5, ease: "easeOut" }}
          >
            {[
              { Icon: Moon,   label: "Always here at 3AM" },
              { Icon: Shield, label: "Always anonymous"   },
              { Icon: Heart,  label: "No judgment ever"   },
            ].map(({ Icon, label }, i) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {i > 0 && (
                  <span style={{ color: "#824D69", fontSize: "4px" }}>●</span>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Icon size={13} color="#824D69" strokeWidth={1.5} />
                  <span style={{
                    color: "#DFB6B2",
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 300,
                    fontSize: "0.62rem",
                    whiteSpace: "nowrap",
                  }}>
                    {label}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* 6. CTA */}
          <motion.div
            style={{ marginTop: "1.6rem", width: "100%", maxWidth: "280px" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 3.0, ease: "easeOut" }}
          >
            <motion.button
              onClick={handleStart}
              style={{
                width: "100%",
                padding: "1rem 0",
                borderRadius: "9999px",
                background: "linear-gradient(135deg, #C4516A 0%, #824D69 100%)",
                color: "#FAE5D8",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 500,
                fontSize: "0.94rem",
                letterSpacing: "0.04em",
                border: "none",
                cursor: "pointer",
              }}
              animate={{
                boxShadow: [
                  "0 4px 16px rgba(196,81,106,0)",
                  "0 4px 32px rgba(196,81,106,0.5), 0 0 48px rgba(196,81,106,0.22)",
                  "0 4px 16px rgba(196,81,106,0)",
                ],
              }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{
                scale: 1.04,
                boxShadow: "0 4px 48px rgba(196,81,106,0.65), 0 0 64px rgba(196,81,106,0.3)",
              } as never}
              whileTap={{ scale: 0.97 }}
            >
              Start Talking
            </motion.button>
          </motion.div>

          {/* 7. Privacy note */}
          <motion.div
            style={{
              marginTop: "1.1rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.4rem",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 3.3 }}
          >
            <div style={{
              width: 52,
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(130,77,105,0.38), transparent)",
            }} />
            <p style={{
              color: "#824D69",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 300,
              fontSize: "0.6rem",
              letterSpacing: "0.04em",
            }}>
              Anonymous by default. Your privacy is sacred.
            </p>
          </motion.div>

        </div>
      </motion.div>
    </>
  );
}
