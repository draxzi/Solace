import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  getConversations, deleteConversation,
  setSilenceMode, setListenMode,
  getPinnedConvIds, pinConversation, unpinConversation,
} from "@/lib/storage";
import type { Conversation } from "@/lib/storage";
import { Plus, Ghost, Sparkles, VolumeX, Ear, X, Moon, Star, Trash2, MoreHorizontal } from "lucide-react";

interface Props {
  isOpen: boolean;
  currentConvId: string | null;
  silenceMode: boolean;
  listenMode: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onGhostChat: () => void;
  onSelectConversation: (conv: Conversation) => void;
  onSilenceModeChange: (on: boolean) => void;
  onListenModeChange: (on: boolean) => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d >= today) return "Today";
  if (d >= yesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Toggle({ on, onToggle, label, icon: Icon }: {
  on: boolean;
  onToggle: () => void;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}) {
  return (
    <motion.button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-sm transition-all"
      style={{
        background: on ? "rgba(220,88,109,0.15)" : "rgba(130,77,105,0.1)",
        border: `1.5px solid ${on ? "rgba(220,88,109,0.35)" : "rgba(130,77,105,0.2)"}`,
      }}
      whileTap={{ scale: 0.97 }}
    >
      <Icon size={20} color={on ? "#C4516A" : "#FAE5D8"} strokeWidth={1.5} />
      <span className="flex-1 text-left font-medium" style={{ color: on ? "#FAE5D8" : "#DFB6B2" }}>
        {label}
      </span>
      <motion.div
        className="relative flex-shrink-0"
        style={{ width: 40, height: 22, borderRadius: 11, background: on ? "#C4516A" : "rgba(130,77,105,0.3)" }}
        animate={{ background: on ? "#C4516A" : "rgba(130,77,105,0.3)" }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="absolute rounded-full bg-white"
          style={{ width: 18, height: 18, top: 2, boxShadow: "0 1px 4px rgba(24,0,24,0.4)" }}
          animate={{ left: on ? 20 : 2 }}
          transition={{ type: "spring", damping: 22, stiffness: 400 }}
        />
      </motion.div>
    </motion.button>
  );
}

// ── Single conversation row ────────────────────────────────────────────────────

interface ConvItemProps {
  conv: Conversation;
  index: number;
  isPinned: boolean;
  isActive: boolean;
  isRevealed: boolean;
  confirmingDelete: boolean;
  onSelect: () => void;
  onReveal: (id: string | null) => void;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
}

function ConvItem({
  conv, index, isPinned, isActive, isRevealed, confirmingDelete,
  onSelect, onReveal, onRequestDelete, onConfirmDelete, onCancelDelete,
  onPin, onUnpin,
}: ConvItemProps) {
  const touchStart = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didSwipe = useRef(false);

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]!;
    touchStart.current = { x: t.clientX, y: t.clientY };
    didSwipe.current = false;
    longPressTimer.current = setTimeout(() => {
      onReveal(isRevealed ? null : conv.id);
    }, 500);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const t = e.touches[0]!;
    const dx = touchStart.current.x - t.clientX;
    const dy = Math.abs(touchStart.current.y - t.clientY);
    if (dy > 12) { clearLongPress(); return; }
    if (dx > 12) { clearLongPress(); didSwipe.current = true; }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    clearLongPress();
    if (didSwipe.current) {
      const t = e.changedTouches[0]!;
      const dx = touchStart.current.x - t.clientX;
      if (dx > 48) onReveal(isRevealed ? null : conv.id);
    }
    didSwipe.current = false;
  }

  // Soft delete confirmation row
  if (confirmingDelete) {
    return (
      <motion.div
        className="rounded-2xl px-3 py-3"
        style={{ background: "rgba(196,81,106,0.1)", border: "1px solid rgba(196,81,106,0.2)" }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.22 }}
      >
        <p className="text-xs mb-2.5" style={{ color: "#DFB6B2" }}>
          Remove this conversation? It can't be undone.
        </p>
        <div className="flex gap-2">
          <motion.button
            onClick={() => onConfirmDelete(conv.id)}
            className="flex-1 py-2 rounded-xl text-xs font-medium"
            style={{ background: "rgba(196,81,106,0.25)", color: "#FAE5D8" }}
            whileTap={{ scale: 0.96 }}
          >
            Yes, remove it
          </motion.button>
          <motion.button
            onClick={onCancelDelete}
            className="flex-1 py-2 rounded-xl text-xs font-medium"
            style={{ background: "rgba(130,77,105,0.2)", color: "#DFB6B2" }}
            whileTap={{ scale: 0.96 }}
          >
            Keep it
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative rounded-2xl overflow-hidden"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Action buttons — slide in from right */}
      <AnimatePresence>
        {isRevealed && (
          <motion.div
            className="absolute right-0 top-0 bottom-0 flex items-center gap-1.5 px-2 z-10"
            style={{
              background: "linear-gradient(90deg, transparent 0%, #1D1A39 28%)",
              minWidth: 88,
            }}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ type: "spring", damping: 24, stiffness: 320 }}
          >
            {/* Pin / unpin */}
            <motion.button
              onClick={e => { e.stopPropagation(); isPinned ? onUnpin(conv.id) : onPin(conv.id); }}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: isPinned ? "rgba(232,168,130,0.25)" : "rgba(130,77,105,0.25)",
                border: `1px solid ${isPinned ? "rgba(232,168,130,0.4)" : "rgba(130,77,105,0.35)"}`,
              }}
              whileTap={{ scale: 0.88 }}
              title={isPinned ? "Unpin" : "Pin"}
            >
              <Star
                size={13}
                color={isPinned ? "#E8A882" : "#824D69"}
                strokeWidth={1.5}
                fill={isPinned ? "#E8A882" : "none"}
              />
            </motion.button>

            {/* Delete */}
            <motion.button
              onClick={e => { e.stopPropagation(); onRequestDelete(conv.id); onReveal(null); }}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(196,81,106,0.2)",
                border: "1px solid rgba(196,81,106,0.3)",
              }}
              whileTap={{ scale: 0.88 }}
              title="Delete"
            >
              <Trash2 size={13} color="#C4516A" strokeWidth={1.5} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main row */}
      <motion.div
        className="flex items-start gap-2 px-3 py-3 cursor-pointer"
        style={{
          background: isActive ? "rgba(220,88,109,0.12)" : "transparent",
          border: isActive ? "1px solid rgba(220,88,109,0.2)" : "1px solid transparent",
          borderRadius: "inherit",
        }}
        animate={{ x: isRevealed ? -88 : 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        onClick={() => { if (!isRevealed) onSelect(); }}
        whileHover={!isRevealed ? { background: isActive ? "rgba(220,88,109,0.12)" : "rgba(130,77,105,0.12)" } as never : {}}
      >
        {/* Pin star indicator */}
        {isPinned && (
          <Star
            size={10}
            color="#E8A882"
            strokeWidth={1.5}
            fill="#E8A882"
            style={{ flexShrink: 0, marginTop: 3 }}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs font-semibold" style={{ color: "#C4516A" }}>
              {formatDate(conv.updatedAt)}
            </p>
            {isActive && (
              <span className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(220,88,109,0.2)", color: "#C4516A" }}>
                active
              </span>
            )}
          </div>
          <p className="text-xs truncate" style={{ color: "#DFB6B2" }}>
            {conv.preview || "Conversation with Solace"}
          </p>
        </div>

        {/* More button — desktop reveal trigger */}
        <motion.button
          onClick={e => { e.stopPropagation(); onReveal(isRevealed ? null : conv.id); }}
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: "rgba(130,77,105,0.15)" }}
          whileTap={{ scale: 0.88 }}
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 } as never}
          animate={{ opacity: isRevealed ? 1 : undefined }}
        >
          <MoreHorizontal size={11} color="#824D69" strokeWidth={2} />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Main sidebar ───────────────────────────────────────────────────────────────

