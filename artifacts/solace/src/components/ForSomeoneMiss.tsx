import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import { Feather, Download, Link2, Bird, Trash2, ChevronDown, ChevronUp, Check } from "lucide-react";
import {
  getMissCards, saveMissCard, deleteMissCard,
  getMissDraft, saveMissDraft,
} from "@/lib/storage";
import type { MissCard } from "@/lib/storage";

// ── URL encoding helpers (Unicode-safe) ──────────────────────────────────────

function encodeShare(data: object): string {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// ── Ember particles canvas ────────────────────────────────────────────────────

function EmberCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    type P = { x: number; y: number; r: number; vy: number; vx: number; o: number; ph: number };
    let particles: P[] = [];

    function init() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
      particles = Array.from({ length: 18 }, () => ({
        x: Math.random() * canvas!.width,
        y: canvas!.height + Math.random() * 80,
        r: 0.4 + Math.random() * 1.2,
        vy: 0.12 + Math.random() * 0.22,
        vx: (Math.random() - 0.5) * 0.12,
        o: 0.03 + Math.random() * 0.05,
        ph: Math.random() * Math.PI * 2,
      }));
    }
    init();
    window.addEventListener("resize", init);

    function frame(t: number) {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.map(p => {
        const nx = p.x + p.vx + Math.sin(t * 0.0004 + p.ph) * 0.18;
        const ny = p.y - p.vy;
        const np = ny < -10 ? { ...p, x: Math.random() * canvas!.width, y: canvas!.height + 10 } : { ...p, x: nx, y: ny };
        const alpha = p.o * (0.7 + 0.3 * Math.sin(t * 0.002 + p.ph));
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
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.7 }} />;
}

// ── Card preview (also exported for the share page) ──────────────────────────

