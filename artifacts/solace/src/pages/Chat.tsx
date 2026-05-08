import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { sendChatMessage } from "@/lib/api";
import {
  getPrefs, shouldShowCheckin,
  loadCurrentConversation, createConversation, saveConversation,
  setCurrentConversationId,
  buildGreeting, getTimeContext, is3AMMode,
  extractMemoryFromMessage, saveMemoryNote,
  buildMemoryContext, markMemoriesReferenced, getUnreferencedMemories,
  countNegativeRecentMoods,
  getSilenceMode, getListenMode, setSilenceMode, setListenMode,
} from "@/lib/storage";
import type { ChatMessage, Conversation } from "@/lib/storage";
import CrisisBox from "@/components/CrisisBox";
import CheckInModal from "@/components/CheckInModal";
import BreathingExercise from "@/components/BreathingExercise";
import WaveBreathing from "@/components/WaveBreathing";
import ButterflyHug from "@/components/ButterflyHug";
import HumWithMe from "@/components/HumWithMe";
import BrainDump from "@/components/BrainDump";
import ExerciseMenu, { type Exercise } from "@/components/ExerciseMenu";
import Sidebar from "@/components/Sidebar";
import { EmberParticles, EmptySpiral } from "@/components/ChatBackground";
import { Menu, Sparkles, BarChart2, Send, Plus, Moon, Ear } from "lucide-react";

type CrisisLevel = "none" | "mild" | "moderate" | "high";
type ModalType = "breathe" | "wave" | "butterfly" | "hum" | "braindump" | null;

// ── Exercise step sequences ───────────────────────────────────────────────────

