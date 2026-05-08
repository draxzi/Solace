import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useLocation } from "wouter";

// ── Decode helper ─────────────────────────────────────────────────────────────

function decodeShare(str: string): { to?: string; from?: string; message?: string } | null {
  try {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

// ── Ember canvas ──────────────────────────────────────────────────────────────

function EmberBg() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    type P = { x: number; y: number; r: number; vy: number; vx: number; o: number; ph: number };
    let ps: P[] = [];

    function init() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      ps = Array.from({ length: 28 }, () => ({
        x: Math.random() * canvas!.width,
        y: canvas!.height + Math.random() * 100,
        r: 0.5 + Math.random() * 1.5,
        vy: 0.1 + Math.random() * 0.2,
        vx: (Math.random() - 0.5) * 0.12,
        o: 0.03 + Math.random() * 0.06,
        ph: Math.random() * Math.PI * 2,
      }));
    }
    init();
    window.addEventListener("resize", init);

    function frame(t: number) {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ps = ps.map(p => {
        const nx = p.x + p.vx + Math.sin(t * 0.0003 + p.ph) * 0.2;
        const ny = p.y - p.vy;
        const np = ny < -10 ? { ...p, x: Math.random() * canvas!.width, y: canvas!.height + 10 } : { ...p, x: nx, y: ny };
        const alpha = p.o * (0.6 + 0.4 * Math.sin(t * 0.0015 + p.ph));
        ctx.beginPath();
        ctx.arc(np.x, np.y, np.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196,146,58,${alpha})`;
        ctx.fill();
        return np;
      });
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", init); };
  }, []);
  return <canvas ref={ref} className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />;
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function ShareCardView() {
  const { data } = useParams<{ data: string }>();
  const [, navigate] = useLocation();
  const parsed = data ? decodeShare(data) : null;
  const [glowPulse, setGlowPulse] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setGlowPulse(v => !v), 3000);
    return () => clearInterval(t);
  }, []);

  if (!parsed) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "#1D0F18" }}>
        <p style={{ color: "rgba(250,229,216,0.4)", fontFamily: "Georgia, serif", fontStyle: "italic" }}>
          This message couldn't be found.
        </p>
      </div>
    );
  }

  const { to, from, message } = parsed;
  const date = new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 relative"
      style={{ background: "linear-gradient(160deg, #1D0F18 0%, #130A10 60%, #1A0E18 100%)" }}>

      <EmberBg />

      {/* Ambient glow */}
      <motion.div
        className="fixed pointer-events-none"
        style={{
          inset: 0, zIndex: 0,
          background: "radial-gradient(ellipse at 50% 50%, rgba(196,146,58,0.04) 0%, transparent 70%)",
        }}
        animate={{ opacity: glowPulse ? 1 : 0.4 }}
        transition={{ duration: 3, ease: "easeInOut" }}
      />

      {/* Card */}
      <motion.div
        className="relative z-10 w-full max-w-sm"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <motion.div
          className="rounded-3xl overflow-hidden relative"
          style={{
            background: "#1D0F18",
            border: "1px solid rgba(196,146,58,0.3)",
          }}
          animate={{
            boxShadow: glowPulse
              ? "0 0 50px rgba(196,146,58,0.18), 0 0 100px rgba(196,146,58,0.08), inset 0 0 40px rgba(29,15,24,0.9)"
              : "0 0 30px rgba(196,146,58,0.10), 0 0 60px rgba(196,146,58,0.04), inset 0 0 40px rgba(29,15,24,0.9)",
          }}
          transition={{ duration: 3, ease: "easeInOut" }}
        >
          {/* Texture overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse at 25% 20%, rgba(196,146,58,0.07) 0%, transparent 65%)",
          }} />

          <div className="relative p-7">
            {/* Solace watermark */}
            <p className="text-right mb-4" style={{
              fontSize: 10,
              color: "rgba(196,146,58,0.3)",
              letterSpacing: "0.14em",
              fontFamily: "Inter, sans-serif",
              textTransform: "uppercase",
            }}>
              Solace
            </p>

            {/* Date */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{
                fontSize: 11,
                color: "rgba(196,146,58,0.45)",
                marginBottom: 18,
                letterSpacing: "0.06em",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {date}
            </motion.p>

            {/* To */}
            {to && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                style={{
                  fontSize: 12,
                  color: "rgba(250,229,216,0.55)",
                  marginBottom: 14,
                  fontFamily: "Inter, sans-serif",
                  letterSpacing: "0.04em",
                }}
              >
                To: <span style={{ color: "#FAE5D8", fontStyle: "italic", fontFamily: "Georgia, serif" }}>{to}</span>
              </motion.p>
            )}

            {/* Message */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.9 }}
              style={{
                fontSize: 15,
                color: "#FAE5D8",
                lineHeight: 1.9,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
                letterSpacing: "0.01em",
              }}
            >
              {message}
            </motion.p>

            {/* From */}
            {from && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                style={{
                  fontSize: 12,
                  color: "rgba(196,146,58,0.65)",
                  marginTop: 22,
                  textAlign: "right",
                  fontFamily: "Inter, sans-serif",
                  letterSpacing: "0.04em",
                }}
              >
                — {from}
              </motion.p>
            )}

            {/* Bottom glow line */}
            <div style={{
              marginTop: 28,
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(196,146,58,0.25), transparent)",
            }} />

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              className="text-center mt-4"
              style={{ fontSize: 11, color: "rgba(196,146,58,0.35)", fontFamily: "Inter, sans-serif" }}
            >
              Sent with Solace 🤍
            </motion.p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
        >
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-xl text-sm"
            style={{
              background: "rgba(196,146,58,0.1)",
              border: "1px solid rgba(196,146,58,0.22)",
              color: "#C4923A",
              fontFamily: "Inter, sans-serif",
            }}
          >
            I need this too ✦
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
