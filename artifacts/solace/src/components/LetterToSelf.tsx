import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getLetters, saveLetter, deleteLetter, createLetter } from "@/lib/storage";
import type { Letter } from "@/lib/storage";
import { Mail, X, FileText } from "lucide-react";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export default function LetterToSelf() {
  const [letters, setLetters] = useState<Letter[]>(() => getLetters());
  const [editing, setEditing] = useState<Letter | null>(null);
  const [viewing, setViewing] = useState<Letter | null>(null);
  const [saved, setSaved] = useState(false);

  function startNew() {
    setSaved(false);
    setEditing(createLetter());
    setViewing(null);
  }

  function handleSave() {
    if (!editing || !editing.content.trim()) return;
    saveLetter(editing);
    setLetters(getLetters());
    setSaved(true);
    setTimeout(() => {
      setEditing(null);
      setSaved(false);
    }, 1200);
  }

  function handleView(l: Letter) {
    setViewing(l);
    setEditing(null);
  }

  function handleDelete(id: string) {
    deleteLetter(id);
    setLetters(getLetters());
    if (viewing?.id === id) setViewing(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-center italic"
        style={{ color: "#DFB6B2" }}>
        "Write to yourself. No one else will ever read this."
      </p>

      <motion.button
        onClick={startNew}
        className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
        style={{
          background: "#C4516A",
          color: "#FAE5D8",
          boxShadow: "0 4px 20px rgba(220,88,109,0.25)",
        }}
        whileHover={{ background: "#A33757" } as never}
        whileTap={{ scale: 0.97 }}
      >
        <Mail size={18} color="#FAE5D8" strokeWidth={1.5} />
        Write a new letter
      </motion.button>

      {/* Letter editor */}
      <AnimatePresence>
        {editing && (
          <motion.div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{
              background: "rgba(24,0,24,0.5)",
              border: "1px solid rgba(255,187,148,0.2)",
              boxShadow: "0 4px 20px rgba(24,0,24,0.3)",
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <p className="text-xs font-medium" style={{ color: "#E8A882" }}>
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
            <textarea
              autoFocus
              value={editing.content}
              onChange={e => setEditing({ ...editing, content: e.target.value })}
              placeholder="Dear me..."
              className="w-full resize-none outline-none text-sm leading-relaxed"
              style={{
                background: "transparent",
                color: "#FAE5D8",
                minHeight: 160,
                fontFamily: "Georgia, serif",
              }}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl text-xs"
                style={{ background: "rgba(130,77,105,0.2)", color: "#DFB6B2" }}
              >
                Cancel
              </button>
              <motion.button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl text-xs font-semibold"
                style={{
                  background: saved ? "rgba(255,187,148,0.3)" : "#C4516A",
                  color: "#FAE5D8",
                }}
                animate={{ scale: saved ? [1, 1.1, 1] : 1 } as never}
              >
                {saved ? "✓ Saved" : "Save letter"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View letter */}
      <AnimatePresence>
        {viewing && (
          <motion.div
            className="rounded-2xl p-5 flex flex-col gap-3"
            style={{
              background: "rgba(24,0,24,0.5)",
              border: "1px solid rgba(255,187,148,0.2)",
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: "#E8A882" }}>
                {formatDate(viewing.createdAt)}
              </p>
              <button onClick={() => setViewing(null)} className="text-xs" style={{ color: "#DFB6B2" }}>
                Close
              </button>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: "#FAE5D8", fontFamily: "Georgia, serif" }}>
              {viewing.content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Past letters list */}
      {letters.length > 0 && !editing && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#824D69" }}>
            Past letters
          </p>
          {letters.map((l, i) => (
            <motion.div
              key={l.id}
              className="group flex items-start gap-3 p-3 rounded-2xl cursor-pointer"
              style={{
                background: viewing?.id === l.id ? "rgba(255,187,148,0.08)" : "rgba(130,77,105,0.1)",
                border: "1px solid rgba(130,77,105,0.2)",
              }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleView(l)}
              whileHover={{ background: "rgba(255,187,148,0.1)" } as never}
            >
              <FileText size={18} color="#E8A882" strokeWidth={1.5} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium" style={{ color: "#E8A882" }}>
                  {formatDate(l.createdAt)}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: "#DFB6B2" }}>
                  {l.content.slice(0, 55) || "Empty letter"}…
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleDelete(l.id); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(220,88,109,0.2)" }}
              >
                <X size={10} color="#C4516A" strokeWidth={2} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {letters.length === 0 && !editing && (
        <p className="text-xs text-center py-4" style={{ color: "#824D69" }}>
          No letters yet. Your first one is waiting to be written.
        </p>
      )}
    </div>
  );
}
