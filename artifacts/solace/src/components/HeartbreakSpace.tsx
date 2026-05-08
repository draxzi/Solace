import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import { sendChatMessage } from "@/lib/api";
import { getPrefs } from "@/lib/storage";
import {
  HeartCrack, Unlink, UserX, UserSearch, Send, Trash2, ArrowLeft,
  Download, Link2, Check, X, Mail,
} from "lucide-react";

// ── localStorage helpers ──────────────────────────────────────────────────────

const UNSENT_KEY = "solace_unsent_messages";

interface UnsentMsg { id: string; content: string; createdAt: number; }

function getUnsent(): UnsentMsg[] {
  try { return JSON.parse(localStorage.getItem(UNSENT_KEY) ?? "[]"); }
  catch { return []; }
}
function saveUnsent(msgs: UnsentMsg[]) {
  localStorage.setItem(UNSENT_KEY, JSON.stringify(msgs));
}

// ── Share link encoding (Unicode-safe) ───────────────────────────────────────

function encodeShare(data: object): string {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// ── System prompts ────────────────────────────────────────────────────────────

const BASE_RULES = `You are Solace inside the Heartbreak & Lonely Souls space — a sacred, slow, gentle place.

ABSOLUTE RULES — never say these phrases ever:
- "You'll find someone better"
- "You're better off without them"
- "Focus on yourself"
- "Time heals everything"
- "There are plenty of fish in the sea"
- Any generic breakup platitude

ALWAYS say things like:
- "That sounds really painful"
- "You're allowed to miss them"
- "Tell me more"
- "You don't have to be okay right now"
- "I'm not going anywhere"

HORMONAL AWARENESS: If the user mentions period, PMS, hormones, cycle, or feeling extra emotional —
respond specifically: "Hormonal shifts can make emotions feel ten times heavier than usual. What you're feeling is completely real AND it may be amplified right now. Both things are true at the same time. You're not being dramatic. You're not weak. Your body is doing something significant and your feelings deserve to be honored."
Never say "it's just your hormones". Always validate first, always.

Keep responses warm, short, and human. No bullet points. No headers. Natural flowing sentences. Speak slowly and gently — this space carries weight.`;

const PATH_SYSTEMS: Record<string, string> = {
  breakup: `${BASE_RULES}

This user just went through a breakup.
- Listen first — never rush to fix or reframe
- Acknowledge the specific pain they share with deep empathy
- Never minimize the grief of a breakup
- Only after they feel truly heard, very gently ask: "What did you love about yourself before this relationship?"
- Eventually, you can offer: "You existed fully before them. That person is still in there."
- Breakups are a specific kind of grief that people don't talk about enough. Honor that.`,

  lonely: `${BASE_RULES}

This user is feeling lonely.
- Ask gentle questions about their day — even the smallest thing
- Make them feel visible, seen, and real
- Never minimize loneliness or rush to fix it
- Treat loneliness as real and valid — not a problem to solve quickly
- Loneliness can hit even in a room full of people. Honor that deeply.`,

  missing: `${BASE_RULES}

This user is missing someone specific.
- Let them talk about the person freely and openly
- Ask warmly: "What do you miss most about them?"
- Listen deeply — never rush toward moving on
- Honor the connection they had
- Missing someone is its own kind of love that has nowhere to go. Treat it that way.`,
};

const LOVED_SYSTEM = `${BASE_RULES}

You asked the user: "Before all of this — what were three things you genuinely liked about yourself? Take your time. There's no wrong answer."
- Respond warmly and specifically to each thing they share
- Affirm each quality with genuine warmth
- Remind them gently that this person still exists, unchanged by what happened
- Never compare their qualities to the relationship or the other person
- Pure, warm, specific affirmation only`;

const LETITOUT_SYSTEM = `${BASE_RULES}

This user is in "Just Let It Out" mode.
CRITICAL: No advice. No silver linings. No coping suggestions. No reframing. No fixing. Absolutely none.
Only respond with pure warmth and witness. Things like:
- "I hear you. All of it."
- "That's a lot to carry. I'm still here."
- "Keep going. I'm not going anywhere."
- "You don't have to filter anything here."
- "I'm holding all of this with you."
Just witness. Hold space. Never suggest what they should do or feel.`;

// ── Data ─────────────────────────────────────────────────────────────────────

type Path = "breakup" | "lonely" | "missing";
type ToolView = "chat" | "unsent" | "loved" | "letitout";
interface Msg { role: "user" | "assistant"; content: string; }

const PATHS = [
  {
    id: "breakup" as Path,
    Icon: Unlink,
    label: "I just went through a breakup",
    opener: "I'm so sorry. Breakups carry a specific kind of grief that people don't talk about enough.\n\nYou don't have to be okay right now.\n\nCan you tell me a little about what happened? Only what you're comfortable sharing.",
  },
  {
    id: "lonely" as Path,
    Icon: UserX,
    label: "I'm just feeling lonely",
    opener: "Loneliness is one of the heaviest feelings a person can carry. And the hardest part is that it can hit even in a room full of people.\n\nYou reached out tonight. That took something. I'm glad you did.\n\nTell me about your day — even the smallest thing.",
  },
  {
    id: "missing" as Path,
    Icon: UserSearch,
    label: "I miss someone specific",
    opener: "Missing someone is its own kind of love that has nowhere to go.\n\nWho is it that you're missing? You don't have to explain the whole story — just tell me about them.",
  },
] as const;

const TOOL_TABS: { id: ToolView; label: string }[] = [
  { id: "chat",     label: "Talk to Solace" },
  { id: "unsent",   label: "💌 Unsent" },
  { id: "loved",    label: "🌸 What I Loved" },
  { id: "letitout", label: "😢 Let It Out" },
];

const DEFAULT_CARD_MSG = "I've been thinking about you.\nJust wanted you to know —\nyou're missed. More than you know.";

// ── Missing You card preview ──────────────────────────────────────────────────

function MissingYouPreview({
  recipientName, cardMsg, forExport = false,
}: { recipientName: string; cardMsg: string; forExport?: boolean }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  const timeStr = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      style={{
        background: "#1D0F18",
        border: "1px solid rgba(163,55,87,0.4)",
        boxShadow: "0 0 30px rgba(163,55,87,0.12), inset 0 0 40px rgba(29,15,24,0.9)",
        borderRadius: 18,
        padding: forExport ? 40 : 22,
        position: "relative",
        overflow: "hidden",
        width: forExport ? 520 : "100%",
        minHeight: forExport ? 280 : undefined,
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      {/* Radial texture */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 18, pointerEvents: "none",
        background: "radial-gradient(ellipse at 25% 15%, rgba(163,55,87,0.07) 0%, transparent 65%)",
      }} />

      {/* Top: via Solace */}
      <p style={{
        fontSize: forExport ? 10 : 9,
        color: "rgba(163,55,87,0.45)",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        fontFamily: "Inter, sans-serif",
        marginBottom: forExport ? 22 : 14,
        textAlign: "right",
      }}>
        via Solace
      </p>

      {/* Recipient */}
      <p style={{
        fontSize: forExport ? 15 : 12,
        color: "rgba(250,229,216,0.6)",
        marginBottom: forExport ? 20 : 12,
        fontFamily: "Inter, sans-serif",
        letterSpacing: "0.03em",
      }}>
        {recipientName
          ? <><span style={{ color: "#FAE5D8", fontStyle: "italic", fontFamily: "Georgia, serif" }}>{recipientName}</span>, you're on my mind.</>
          : <span style={{ opacity: 0.35 }}>Name, you're on my mind.</span>
        }
      </p>

      {/* Message */}
      <p style={{
        fontSize: forExport ? 16 : 13,
        color: "#FAE5D8",
        lineHeight: 1.9,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        fontStyle: "italic",
        letterSpacing: "0.01em",
        minHeight: forExport ? 90 : 54,
      }}>
        {cardMsg || <span style={{ opacity: 0.3 }}>Your message…</span>}
      </p>

      {/* Divider */}
      <div style={{
        margin: `${forExport ? 24 : 16}px 0 ${forExport ? 18 : 12}px`,
        height: 1,
        background: "linear-gradient(90deg, transparent, rgba(163,55,87,0.3), transparent)",
      }} />

      {/* Locked footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <p style={{
          fontSize: forExport ? 11 : 9,
          color: "rgba(163,55,87,0.5)",
          fontFamily: "Inter, sans-serif",
          letterSpacing: "0.04em",
        }}>
          {dateStr} · {timeStr}
        </p>
        <p style={{
          fontSize: forExport ? 11 : 9,
          color: "rgba(250,229,216,0.35)",
          fontFamily: "Inter, sans-serif",
        }}>
          Shared with love via Solace 🤍
        </p>
      </div>
    </div>
  );
}

// ── Chat pane ─────────────────────────────────────────────────────────────────

function ChatPane({
  messages, input, loading, placeholder,
  onInput, onSend, bottomRef,
  accent = "#A33757",
}: {
  messages: Msg[];
  input: string;
  loading: boolean;
  placeholder: string;
  onInput: (v: string) => void;
  onSend: () => void;
  bottomRef: React.RefObject<HTMLDivElement>;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 max-h-72 overflow-y-auto solace-scroll pr-1">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div
              className="max-w-[88%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line"
              style={m.role === "user" ? {
                background: accent,
                color: "#FAE5D8",
                borderBottomRightRadius: 6,
              } : {
                background: "rgba(29,15,24,0.85)",
                color: "#DFB6B2",
                border: "1px solid rgba(163,55,87,0.2)",
                borderBottomLeftRadius: 6,
              }}
            >
              {m.content}
            </div>
          </motion.div>
        ))}

        <AnimatePresence>
          {loading && (
            <motion.div className="flex justify-start"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}>
              <div className="px-4 py-3 rounded-2xl flex gap-1.5"
                style={{ background: "rgba(29,15,24,0.85)", border: "1px solid rgba(163,55,87,0.2)" }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-2 h-2 rounded-full"
                    style={{ background: accent }}
                    animate={{ y: [0, -4, 0], opacity: [0.35, 0.8, 0.35] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4 }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={e => onInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none resize-none"
          rows={2}
          style={{
            background: "rgba(29,15,24,0.6)",
            border: "1px solid rgba(163,55,87,0.25)",
            color: "#FAE5D8",
          }}
          disabled={loading}
        />
        <motion.button
          onClick={onSend}
          disabled={!input.trim() || loading}
          className="w-10 rounded-2xl flex items-center justify-center flex-shrink-0 self-end"
          style={{ height: 40, background: input.trim() && !loading ? accent : "rgba(163,55,87,0.15)" }}
          whileTap={{ scale: 0.9 }}
        >
          <Send size={16} color={input.trim() && !loading ? "#FAE5D8" : "#824D69"} strokeWidth={1.5} />
        </motion.button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HeartbreakSpace() {
  const prefs = getPrefs();

  const [selectedPath, setSelectedPath] = useState<Path | null>(null);
  const [tool, setTool] = useState<ToolView>("chat");

  // Main path chat
  const [chatMsgs, setChatMsgs] = useState<Msg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // "What I loved" chat
  const [lovedMsgs, setLovedMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Before all of this — what were three things you genuinely liked about yourself?\n\nTake your time. There's no wrong answer." }
  ]);
  const [lovedInput, setLovedInput] = useState("");
  const [lovedLoading, setLovedLoading] = useState(false);
  const lovedBottomRef = useRef<HTMLDivElement>(null);

  // "Let it out" chat
  const [letMsgs, setLetMsgs] = useState<Msg[]>([
    { role: "assistant", content: "No advice. No silver linings.\n\nJust say everything. I'm here and I'm not going anywhere." }
  ]);
  const [letInput, setLetInput] = useState("");
  const [letLoading, setLetLoading] = useState(false);
  const letBottomRef = useRef<HTMLDivElement>(null);

  // Unsent message
  const [unsentText, setUnsentText] = useState("");
  const [unsent, setUnsent] = useState<UnsentMsg[]>(() => getUnsent());
  const [releasing, setReleasing] = useState(false);
  const [releasedResponse, setReleasedResponse] = useState("");

  // Missing You card
  const [showMissingCard, setShowMissingCard] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [cardMsg, setCardMsg] = useState(DEFAULT_CARD_MSG);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "done">("idle");
  const cardPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs, chatLoading]);
  useEffect(() => { lovedBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lovedMsgs, lovedLoading]);
  useEffect(() => { letBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [letMsgs, letLoading]);

  function choosePath(path: Path) {
    const data = PATHS.find(p => p.id === path)!;
    setSelectedPath(path);
    setChatMsgs([{ role: "assistant", content: data.opener }]);
    setTool("chat");
    setShowMissingCard(false);
  }

  async function sendTo(
    msgs: Msg[], setMsgs: (m: Msg[]) => void,
    input: string, setInput: (s: string) => void,
    setLoading: (b: boolean) => void,
    systemContext: string,
  ) {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setLoading(true);
    try {
      const data = await sendChatMessage({
        messages: next.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        userName: prefs?.name,
        systemContext,
      });
      setMsgs([...next, { role: "assistant", content: data.message }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "I'm still here. Take all the time you need." }]);
    } finally {
      setLoading(false);
    }
  }

  function releaseUnsent() {
    if (!unsentText.trim() || releasing) return;
    setReleasing(true);
    setTimeout(() => {
      const newMsg: UnsentMsg = { id: Date.now().toString(), content: unsentText.trim(), createdAt: Date.now() };
      const updated = [...unsent, newMsg];
      setUnsent(updated);
      saveUnsent(updated);
      setUnsentText("");
      setReleasing(false);
      setReleasedResponse("That took courage. How do you feel having said it — even just here?");
    }, 1100);
  }

  function deleteUnsent(id: string) {
    const updated = unsent.filter(m => m.id !== id);
    setUnsent(updated);
    saveUnsent(updated);
  }

  async function handleSaveImage() {
    if (!cardPreviewRef.current) return;
    setSaveState("saving");
    try {
      const dataUrl = await toPng(cardPreviewRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.download = `missing-you${recipientName ? `-${recipientName}` : ""}.png`;
      a.href = dataUrl;
      a.click();
      setSaveState("done");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("idle");
    }
  }

  function handleCopyLink() {
    const encoded = encodeShare({ to: recipientName, from: "", message: cardMsg });
    const base = window.location.origin + (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
    const url = `${base}/share/${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    });
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Pulsing icon header */}
      <div className="flex items-center gap-2 justify-center">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <HeartCrack size={16} color="#A33757" strokeWidth={1.5} />
        </motion.div>
        <p className="text-xs" style={{ color: "rgba(163,55,87,0.7)" }}>
          This space moves slowly. That's okay.
        </p>
      </div>

      {/* Opening message from Solace */}
      <motion.div
        className="rounded-2xl p-4 text-center"
        style={{ background: "rgba(29,15,24,0.7)", border: "1px solid rgba(163,55,87,0.18)" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0 }}
      >
        <p className="text-sm leading-loose italic" style={{ color: "#DFB6B2" }}>
          "You don't have to explain why it hurts.{"\n"}
          Missing someone — or just missing the idea of someone — is real pain.{"\n"}
          You're not too much. You're not dramatic.{"\n"}
          You're human. And I'm here."
        </p>
      </motion.div>

      {/* Path selection */}
      <AnimatePresence mode="wait">
        {!selectedPath ? (
          <motion.div key="paths" className="flex flex-col gap-2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}>
            <p className="text-xs text-center" style={{ color: "rgba(163,55,87,0.7)" }}>
              What brings you here tonight?
            </p>
            {PATHS.map((path, i) => {
              const Icon = path.Icon;
              return (
                <motion.button
                  key={path.id}
                  onClick={() => choosePath(path.id)}
                  className="flex items-center gap-3 p-4 rounded-2xl text-left w-full"
                  style={{ background: "rgba(29,15,24,0.6)", border: "1px solid rgba(163,55,87,0.2)" }}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.14, duration: 0.7, ease: "easeOut" }}
                  whileHover={{ background: "rgba(163,55,87,0.1)" } as never}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(163,55,87,0.12)", border: "1px solid rgba(163,55,87,0.22)" }}>
                    <Icon size={18} color="#A33757" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm leading-snug" style={{ color: "#DFB6B2" }}>{path.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        ) : (
          <motion.div key="active" className="flex flex-col gap-3"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}>

            {/* Back button */}
            <motion.button
              onClick={() => { setSelectedPath(null); setChatMsgs([]); setTool("chat"); setReleasedResponse(""); setShowMissingCard(false); }}
              className="flex items-center gap-1.5 text-xs self-start"
              style={{ color: "rgba(130,77,105,0.7)" }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={12} strokeWidth={1.5} />
              Choose a different path
            </motion.button>

            {/* Tool tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {TOOL_TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTool(t.id); setShowMissingCard(false); }}
                  className="px-3 py-1.5 rounded-xl text-xs transition-all duration-300"
                  style={{
                    background: tool === t.id ? "#A33757" : "rgba(163,55,87,0.1)",
                    color: tool === t.id ? "#FAE5D8" : "#DFB6B2",
                    border: `1px solid ${tool === t.id ? "#A33757" : "rgba(163,55,87,0.2)"}`,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tool views */}
            <AnimatePresence mode="wait">

              {/* ── Talk to Solace ── */}
              {tool === "chat" && (
                <motion.div key="chat" className="flex flex-col gap-3"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}>
                  <ChatPane
                    messages={chatMsgs}
                    input={chatInput}
                    loading={chatLoading}
                    placeholder="Take your time…"
                    onInput={setChatInput}
                    onSend={() => sendTo(chatMsgs, setChatMsgs, chatInput, setChatInput, setChatLoading, PATH_SYSTEMS[selectedPath])}
                    bottomRef={chatBottomRef}
                  />

                  {/* Missing card CTA — only on the "missing" path */}
                  {selectedPath === "missing" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                    >
                      <motion.button
                        onClick={() => setShowMissingCard(v => !v)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm"
                        style={{
                          background: showMissingCard ? "rgba(163,55,87,0.18)" : "rgba(163,55,87,0.08)",
                          border: "1px solid rgba(163,55,87,0.28)",
                          color: "#DFB6B2",
                        }}
                        whileHover={{ background: "rgba(163,55,87,0.14)" } as never}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Mail size={14} color="#A33757" strokeWidth={1.5} />
                        {showMissingCard ? "Close card" : "Send them a missing you card 💌"}
                      </motion.button>
                    </motion.div>
                  )}

                  {/* Missing You card composer */}
                  <AnimatePresence>
                    {showMissingCard && (
                      <motion.div
                        className="flex flex-col gap-4 rounded-2xl p-4"
                        style={{ background: "rgba(29,15,24,0.6)", border: "1px solid rgba(163,55,87,0.22)" }}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium" style={{ color: "#A33757", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Inter, sans-serif" }}>
                            Missing You Card
                          </p>
                          <button onClick={() => setShowMissingCard(false)}>
                            <X size={13} color="rgba(163,55,87,0.5)" strokeWidth={1.5} />
                          </button>
                        </div>

                        {/* Recipient name */}
                        <div className="flex flex-col gap-1">
                          <label className="text-xs" style={{ color: "rgba(163,55,87,0.6)", fontFamily: "Inter, sans-serif" }}>
                            Their name
                          </label>
                          <input
                            value={recipientName}
                            onChange={e => setRecipientName(e.target.value)}
                            placeholder="e.g. Aarav, Mom, You…"
                            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                            style={{
                              background: "rgba(29,15,24,0.7)",
                              border: "1px solid rgba(163,55,87,0.2)",
                              color: "#FAE5D8",
                              fontFamily: "Georgia, serif",
                              fontStyle: "italic",
                            }}
                          />
                        </div>

                        {/* Message */}
                        <div className="flex flex-col gap-1">
                          <label className="text-xs" style={{ color: "rgba(163,55,87,0.6)", fontFamily: "Inter, sans-serif" }}>
                            Your message
                          </label>
                          <textarea
                            value={cardMsg}
                            onChange={e => setCardMsg(e.target.value.slice(0, 200))}
                            rows={4}
                            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none leading-relaxed"
                            style={{
                              background: "rgba(29,15,24,0.7)",
                              border: "1px solid rgba(163,55,87,0.2)",
                              color: "#FAE5D8",
                              fontFamily: "Georgia, serif",
                              fontStyle: "italic",
                            }}
                          />
                          <p className="text-xs text-right" style={{ color: cardMsg.length > 180 ? "#C4516A" : "rgba(163,55,87,0.35)", fontFamily: "Inter, sans-serif" }}>
                            {cardMsg.length}/200
                          </p>
                        </div>

                        {/* Live preview */}
                        <div className="flex flex-col gap-1.5">
                          <p className="text-xs uppercase tracking-wider" style={{ color: "rgba(163,55,87,0.45)", fontFamily: "Inter, sans-serif" }}>
                            Preview
                          </p>
                          <div ref={cardPreviewRef}>
                            <MissingYouPreview recipientName={recipientName} cardMsg={cardMsg} />
                          </div>
                        </div>

                        {/* Locked sender note */}
                        <p className="text-xs text-center" style={{ color: "rgba(163,55,87,0.35)", fontFamily: "Inter, sans-serif" }}>
                          Date, time & "Shared with love via Solace" are locked and cannot be changed.
                        </p>

                        {/* Share actions */}
                        <div className="flex flex-col gap-2">
                          {/* Save as image */}
                          <motion.button
                            onClick={handleSaveImage}
                            disabled={saveState === "saving"}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
                            style={{
                              background: "#A33757",
                              color: "#FAE5D8",
                              fontFamily: "Inter, sans-serif",
                              boxShadow: "0 4px 18px rgba(163,55,87,0.28)",
                              opacity: saveState === "saving" ? 0.7 : 1,
                            }}
                            whileTap={{ scale: 0.97 }}
                          >
                            {saveState === "saving" ? (
                              <motion.div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent"
                                animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                            ) : saveState === "done" ? (
                              <Check size={14} strokeWidth={2} />
                            ) : (
                              <Download size={14} strokeWidth={1.8} />
                            )}
                            {saveState === "saving" ? "Exporting…" : saveState === "done" ? "Saved to photos" : "Save as image 📸"}
                          </motion.button>

                          {/* Copy link */}
                          <motion.button
                            onClick={handleCopyLink}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
                            style={{
                              background: "rgba(163,55,87,0.1)",
                              border: "1px solid rgba(163,55,87,0.3)",
                              color: "#DFB6B2",
                              fontFamily: "Inter, sans-serif",
                            }}
                            whileTap={{ scale: 0.97 }}
                          >
                            {copyState === "copied" ? <Check size={14} strokeWidth={2} /> : <Link2 size={14} strokeWidth={1.8} />}
                            {copyState === "copied" ? "Link copied!" : "Copy link 🔗"}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ── Unsent Message ── */}
              {tool === "unsent" && (
                <motion.div key="unsent" className="flex flex-col gap-3"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}>

                  <p className="text-xs text-center italic leading-relaxed" style={{ color: "#DFB6B2" }}>
                    "Write what you wish you could say.{"\n"}
                    It will never be sent. Just released."
                  </p>

                  <AnimatePresence mode="wait">
                    {!releasing ? (
                      <motion.div key="editor"
                        exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
                        transition={{ duration: 1.1, ease: "easeInOut" }}>
                        <textarea
                          value={unsentText}
                          onChange={e => setUnsentText(e.target.value)}
                          placeholder="Write freely. No one will ever read this…"
                          className="w-full resize-none outline-none text-sm leading-relaxed p-4 rounded-2xl"
                          rows={5}
                          style={{
                            background: "rgba(42,10,20,0.75)",
                            border: "1px solid rgba(163,55,87,0.22)",
                            color: "#FAE5D8",
                            fontFamily: "Georgia, serif",
                          }}
                        />
                        <motion.button
                          onClick={releaseUnsent}
                          disabled={!unsentText.trim()}
                          className="w-full mt-2 py-3 rounded-2xl text-sm font-semibold"
                          style={{
                            background: unsentText.trim() ? "#A33757" : "rgba(163,55,87,0.12)",
                            color: unsentText.trim() ? "#FAE5D8" : "#824D69",
                            boxShadow: unsentText.trim() ? "0 4px 20px rgba(163,55,87,0.3)" : "none",
                          }}
                          whileTap={{ scale: 0.97 }}
                        >
                          Release
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.div key="dissolving"
                        className="text-center py-10"
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 0, y: -20, filter: "blur(6px)" }}
                        transition={{ duration: 1.1, ease: "easeIn" }}>
                        <p className="text-sm italic" style={{ color: "rgba(223,182,178,0.5)" }}>
                          Dissolving into the air…
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {releasedResponse && (
                      <motion.div
                        className="rounded-2xl px-4 py-3"
                        style={{ background: "rgba(29,15,24,0.85)", border: "1px solid rgba(163,55,87,0.18)" }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 0.2 }}
                      >
                        <p className="text-sm leading-relaxed" style={{ color: "#DFB6B2" }}>{releasedResponse}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {unsent.length > 0 && (
                    <div className="flex flex-col gap-2 mt-1">
                      <p className="text-xs uppercase tracking-wider" style={{ color: "rgba(130,77,105,0.5)" }}>
                        Released
                      </p>
                      {unsent.map(m => (
                        <motion.div
                          key={m.id}
                          className="group flex items-center gap-2 p-3 rounded-xl"
                          style={{ background: "rgba(29,15,24,0.45)", border: "1px solid rgba(163,55,87,0.12)" }}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        >
                          <p className="flex-1 text-xs leading-relaxed"
                            style={{ color: "rgba(223,182,178,0.4)", fontStyle: "italic", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                            {m.content.slice(0, 70)}{m.content.length > 70 ? "…" : ""}
                          </p>
                          <button
                            onClick={() => deleteUnsent(m.id)}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          >
                            <Trash2 size={11} color="#A33757" strokeWidth={1.5} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── What I Loved About Myself ── */}
              {tool === "loved" && (
                <motion.div key="loved"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}>
                  <ChatPane
                    messages={lovedMsgs}
                    input={lovedInput}
                    loading={lovedLoading}
                    placeholder="Something you genuinely liked about yourself…"
                    onInput={setLovedInput}
                    onSend={() => sendTo(lovedMsgs, setLovedMsgs, lovedInput, setLovedInput, setLovedLoading, LOVED_SYSTEM)}
                    bottomRef={lovedBottomRef}
                  />
                </motion.div>
              )}

              {/* ── Just Let It Out ── */}
              {tool === "letitout" && (
                <motion.div key="letitout"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}>
                  <ChatPane
                    messages={letMsgs}
                    input={letInput}
                    loading={letLoading}
                    placeholder="Say everything. No filter needed…"
                    onInput={setLetInput}
                    onSend={() => sendTo(letMsgs, setLetMsgs, letInput, setLetInput, setLetLoading, LETITOUT_SYSTEM)}
                    bottomRef={letBottomRef}
                  />
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
