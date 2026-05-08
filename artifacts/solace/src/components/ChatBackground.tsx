import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Shared particle type ───────────────────────────────────────────────────────

interface Particle {
  x: number; y: number; size: number;
  speedY: number; driftX: number; opacity: number; phase: number;
}

function makeParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: h + Math.random() * 120,
    size: 0.5 + Math.random() * 1.3,
    speedY: 0.15 + Math.random() * 0.28,
    driftX: (Math.random() - 0.5) * 0.15,
    opacity: 0.04 + Math.random() * 0.05,
    phase: Math.random() * Math.PI * 2,
  };
}

// ── Ember particles — floats behind chat messages ─────────────────────────────

export function EmberParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      particlesRef.current = Array.from({ length: 15 }, () =>
        makeParticle(canvas.width, canvas.height)
      );
    }
    resize();
    window.addEventListener("resize", resize);

    function frame(t: number) {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.map(p => {
        const nx = p.x + p.driftX + Math.sin(t * 0.0005 + p.phase) * 0.16;
        const ny = p.y - p.speedY;
        ctx.beginPath();
        ctx.arc(nx, ny, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,168,130,${p.opacity})`;
        ctx.fill();
        if (ny < -6) return makeParticle(canvas.width, canvas.height);
        return { ...p, x: nx, y: ny };
      });
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// ── Empty-state spiral — visible when chat has no messages ────────────────────

export function EmptySpiral({ visible }: { visible: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    // Fixed logical size — CSS scales it
    canvas.width = 180;
    canvas.height = 180;

    function frame(t: number) {
      ctx.clearRect(0, 0, 180, 180);
      const cx = 90, cy = 90;
      // Very slow clockwise rotation
      const rotation = t * 0.00018;
      const heartbeat = 1 + Math.sin(t * 0.0012) * 0.028;

      const ARMS = 4;
      for (let arm = 0; arm < ARMS; arm++) {
        const armBase = (arm / ARMS) * Math.PI * 2;
        ctx.beginPath();
        let first = true;
        for (let s = 0; s <= 220; s++) {
          const frac = s / 220;
          const angle = armBase + rotation + frac * Math.PI * 2 * 3.8;
          const r = frac * 78 * heartbeat;
          const wobble = Math.sin(frac * 14 + t * 0.0007 + arm) * 1.4;
          const x = cx + (r + wobble) * Math.cos(angle);
          const y = cy + (r + wobble) * Math.sin(angle) * 0.76;
          if (first) { ctx.moveTo(x, y); first = false; }
          else ctx.lineTo(x, y);
        }
        const grad = ctx.createLinearGradient(cx - 78, cy, cx + 78, cy);
        grad.addColorStop(0, `rgba(196,81,106,${0.85 - arm * 0.14})`);
        grad.addColorStop(1, `rgba(130,77,105,${0.38 - arm * 0.07})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.75;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ zIndex: 1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        >
          <canvas
            ref={canvasRef}
            style={{ width: 180, height: 180, opacity: 0.07 }}
          />
          <motion.p
            style={{
              color: "rgba(130,77,105,0.55)",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 300,
              fontStyle: "italic",
              fontSize: "0.78rem",
              marginTop: "-8px",
              userSelect: "none",
            }}
            animate={{ opacity: [0.45, 0.85, 0.45] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            Whenever you're ready.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