const GROUNDING_STEPS = [
  "Let's ground ourselves together. Take one slow breath first.",
  "Name **5 things you can see** right now — look around slowly and notice them.",
  "**4 things you can touch** — feel their texture, their temperature.",
  "**3 things you can hear** — even quiet background sounds count.",
  "**2 things you can smell** — or imagine your favourite scent.",
  "**1 thing you can taste** right now.",
  "That's it. You did it. Notice how your body feels a little more settled. I'm proud of you.",
];
const BODY_SCAN_STEPS = [
  "Let's do a gentle body scan together. Find a comfortable position and close your eyes if you can.",
  "Start at your **feet**. Notice any tension there. Take a slow breath and let your feet soften and release.",
  "Move up to your **calves and shins**. Breathe into them. Let any tightness melt away.",
  "Now your **knees and thighs**. Notice how they feel against the surface beneath you. Let them be heavy.",
  "Your **hips and lower back** — this is where we carry so much. Breathe here. Let it go.",
  "Your **stomach and chest**. With each exhale, feel your belly soften. You don't need to hold anything in.",
  "Your **shoulders** — let them drop. They've been carrying a lot. You can set that down now.",
  "Your **neck, jaw, and face**. Unclench your teeth. Soften around your eyes. Let your whole face go still.",
  "Take one long breath from the top of your head all the way down to your toes. And exhale slowly.",
  "That's everything. How does your body feel now? I'm here.",
];
const VISUALIZATION_STEPS = [
  "Let's find you a safe, peaceful place. Close your eyes when you're ready.",
  "Imagine you're somewhere that feels completely **safe and calm** — it could be real or imaginary. A beach, a forest, a cosy room, anywhere.",
  "**Look around** this place slowly. What do you see? The colours, the light, the shapes around you.",
  "Notice what you can **hear** there. Maybe it's gentle waves, birds, wind through leaves, or just soft silence.",
  "Feel the **air** on your skin. Is it warm? Cool? Is there a gentle breeze?",
  "Take a slow breath and notice if this place has any **smell** — salt air, pine, rain, something familiar and comforting.",
  "You are completely **safe here**. Nothing can reach you. This place is entirely yours.",
  "Stay here as long as you need. When you're ready to come back, take one deep breath. I'll be right here.",
];
const FOCUS_STEPS = [
  "Let's anchor you to the present moment.",
  "Look around and **pick one object near you**. Anything — a cup, a lamp, your hand, whatever catches your eye.",
  "Now describe it to yourself. What **colour** is it exactly? Not just 'blue' — what shade?",
  "Notice its **shape**. Are the edges sharp or rounded? Is it symmetrical?",
  "What's its **texture**? Smooth, rough, matte, glossy? If you can, touch it.",
  "How does the **light** fall on it? Are there any shadows? Any reflections?",
  "You just pulled your mind out of the spiral and back into this moment. That's real. You're here.",
];
const LET_IT_OUT_STEPS = [
  "Hey. Tell me everything. All of it. I'm here and I'm not going anywhere.",
  "There's no right way to do this. No filter needed. Just say whatever comes.",
];
const COLD_RESET_STEPS = [
  "Go splash cold water on your face right now. Take your time. I'll be right here when you get back.",
  "...",
  "Welcome back. Cold water activates your body's dive reflex, which slows the heart and calms the nervous system almost immediately. Your body knows how to help itself.",
];
const WIND_DOWN_STEPS = [
  "Let's wind down together. Tense and release each muscle group — this tells your nervous system it's safe to let go.",
  "**Feet** — curl your toes as tight as you can. Hold... and release. Feel them go soft.",
  "**Calves** — flex them hard. Hold... and release. Let them be heavy.",
  "**Thighs and glutes** — squeeze. Hold... and release. Feel the warmth.",
  "**Stomach** — pull it in tight. Hold... and release. Let your belly go soft.",
  "**Hands** — make tight fists. Hold... and release. Feel your fingers uncurl.",
  "**Shoulders** — shrug them up to your ears. Hold... and release. Let them drop as low as they'll go.",
  "**Face** — scrunch everything up. Hold... and release. Jaw slack, eyes soft.",
  "Take one long breath. Your whole body is heavy and warm. You're safe. Let yourself drift.",
];
const SELF_COMPASSION_STEPS = [
  "Let's pause for a moment of kindness — towards yourself.",
  "Place one hand gently over your **heart**. Feel its warmth. Feel your chest rise and fall.",
  "Think of something you've been hard on yourself about lately. You don't have to say it out loud.",
  "Notice that you're **human**. That you're struggling, like all humans sometimes do. This is part of being alive.",
  "Now say something kind to yourself — the kind of thing you'd say to a dear friend going through the same thing.",
  "You deserve the same compassion you'd give to someone you love. **You are worthy of kindness.**",
  "Keep your hand on your heart for a moment. Just breathe. You're doing enough.",
];
const ONE_GOOD_THING_STEPS = [
  "I want to ask you something — and there's no pressure here.",
  "Was there **one small thing** today that wasn't terrible? It doesn't have to be good. Just... not terrible.",
  "Maybe it was a warm drink. A moment of quiet. Someone being kind. A song. Sunlight through a window.",
  "Your brain is wired to notice what's wrong. But we can gently train it to notice the small lights too.",
  "Whatever it was — even something tiny — it counts. It was real. You found it.",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function newId() { return Math.random().toString(36).slice(2); }

function renderContent(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

function buildPreview(messages: ChatMessage[]): string {
  return messages.find(m => m.role === "user")?.content.slice(0, 60) ?? "";
}

const MISUNDERSTANDING_PATTERNS = [
  /that'?s not what i meant/i,
  /you misunderstood/i,
  /that'?s not what i said/i,
  /no,?\s+i meant/i,
  /you got that wrong/i,
  /that missed the point/i,
  /not what i was saying/i,
];

function detectMisunderstanding(text: string): boolean {
  return MISUNDERSTANDING_PATTERNS.some(p => p.test(text));
}

const LISTEN_ACKS = [
  "I hear you 🤍",
  "I'm here 🤍",
  "I hear you. Keep going if you need to 🤍",
  "With you 🤍",
  "I hear every word 🤍",
];

// ── Colours ───────────────────────────────────────────────────────────────────

function getChatBg(isGhost: boolean, is3AM: boolean) {
  if (isGhost) return "linear-gradient(180deg, #1D1A39 0%, #2A114B 100%)";
  if (is3AM) return "linear-gradient(180deg, #1D1A39 0%, #180018 100%)";
  return "linear-gradient(180deg, #1D1A39 0%, #2A114B 100%)";
}
function getHeaderBg(isGhost: boolean, is3AM: boolean) {
  if (isGhost) return "rgba(29,26,57,0.95)";
  if (is3AM) return "rgba(24,0,24,0.95)";
  return "rgba(29,26,57,0.95)";
}
function getHeaderBorder(isGhost: boolean, is3AM: boolean) {
  if (isGhost) return "rgba(130,77,105,0.3)";
  if (is3AM) return "rgba(130,77,105,0.2)";
  return "rgba(130,77,105,0.2)";
}
function getInputBarBg(isGhost: boolean, is3AM: boolean) {
  if (isGhost) return "rgba(29,26,57,0.95)";
  if (is3AM) return "rgba(24,0,24,0.95)";
  return "rgba(29,26,57,0.95)";
}
function getMsgBubbleBg(isGhost: boolean, is3AM: boolean) {
  if (isGhost) return "rgba(42,17,75,0.7)";
  if (is3AM) return "rgba(42,17,75,0.6)";
  return "#2A114B";
}
function getMsgBubbleBorder(isGhost: boolean, is3AM: boolean) {
  if (isGhost) return "rgba(130,77,105,0.25)";
  if (is3AM) return "rgba(130,77,105,0.2)";
  return "rgba(130,77,105,0.2)";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Chat() {
  const [, navigate] = useLocation();
  const prefs = getPrefs();
  const nightMode = is3AMMode();
  const { period } = getTimeContext();

  const [currentConv, setCurrentConv] = useState<Conversation>(() => loadCurrentConversation());

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const conv = loadCurrentConversation();
    if (conv.messages.length === 0) {
      const memCtx = buildMemoryContext();
      const greeting: ChatMessage = {
        id: newId(),
        role: "assistant",
        content: buildGreeting(prefs?.name),
        timestamp: Date.now(),
      };
      const updated = { ...conv, messages: [greeting], preview: "" };
      saveConversation(updated);
      if (memCtx) {
        const ids = getUnreferencedMemories().map(m => m.id);
        markMemoriesReferenced(ids);
      }
      return [greeting];
    }
    return conv.messages;
  });

  const [isGhostMode, setIsGhostMode] = useState(false);
  const [ghostMessages, setGhostMessages] = useState<ChatMessage[]>([]);
  const [silenceMode, setSilenceModeState] = useState(() => getSilenceMode());
  const [listenMode, setListenModeState] = useState(() => getListenMode());

  const [input, setInput] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState<CrisisLevel>("none");
  const [showCrisisBox, setShowCrisisBox] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showExerciseMenu, setShowExerciseMenu] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeMessages = isGhostMode ? ghostMessages : messages;
  const is3AM = nightMode;

  useEffect(() => {
    if (!isGhostMode && prefs?.onboardingDone && prefs.checkinTime) {
      if (shouldShowCheckin(prefs.checkinTime)) {
        const t = setTimeout(() => setShowCheckin(true), 2500);
        return () => clearTimeout(t);
      }
    }
    return undefined;
  }, [isGhostMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, loading]);

  useEffect(() => {
    if (isGhostMode || messages.length === 0) return;
    const updated: Conversation = {
      ...currentConv,
      messages: messages.slice(-100),
      updatedAt: Date.now(),
      preview: buildPreview(messages),
    };
    saveConversation(updated);
  }, [messages, isGhostMode]);

  const addMessage = useCallback((msg: Omit<ChatMessage, "id" | "timestamp">, ghost = false) => {
    const full: ChatMessage = { ...msg, id: newId(), timestamp: Date.now() };
    if (ghost) setGhostMessages(prev => [...prev, full]);
    else setMessages(prev => [...prev, full]);
    return full;
  }, []);

  function getMicroCelebrationContext(): string | null {
    const negCount = countNegativeRecentMoods();
    if (negCount >= 3) {
      return `The user has been having a hard time recently (${negCount} negative mood entries in the last 7 days). If they express anything positive today — feeling better, having a good moment — gently and warmly celebrate it with them. Something like: "You were having such a hard time recently. I'm really glad today feels a little different. That matters."`;
    }
    return null;
  }

  function handleNewChat() {
    setIsGhostMode(false);
    const greeting: ChatMessage = {
      id: newId(),
      role: "assistant",
      content: buildGreeting(prefs?.name),
      timestamp: Date.now(),
    };
    const conv = createConversation(greeting);
    setCurrentConv(conv);
    setMessages([greeting]);
    setCrisisLevel("none");
    setShowCrisisBox(false);
  }

  function handleGhostChat() {
    setIsGhostMode(true);
    const greeting: ChatMessage = {
      id: newId(),
      role: "assistant",
      content: buildGreeting(prefs?.name, true),
      timestamp: Date.now(),
    };
    setGhostMessages([greeting]);
    setCrisisLevel("none");
    setShowCrisisBox(false);
  }

  function exitGhostMode() {
    setIsGhostMode(false);
    setGhostMessages([]);
    setCrisisLevel("none");
    setShowCrisisBox(false);
  }

  function handleSelectConversation(conv: Conversation) {
    if (isGhostMode) exitGhostMode();
    setCurrentConv(conv);
    setCurrentConversationId(conv.id);
    setMessages(conv.messages);
    setCrisisLevel("none");
    setShowCrisisBox(false);
  }

  function deliverSteps(steps: string[], delay = 5500) {
    steps.forEach((step, i) => {
      setTimeout(() => addMessage({ role: "assistant", content: step }, isGhostMode), i * delay + 400);
    });
  }

  function detectSpecialTrigger(text: string): string | null {
    const lower = text.toLowerCase();
    if (lower.includes("breath") || lower.includes("box breath")) return "breathe";
    if (lower.includes("ground") || lower.includes("5-4-3")) return "ground";
    return null;
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    addMessage({ role: "user", content: text }, isGhostMode);

    if (!isGhostMode) {
      const mem = extractMemoryFromMessage(text);
      if (mem) saveMemoryNote(mem);
    }

    const trigger = detectSpecialTrigger(text);
    const isMisunderstanding = detectMisunderstanding(text);

    if (listenMode) {
      setLoading(true);
      await new Promise(r => setTimeout(r, 1800));
      const ack = LISTEN_ACKS[Math.floor(Math.random() * LISTEN_ACKS.length)]!;
      addMessage({ role: "assistant", content: ack }, isGhostMode);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const history = activeMessages.slice(-12).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const extras: string[] = [];
      if (!isGhostMode) {
        const memCtx = buildMemoryContext();
        if (memCtx) {
          extras.push(memCtx);
          markMemoriesReferenced(getUnreferencedMemories().map(m => m.id));
        }
        const celebCtx = getMicroCelebrationContext();
        if (celebCtx) extras.push(celebCtx);
      }
      if (isMisunderstanding) {
        extras.push(`The user felt misunderstood. Respond with: "I'm sorry, I got that wrong. Tell me again — I'm really listening this time." Then genuinely try again.`);
      }
      if (is3AM) {
        extras.push(`It is currently late at night (${period}). Use softer, slower language. Be even more gentle than usual. The user may be exhausted or vulnerable.`);
      }

      const systemContext = extras.length > 0 ? extras.join("\n\n") : undefined;

      const [data] = await Promise.all([
        sendChatMessage({
          messages: [...history, { role: "user", content: text }],
          userName: prefs?.name,
          tone: prefs?.tone,
          systemContext,
        }),
        new Promise<void>(r => setTimeout(r, 1500)),
      ]);

      addMessage({ role: "assistant", content: data.message }, isGhostMode);
      if (data.crisisLevel !== "none") { setCrisisLevel(data.crisisLevel); setShowCrisisBox(true); }
      if (trigger === "breathe") setTimeout(() => setActiveModal("breathe"), 900);
      if (trigger === "ground") setTimeout(() => handleExercise({ id: "ground" } as Exercise), 900);
    } catch {
      addMessage({ role: "assistant", content: "I'm so sorry, something went wrong on my end. I'm still here — please try again." }, isGhostMode);
    } finally {
      setLoading(false);
    }
  }

  function handleExercise(ex: Exercise) {
    switch (ex.id) {
      case "breathe":      setActiveModal("breathe"); break;
      case "wave":         setActiveModal("wave"); break;
      case "butterfly":    setActiveModal("butterfly"); break;
      case "hum":          setActiveModal("hum"); break;
      case "braindump":    setActiveModal("braindump"); break;
      case "ground":       deliverSteps(GROUNDING_STEPS); break;
      case "bodyscan":     deliverSteps(BODY_SCAN_STEPS, 8000); break;
      case "visualize":    deliverSteps(VISUALIZATION_STEPS, 9000); break;
      case "focus":        deliverSteps(FOCUS_STEPS, 7000); break;
      case "letitout":     deliverSteps(LET_IT_OUT_STEPS, 3000); break;
      case "coldreset":    deliverSteps(COLD_RESET_STEPS, 12000); break;
      case "winddown":     deliverSteps(WIND_DOWN_STEPS, 8000); break;
      case "selfcompass":  deliverSteps(SELF_COMPASSION_STEPS, 8000); break;
      case "onegoodthing": deliverSteps(ONE_GOOD_THING_STEPS, 7000); break;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const chatBg = getChatBg(isGhostMode, is3AM);
  const headerBg = getHeaderBg(isGhostMode, is3AM);
  const headerBorder = getHeaderBorder(isGhostMode, is3AM);
  const inputBarBg = getInputBarBg(isGhostMode, is3AM);
  const msgBg = getMsgBubbleBg(isGhostMode, is3AM);
  const msgBorder = getMsgBubbleBorder(isGhostMode, is3AM);

  return (
    <div className="flex flex-col relative overflow-hidden"
      style={{ height: "100dvh", background: chatBg, transition: "background 1.2s ease" }}>

      {/* Private mode banner */}
      <AnimatePresence>
        {isGhostMode && (
          <motion.div
            className="flex items-center justify-between px-4 py-2 flex-shrink-0"
            style={{
              background: "linear-gradient(90deg, rgba(130,77,105,0.3), rgba(69,25,82,0.3))",
              borderBottom: "1px solid rgba(130,77,105,0.25)",
            }}
            initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">🌸</span>
              <p className="text-xs font-medium" style={{ color: "#DFB6B2" }}>
                This conversation will never be saved. Say whatever you need to.
              </p>
            </div>
            <button onClick={exitGhostMode} className="text-xs px-2.5 py-1 rounded-xl flex-shrink-0"
              style={{ background: "rgba(130,77,105,0.25)", color: "#DFB6B2" }}>
              Exit
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listen mode banner */}
      <AnimatePresence>
        {listenMode && !isGhostMode && (
          <motion.div
            className="flex items-center justify-between px-4 py-2 flex-shrink-0"
            style={{ background: "rgba(42,17,75,0.8)", borderBottom: "1px solid rgba(130,77,105,0.2)" }}
            initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }}
          >
            <div className="flex items-center gap-2">
              <Ear size={16} color="#C4516A" strokeWidth={1.5} />
              <p className="text-xs font-medium" style={{ color: "#DFB6B2" }}>
                Just Listen Mode — Solace will only say "I hear you 🤍"
              </p>
            </div>
            <button onClick={() => { setListenMode(false); setListenModeState(false); }}
              className="text-xs px-2 py-0.5 rounded" style={{ color: "#C4516A" }}>
              off
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{
          background: headerBg,
          borderColor: headerBorder,
          boxShadow: "0 1px 20px rgba(24,0,24,0.5)",
          transition: "background 1.2s ease, border-color 1.2s ease",
          backdropFilter: "blur(12px)",
        }}>
        <div className="flex items-center gap-3">
          {/* Hamburger menu */}
          <motion.button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(130,77,105,0.2)" }}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
          >
            <Menu size={20} color="#FAE5D8" strokeWidth={1.5} />
          </motion.button>

          {/* Avatar */}
          <div className="relative w-9 h-9 flex-shrink-0">
            {/* Warm glow behind avatar */}
            <motion.div className="absolute inset-0 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(232,168,130,0.22) 0%, transparent 70%)", transform: "scale(1.55)" }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div className="absolute inset-0 rounded-full"
              style={{ background: isGhostMode ? "linear-gradient(135deg, #522959, #3A1A45)" : "linear-gradient(135deg, #3A1A45, #2A114B)" }}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute inset-0 rounded-full flex items-center justify-center">
              <Moon size={16} color="#E8A882" strokeWidth={1.5} />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold" style={{ color: "#FAE5D8" }}>
              Solace {isGhostMode && <span className="font-normal" style={{ color: "#824D69" }}>· private</span>}
            </p>
            <div className="flex items-center gap-1.5">
              <motion.div className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#824D69" }}
                animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2.5, repeat: Infinity }} />
              <p className="text-xs" style={{ color: "#824D69" }}>
                {isGhostMode ? "private mode" : is3AM ? "late night mode" : "always here with you"}
              </p>
            </div>
          </div>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-2">
          <motion.button onClick={() => navigate("/soul")}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,187,148,0.1)" }}
            whileHover={{ scale: 1.08, background: "rgba(255,187,148,0.2)" } as never}
            whileTap={{ scale: 0.92 }} title="Soul Space">
            <Sparkles size={20} color="#E8A882" strokeWidth={1.5} />
          </motion.button>
          <motion.button onClick={() => navigate("/mood")}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(130,77,105,0.15)" }}
            whileHover={{ scale: 1.08, background: "rgba(130,77,105,0.25)" } as never}
            whileTap={{ scale: 0.92 }} title="Mood History">
            <BarChart2 size={20} color="#C4516A" strokeWidth={1.5} />
          </motion.button>
        </div>
      </div>

      {/* Silence mode overlay */}
      <AnimatePresence>
        {silenceMode && (
          <motion.div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center"
            style={{ background: "#180018" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative flex items-center justify-center mb-8">
              {[0, 1, 2].map(i => (
                <motion.div key={i}
                  className="absolute rounded-full"
                  style={{
                    width: 80 + i * 60,
                    height: 80 + i * 60,
                    background: `radial-gradient(circle, rgba(255,187,148,${0.10 - i * 0.03}) 0%, transparent 70%)`,
                  }}
                  animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 5 + i * 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
                />
              ))}
              <motion.div className="relative w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #C4516A, #A33757)" }}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
                <Moon size={28} color="#FAE5D8" strokeWidth={1.5} />
              </motion.div>
            </div>
            <motion.p className="text-sm font-medium text-center"
              style={{ color: "#824D69" }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 4, repeat: Infinity }}>
              Solace is here. Just sitting with you.
            </motion.p>
            <motion.button
              className="mt-8 px-5 py-2.5 rounded-2xl text-sm font-medium"
              style={{ background: "rgba(130,77,105,0.2)", color: "#DFB6B2", border: "1px solid rgba(130,77,105,0.3)" }}
              onClick={() => { setSilenceMode(false); setSilenceModeState(false); }}
              whileHover={{ background: "rgba(130,77,105,0.3)" } as never} whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}>
              Return to chat
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 solace-scroll relative">
        {/* Living background — always present */}
        <EmberParticles />
        {/* Empty-state spiral — fades away once messages fill the chat */}
        <EmptySpiral visible={activeMessages.length <= 1} />

        <div className="relative max-w-lg mx-auto flex flex-col gap-3" style={{ zIndex: 2 }}>
          {activeMessages.map((msg, i) => {
            const isNew = i === activeMessages.length - 1;
            return (
              <motion.div key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                initial={{ opacity: 0, x: msg.role === "user" ? 22 : -22, y: 4 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: isNew ? (is3AM ? 0.65 : 0.32) : 0.01, ease: [0.25, 0.1, 0.25, 1] }}>
                {msg.role === "assistant" && (
                  <motion.div className="relative w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mr-2 mt-0.5"
                    style={{ background: "linear-gradient(135deg, #3A1A45, #2A114B)", boxShadow: "0 0 10px rgba(232,168,130,0.2)" }}
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ duration: is3AM ? 7 : 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
                    <Moon size={13} color="#E8A882" strokeWidth={1.5} />
                  </motion.div>
                )}
                <div className="max-w-[78%]">
                  <motion.div className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                    style={msg.role === "user" ? {
                      background: "#451952",
                      color: "#FAE5D8",
                      borderBottomRightRadius: 6,
                    } : {
                      background: "#2A114B",
                      color: "#FAE5D8",
                      borderLeft: "3px solid rgba(130,77,105,0.45)",
                      borderBottomLeftRadius: 6,
                      boxShadow: "0 2px 12px rgba(24,0,24,0.3)",
                      transition: "background 1.2s ease",
                    }}>
                    {renderContent(msg.content)}
                  </motion.div>
                  <p className="text-xs mt-1" style={{ color: "#824D69", textAlign: msg.role === "user" ? "right" : "left" }}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </motion.div>
            );
          })}

          {/* Thinking indicator */}
          <AnimatePresence>
            {loading && (
              <motion.div className="flex justify-start"
                initial={{ opacity: 0, x: -14, y: 4 }} animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.4, ease: "easeOut" }}>
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mr-2"
                  style={{ background: "linear-gradient(135deg, #3A1A45, #2A114B)", boxShadow: "0 0 10px rgba(232,168,130,0.2)" }}>
                  <Moon size={13} color="#E8A882" strokeWidth={1.5} />
                </div>
                <div className="px-4 py-3.5 rounded-2xl flex items-center gap-2.5"
                  style={{ background: "#2A114B", borderLeft: "3px solid rgba(130,77,105,0.45)", boxShadow: "0 2px 12px rgba(24,0,24,0.3)" }}>
                  {[0, 1, 2].map(j => (
                    <motion.div
                      key={j}
                      className="rounded-full"
                      style={{ width: 7, height: 7, background: "#E8A882" }}
                      animate={{
                        scale: [0.7, 1.15, 0.7],
                        opacity: [0.35, 0.9, 0.35],
                        boxShadow: [
                          "0 0 0px rgba(232,168,130,0)",
                          "0 0 8px rgba(232,168,130,0.5)",
                          "0 0 0px rgba(232,168,130,0)",
                        ],
                      }}
                      transition={{
                        duration: 2.0,
                        repeat: Infinity,
                        delay: j * 0.38,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Crisis box */}
      <AnimatePresence>
        {showCrisisBox && crisisLevel !== "none" && crisisLevel !== "mild" && (
          <CrisisBox level={crisisLevel} onDismiss={() => setShowCrisisBox(false)} />
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t px-4 py-3"
        style={{
          background: inputBarBg,
          borderColor: headerBorder,
          transition: "background 1.2s ease",
          backdropFilter: "blur(12px)",
        }}>
        <div className="max-w-lg mx-auto flex items-end gap-2.5">
          {/* Exercise "+" button */}
          <motion.button
            onClick={() => setShowExerciseMenu(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
            style={{
              background: "rgba(130,77,105,0.2)",
              border: "1.5px solid rgba(130,77,105,0.3)",
            }}
            animate={{
              scale: [1, 1.06, 1],
              boxShadow: ["0 0 0px rgba(220,88,109,0)", "0 0 14px rgba(220,88,109,0.2)", "0 0 0px rgba(220,88,109,0)"]
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.12, background: "rgba(220,88,109,0.2)" } as never}
            whileTap={{ scale: 0.9 }}
          >
            <Plus size={20} color="#FAE5D8" strokeWidth={1.5} />
          </motion.button>

          {/* Text input */}
          <div className="flex-1">
            <motion.div className="rounded-2xl overflow-hidden"
              animate={
                inputFocused && input.length > 0 ? {
                  boxShadow: [
                    "0 0 0 1.5px rgba(196,81,106,0.6), 0 4px 20px rgba(196,81,106,0.15)",
                    "0 0 0 1.5px rgba(196,81,106,0.6), 0 4px 28px rgba(196,81,106,0.28)",
                    "0 0 0 1.5px rgba(196,81,106,0.6), 0 4px 20px rgba(196,81,106,0.15)",
                  ],
                } : inputFocused ? {
                  boxShadow: "0 0 0 1.5px rgba(196,81,106,0.5), 0 4px 18px rgba(196,81,106,0.12)",
                } : {
                  boxShadow: "0 0 0 1.5px rgba(130,77,105,0.3)",
                }
              }
              transition={inputFocused && input.length > 0
                ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.25 }
              }>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={
                  silenceMode ? "Silence mode is on…" :
                  listenMode ? "Solace is listening. Say anything…" :
                  isGhostMode ? "Nothing you say here will be saved…" :
                  "Say anything — I'm listening…"
                }
                rows={1}
                disabled={loading || silenceMode}
                className="w-full resize-none px-4 py-3 text-sm outline-none"
                style={{
                  background: "rgba(24,0,24,0.6)",
                  color: "#FAE5D8",
                  maxHeight: "120px",
                  lineHeight: "1.5",
                  display: "block",
                  transition: "background 1.2s ease",
                }}
                onInput={e => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 120) + "px";
                }}
              />
            </motion.div>
          </div>

          {/* Send button */}
          <motion.button
            onClick={sendMessage}
            disabled={!input.trim() || loading || silenceMode}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
            style={{
              background: input.trim() && !loading && !silenceMode ? "#C4516A" : "rgba(130,77,105,0.2)",
              boxShadow: input.trim() && !loading && !silenceMode ? "0 4px 18px rgba(196,81,106,0.4)" : "none",
              transition: "background 0.2s ease, box-shadow 0.2s ease",
            }}
            whileTap={{
              scale: 1.22,
              boxShadow: "0 0 28px rgba(196,81,106,0.7)",
              transition: { type: "spring", damping: 10, stiffness: 400 },
            } as never}
          >
            <Send size={18} color={input.trim() && !loading && !silenceMode ? "#FAE5D8" : "#824D69"} strokeWidth={1.5} />
          </motion.button>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        currentConvId={isGhostMode ? null : currentConv.id}
        silenceMode={silenceMode}
        listenMode={listenMode}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onGhostChat={handleGhostChat}
        onSelectConversation={handleSelectConversation}
        onSilenceModeChange={v => { setSilenceModeState(v); setSilenceMode(v); }}
        onListenModeChange={v => { setListenModeState(v); setListenMode(v); }}
      />

      {/* Exercise menu */}
      <ExerciseMenu isOpen={showExerciseMenu} onClose={() => setShowExerciseMenu(false)} onSelect={handleExercise} />

      {/* Modals */}
      <AnimatePresence>
        {showCheckin && <CheckInModal userName={prefs?.name} onClose={() => setShowCheckin(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {activeModal === "breathe" && <BreathingExercise onClose={() => setActiveModal(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {activeModal === "wave" && <WaveBreathing onClose={() => setActiveModal(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {activeModal === "butterfly" && <ButterflyHug onClose={() => setActiveModal(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {activeModal === "hum" && <HumWithMe onClose={() => setActiveModal(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {activeModal === "braindump" && (
          <BrainDump
            onClose={() => setActiveModal(null)}
            onResponse={msg => { addMessage({ role: "assistant", content: msg }, isGhostMode); setActiveModal(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