export default function Sidebar({
  isOpen, currentConvId, silenceMode, listenMode,
  onClose, onNewChat, onGhostChat, onSelectConversation,
  onSilenceModeChange, onListenModeChange,
}: Props) {
  const [, navigate] = useLocation();
  const [convs, setConvs] = useState<Conversation[]>(() =>
    getConversations().filter(c => c.messages.length > 0)
  );
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => getPinnedConvIds());
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pinLimitMsg, setPinLimitMsg] = useState(false);
  const pinLimitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close revealed row when sidebar closes
  useEffect(() => {
    if (!isOpen) { setRevealedId(null); setConfirmDeleteId(null); }
  }, [isOpen]);

  // Auto-dismiss pin-limit message
  function showPinLimit() {
    setPinLimitMsg(true);
    if (pinLimitTimer.current) clearTimeout(pinLimitTimer.current);
    pinLimitTimer.current = setTimeout(() => setPinLimitMsg(false), 3500);
  }

  function handleDelete(id: string) {
    deleteConversation(id);
    unpinConversation(id);
    const newPinned = getPinnedConvIds();
    setPinnedIds(newPinned);
    setConvs(prev => prev.filter(c => c.id !== id));
    setConfirmDeleteId(null);
  }

  function handlePin(id: string) {
    const ok = pinConversation(id);
    if (!ok) { showPinLimit(); return; }
    setPinnedIds(getPinnedConvIds());
    setRevealedId(null);
  }

  function handleUnpin(id: string) {
    unpinConversation(id);
    setPinnedIds(getPinnedConvIds());
    setRevealedId(null);
  }

  function handleSelect(conv: Conversation) {
    onSelectConversation(conv);
    onClose();
  }

  function handleNewChat() {
    setConvs(getConversations().filter(c => c.messages.length > 0));
    onNewChat();
    onClose();
  }

  function handleGhostChat() {
    onGhostChat();
    onClose();
  }

  function handleSilence() {
    const next = !silenceMode;
    setSilenceMode(next);
    onSilenceModeChange(next);
    if (next) { setListenMode(false); onListenModeChange(false); }
    onClose();
  }

  function handleListen() {
    const next = !listenMode;
    setListenMode(next);
    onListenModeChange(next);
    if (next) { setSilenceMode(false); onSilenceModeChange(false); }
    onClose();
  }

  // Sort: pinned first (in pin order), then unpinned by date
  const pinnedConvs = pinnedIds
    .map(id => convs.find(c => c.id === id))
    .filter(Boolean) as Conversation[];
  const unpinnedConvs = convs
    .filter(c => !pinnedIds.includes(c.id))
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const sortedConvs = [...pinnedConvs, ...unpinnedConvs];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(24,0,24,0.6)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed top-0 left-0 bottom-0 z-50 flex flex-col"
            style={{
              width: "min(300px, 82vw)",
              background: "#1D1A39",
              boxShadow: "4px 0 40px rgba(24,0,24,0.7)",
              borderRight: "1px solid rgba(130,77,105,0.2)",
            }}
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(130,77,105,0.2)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(220,88,109,0.2)", border: "1px solid rgba(220,88,109,0.3)" }}>
                  <Moon size={16} color="#C4516A" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "#FAE5D8" }}>Solace</p>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(130,77,105,0.2)" }}>
                <X size={16} color="#FAE5D8" strokeWidth={1.5} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 min-h-0 overflow-y-auto solace-scroll">
              {/* Chat action buttons */}
              <div className="px-4 pt-3 pb-2 flex flex-col gap-2">
                <motion.button
                  onClick={handleNewChat}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold"
                  style={{ background: "#C4516A", color: "#FAE5D8", boxShadow: "0 4px 20px rgba(220,88,109,0.3)" }}
                  whileHover={{ background: "#A33757" } as never}
                  whileTap={{ scale: 0.97 }}
                >
                  <Plus size={20} color="#FAE5D8" strokeWidth={1.5} />
                  New Chat
                </motion.button>

                <motion.button
                  onClick={handleGhostChat}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium"
                  style={{
                    background: "rgba(130,77,105,0.1)",
                    border: "1.5px dashed rgba(130,77,105,0.4)",
                    color: "#DFB6B2",
                  }}
                  whileHover={{ background: "rgba(130,77,105,0.2)" } as never}
                  whileTap={{ scale: 0.97 }}
                >
                  <Ghost size={20} color="#DFB6B2" strokeWidth={1.5} />
                  Private Chat
                  <span className="ml-auto text-xs font-normal" style={{ color: "#824D69" }}>no trace</span>
                </motion.button>
              </div>

              {/* Soul Space link */}
              <div className="px-4 pb-2">
                <motion.button
                  onClick={() => { navigate("/soul"); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium"
                  style={{
                    background: "rgba(255,187,148,0.08)",
                    border: "1px solid rgba(255,187,148,0.15)",
                    color: "#E8A882",
                  }}
                  whileHover={{ background: "rgba(255,187,148,0.14)" } as never}
                  whileTap={{ scale: 0.97 }}
                >
                  <Sparkles size={20} color="#E8A882" strokeWidth={1.5} />
                  Soul Space
                  <span className="ml-auto text-xs font-normal" style={{ color: "rgba(255,187,148,0.5)" }}>sanctuary</span>
                </motion.button>
              </div>

              {/* Mode toggles */}
              <div className="px-4 pb-2 flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider px-1 mt-1 mb-1"
                  style={{ color: "#824D69" }}>
                  Presence Modes
                </p>
                <Toggle on={silenceMode} onToggle={handleSilence} label="Silence Mode" icon={VolumeX} />
                <Toggle on={listenMode} onToggle={handleListen} label="Just Listen" icon={Ear} />
                {silenceMode && (
                  <motion.p className="text-xs px-3 pb-1" style={{ color: "#DFB6B2" }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    Solace is here. Just sitting with you.
                  </motion.p>
                )}
                {listenMode && (
                  <motion.p className="text-xs px-3 pb-1" style={{ color: "#DFB6B2" }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    Solace will only say "I hear you 🤍".
                  </motion.p>
                )}
              </div>

              {/* Conversation history */}
              {sortedConvs.length > 0 && (
                <div className="px-4 pb-6">
                  <div className="flex items-center justify-between px-1 mt-2 mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "#824D69" }}>
                      History
                    </p>
                    <p className="text-xs" style={{ color: "rgba(130,77,105,0.6)" }}>
                      swipe or hold to manage
                    </p>
                  </div>

                  {/* Pin limit message */}
                  <AnimatePresence>
                    {pinLimitMsg && (
                      <motion.div
                        className="mb-2 px-3 py-2 rounded-xl"
                        style={{ background: "rgba(232,168,130,0.1)", border: "1px solid rgba(232,168,130,0.2)" }}
                        initial={{ opacity: 0, y: -6, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="text-xs leading-relaxed" style={{ color: "#E8A882" }}>
                          You can only pin 2 conversations. Unpin one to pin this.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Pinned label */}
                  <AnimatePresence>
                    {pinnedConvs.length > 0 && (
                      <motion.div
                        className="flex items-center gap-1.5 px-1 mb-1.5"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      >
                        <Star size={9} color="#E8A882" strokeWidth={1.5} fill="#E8A882" />
                        <p className="text-xs" style={{ color: "rgba(232,168,130,0.6)", letterSpacing: "0.06em" }}>
                          pinned
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-col gap-1.5">
                    <AnimatePresence>
                      {sortedConvs.map((conv, i) => {
                        const isFirst = i === pinnedConvs.length && unpinnedConvs.length > 0 && pinnedConvs.length > 0;
                        return (
                          <div key={conv.id}>
                            {/* Divider between pinned and unpinned */}
                            {isFirst && (
                              <motion.div
                                className="my-2"
                                style={{ height: 1, background: "rgba(130,77,105,0.15)" }}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              />
                            )}
                            <ConvItem
                              conv={conv}
                              index={i}
                              isPinned={pinnedIds.includes(conv.id)}
                              isActive={conv.id === currentConvId}
                              isRevealed={revealedId === conv.id}
                              confirmingDelete={confirmDeleteId === conv.id}
                              onSelect={() => handleSelect(conv)}
                              onReveal={setRevealedId}
                              onRequestDelete={id => { setConfirmDeleteId(id); }}
                              onConfirmDelete={handleDelete}
                              onCancelDelete={() => setConfirmDeleteId(null)}
                              onPin={handlePin}
                              onUnpin={handleUnpin}
                            />
                          </div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(130,77,105,0.2)" }}>
              <p className="text-xs text-center leading-relaxed" style={{ color: "#824D69" }}>
                All chats are stored locally<br />on your device only.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