export function MissCardPreview({
  to, from, message, forExport = false,
}: { to: string; from: string; message: string; forExport?: boolean }) {
  const date = new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  return (
    <div
      style={{
        background: "#1D0F18",
        border: "1px solid rgba(196,146,58,0.35)",
        boxShadow: "0 0 32px rgba(196,146,58,0.12), inset 0 0 40px rgba(29,15,24,0.8)",
        borderRadius: 20,
        padding: forExport ? 40 : 24,
        position: "relative",
        overflow: "hidden",
        minHeight: forExport ? 320 : undefined,
        width: forExport ? 560 : "100%",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      {/* Gradient texture */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 20,
        background: "radial-gradient(ellipse at 30% 20%, rgba(196,146,58,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Solace watermark */}
      <div style={{
        position: "absolute", top: forExport ? 16 : 10, right: forExport ? 20 : 14,
        fontSize: forExport ? 11 : 9,
        color: "rgba(196,146,58,0.3)",
        fontFamily: "Inter, sans-serif",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}>
        Solace
      </div>

      {/* Date */}
      <p style={{
        fontSize: forExport ? 12 : 10,
        color: "rgba(196,146,58,0.5)",
        marginBottom: forExport ? 20 : 14,
        letterSpacing: "0.06em",
        fontFamily: "Inter, sans-serif",
      }}>
        {date}
      </p>

      {/* To */}
      {to && (
        <p style={{
          fontSize: forExport ? 14 : 11,
          color: "rgba(250,229,216,0.6)",
          marginBottom: forExport ? 16 : 10,
          fontFamily: "Inter, sans-serif",
          letterSpacing: "0.04em",
        }}>
          To: <span style={{ color: "#FAE5D8", fontStyle: "italic" }}>{to}</span>
        </p>
      )}

      {/* Message */}
      <p style={{
        fontSize: forExport ? 17 : 13,
        color: "#FAE5D8",
        lineHeight: 1.85,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        minHeight: forExport ? 120 : 60,
        opacity: message ? 1 : 0.3,
        fontStyle: "italic",
        letterSpacing: "0.01em",
      }}>
        {message || "Your words will appear here…"}
      </p>

      {/* From */}
      {from && (
        <p style={{
          fontSize: forExport ? 13 : 11,
          color: "rgba(196,146,58,0.7)",
          marginTop: forExport ? 24 : 16,
          textAlign: "right",
          fontFamily: "Inter, sans-serif",
          letterSpacing: "0.04em",
        }}>
          — {from}
        </p>
      )}

      {/* Bottom glow line */}
      <div style={{
        position: "absolute", bottom: 0, left: "20%", right: "20%", height: 1,
        background: "linear-gradient(90deg, transparent, rgba(196,146,58,0.3), transparent)",
      }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function newId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export default function ForSomeoneMiss() {
  const draft = getMissDraft();
  const [to, setTo] = useState(draft?.to ?? "");
  const [from, setFrom] = useState(draft?.from ?? "");
  const [message, setMessage] = useState(draft?.message ?? "");
  const [savedCards, setSavedCards] = useState<MissCard[]>(() => getMissCards());
  const [showSaved, setShowSaved] = useState(false);

  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "done">("idle");
  const [keepState, setKeepState] = useState<"idle" | "saved">("idle");

  const previewRef = useRef<HTMLDivElement>(null);

  // Auto-save draft
  const debouncedSave = useCallback(() => {
    saveMissDraft({ to, from, message });
  }, [to, from, message]);

  useEffect(() => {
    const t = setTimeout(debouncedSave, 600);
    return () => clearTimeout(t);
  }, [debouncedSave]);

  async function handleSaveImage() {
    if (!previewRef.current) return;
    setSaveState("saving");
    try {
      const dataUrl = await toPng(previewRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.download = `solace-${to || "message"}.png`;
      a.href = dataUrl;
      a.click();
      setSaveState("done");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("idle");
    }
  }

  function handleCopyLink() {
    const encoded = encodeShare({ to, from, message });
    const base = window.location.origin + (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
    const url = `${base}/share/${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    });
  }

  function handleKeepPrivate() {
    const card: MissCard = { id: newId(), to, from, message, savedAt: Date.now() };
    saveMissCard(card);
    setSavedCards(getMissCards());
    setKeepState("saved");
    setTimeout(() => setKeepState("idle"), 2500);
  }

  function handleDelete(id: string) {
    deleteMissCard(id);
    setSavedCards(getMissCards());
  }

  const hasContent = message.trim().length > 0;
  const ACCENT = "#C4923A";
  const ACCENT_DIM = "rgba(196,146,58,0.18)";

  return (
    <div className="flex flex-col gap-5">

      {/* Opening message */}
      <motion.div
        className="rounded-2xl p-5 text-center relative overflow-hidden"
        style={{ background: "rgba(29,15,24,0.7)", border: "1px solid rgba(196,146,58,0.18)" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0 }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <EmberCanvas />
        </div>
        <div className="relative">
          <Feather size={18} color={ACCENT} strokeWidth={1.3} className="mx-auto mb-3" style={{ opacity: 0.8 }} />
          <p className="text-sm leading-loose" style={{ color: "#DFB6B2", fontFamily: "Georgia, serif", fontStyle: "italic" }}>
            "Some people stay with us in silence.<br />
            In routines. In memories. In unfinished words.<br /><br />
            Maybe they're far away.<br />
            Maybe things changed.<br />
            Maybe they're gone.<br /><br />
            If there's something in your heart you wish they knew —<br />
            this space is for that."
          </p>
        </div>
      </motion.div>

      {/* Composer */}
      <motion.div
        className="flex flex-col gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.7 }}
      >
        {/* To */}
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wider" style={{ color: ACCENT, opacity: 0.7, fontFamily: "Inter, sans-serif" }}>
            To
          </label>
          <input
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="Mom · Aarav · My best friend · You"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "rgba(29,15,24,0.6)",
              border: `1px solid ${ACCENT_DIM}`,
              color: "#FAE5D8",
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
            }}
          />
        </div>

        {/* From */}
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wider" style={{ color: ACCENT, opacity: 0.7, fontFamily: "Inter, sans-serif" }}>
            From
          </label>
          <input
            value={from}
            onChange={e => setFrom(e.target.value)}
            placeholder="Your daughter · Someone who misses you · Me"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "rgba(29,15,24,0.6)",
              border: `1px solid ${ACCENT_DIM}`,
              color: "#FAE5D8",
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
            }}
          />
        </div>

        {/* Message */}
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wider" style={{ color: ACCENT, opacity: 0.7, fontFamily: "Inter, sans-serif" }}>
            Message
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, 1000))}
            placeholder="Write freely. There's no right way to say this."
            rows={6}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none leading-relaxed"
            style={{
              background: "rgba(29,15,24,0.6)",
              border: `1px solid ${ACCENT_DIM}`,
              color: "#FAE5D8",
              fontFamily: "Georgia, serif",
              fontStyle: message ? "italic" : "normal",
            }}
          />
          <p className="text-xs text-right" style={{ color: message.length > 900 ? "#C4516A" : "rgba(196,146,58,0.4)" }}>
            {message.length}/1000
          </p>
        </div>
      </motion.div>

      {/* Live card preview */}
      <motion.div
        className="flex flex-col gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.7 }}
      >
        <p className="text-xs uppercase tracking-wider" style={{ color: ACCENT, opacity: 0.6, fontFamily: "Inter, sans-serif" }}>
          Preview
        </p>
        <div ref={previewRef}>
          <MissCardPreview to={to} from={from} message={message} />
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        className="flex flex-col gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.7 }}
      >
        {/* Save as image */}
        <motion.button
          onClick={handleSaveImage}
          disabled={!hasContent || saveState === "saving"}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
          style={{
            background: hasContent ? ACCENT : "rgba(196,146,58,0.08)",
            color: hasContent ? "#1D0F18" : "rgba(196,146,58,0.4)",
            fontFamily: "Inter, sans-serif",
          }}
          whileTap={{ scale: 0.97 }}
        >
          {saveState === "saving" ? (
            <motion.div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent"
              animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
          ) : saveState === "done" ? (
            <Check size={15} strokeWidth={2} />
          ) : (
            <Download size={15} strokeWidth={1.8} />
          )}
          {saveState === "saving" ? "Exporting…" : saveState === "done" ? "Saved to photos" : "Save as image"}
        </motion.button>

        {/* Copy share link */}
        <motion.button
          onClick={handleCopyLink}
          disabled={!hasContent}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
          style={{
            background: "rgba(196,146,58,0.1)",
            border: `1px solid ${hasContent ? "rgba(196,146,58,0.3)" : "rgba(196,146,58,0.1)"}`,
            color: hasContent ? "#C4923A" : "rgba(196,146,58,0.3)",
            fontFamily: "Inter, sans-serif",
          }}
          whileTap={{ scale: 0.97 }}
        >
          {copyState === "copied" ? <Check size={15} strokeWidth={2} /> : <Link2 size={15} strokeWidth={1.8} />}
          {copyState === "copied" ? "Link copied!" : "Copy share link"}
        </motion.button>

        {/* Keep private */}
        <motion.button
          onClick={handleKeepPrivate}
          disabled={!hasContent}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
          style={{
            background: "rgba(29,15,24,0.4)",
            border: "1px solid rgba(196,146,58,0.12)",
            color: hasContent ? "rgba(250,229,216,0.6)" : "rgba(250,229,216,0.2)",
            fontFamily: "Inter, sans-serif",
          }}
          whileTap={{ scale: 0.97 }}
        >
          {keepState === "saved" ? <Check size={15} strokeWidth={2} /> : <Bird size={15} strokeWidth={1.5} />}
          {keepState === "saved" ? "Saved privately" : "Keep private"}
        </motion.button>
      </motion.div>

      {/* Saved private cards */}
      {savedCards.length > 0 && (
        <motion.div
          className="flex flex-col gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            onClick={() => setShowSaved(v => !v)}
            className="flex items-center justify-between text-xs"
            style={{ color: "rgba(196,146,58,0.55)", fontFamily: "Inter, sans-serif" }}
          >
            <span className="uppercase tracking-wider">Private keepsakes ({savedCards.length})</span>
            {showSaved ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          <AnimatePresence>
            {showSaved && (
              <motion.div
                className="flex flex-col gap-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35 }}
              >
                {savedCards.map(card => (
                  <motion.div
                    key={card.id}
                    className="group rounded-xl p-3 flex items-start gap-3"
                    style={{ background: "rgba(29,15,24,0.5)", border: "1px solid rgba(196,146,58,0.14)" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex-1 min-w-0">
                      {card.to && (
                        <p className="text-xs mb-1" style={{ color: "rgba(196,146,58,0.6)", fontFamily: "Inter, sans-serif" }}>
                          To: {card.to}
                        </p>
                      )}
                      <p className="text-xs leading-relaxed truncate" style={{ color: "rgba(250,229,216,0.5)", fontStyle: "italic" }}>
                        {card.message.slice(0, 80)}{card.message.length > 80 ? "…" : ""}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "rgba(196,146,58,0.3)", fontFamily: "Inter, sans-serif" }}>
                        {new Date(card.savedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(card.id)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 mt-0.5"
                    >
                      <Trash2 size={11} color="#A33757" strokeWidth={1.5} />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <p className="text-xs text-center pb-2" style={{ color: "rgba(196,146,58,0.25)", fontFamily: "Inter, sans-serif" }}>
        Your draft saves automatically. Nothing leaves your device unless you share it.
      </p>
    </div>
  );
}
