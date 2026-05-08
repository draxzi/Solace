import { motion } from "framer-motion";
import { X } from "lucide-react";

interface Props {
  level: "mild" | "moderate" | "high";
  onDismiss: () => void;
}

const CRISIS_RESOURCES = [
  { name: "iCall (TISS)", number: "9152987821", desc: "Mon–Sat, 8am–10pm" },
  { name: "Vandrevala Foundation", number: "1860-2662-345", desc: "24/7 support" },
  { name: "AASRA", number: "9820466627", desc: "24/7 helpline" },
];

export default function CrisisBox({ level, onDismiss }: Props) {
  if (level === "mild") return null;

  return (
    <motion.div
      className="mx-3 mb-3 rounded-2xl p-4 border"
      style={{
        background: "rgba(42,17,75,0.9)",
        borderColor: "rgba(220,88,109,0.3)",
        boxShadow: "0 4px 24px rgba(24,0,24,0.5)",
      }}
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: "#FAE5D8" }}>
            {level === "high" ? "You're not alone" : "I'm here with you"}
          </p>
          {level === "high" && (
            <p className="text-xs mt-1" style={{ color: "#DFB6B2" }}>
              You don't have to go through this alone. Want me to stay with you while you reach out?
            </p>
          )}
        </div>
        <button onClick={onDismiss} className="w-6 h-6 rounded-full flex items-center justify-center ml-2 flex-shrink-0"
          style={{ background: "rgba(130,77,105,0.2)" }}>
          <X size={12} color="#FAE5D8" strokeWidth={1.5} />
        </button>
      </div>

      {level === "high" && (
        <div className="flex flex-col gap-2.5">
          {CRISIS_RESOURCES.map(r => (
            <div
              key={r.number}
              className="flex items-center justify-between rounded-2xl px-3 py-2.5"
              style={{ background: "rgba(24,0,24,0.4)", border: "1px solid rgba(130,77,105,0.2)" }}
            >
              <div>
                <p className="text-xs font-semibold" style={{ color: "#FAE5D8" }}>{r.name}</p>
                <p className="text-xs" style={{ color: "#DFB6B2" }}>{r.desc}</p>
              </div>
              <a
                href={`tel:${r.number.replace(/-/g, "")}`}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl ml-2 flex-shrink-0"
                style={{ background: "#C4516A", color: "#FAE5D8" }}
              >
                Call Now
              </a>
            </div>
          ))}
          <div
            className="flex items-center justify-between rounded-2xl px-3 py-2.5"
            style={{ background: "rgba(24,0,24,0.4)", border: "1px solid rgba(130,77,105,0.2)" }}
          >
            <div>
              <p className="text-xs font-semibold" style={{ color: "#FAE5D8" }}>iCall Chat</p>
              <p className="text-xs" style={{ color: "#DFB6B2" }}>For those who can't speak out loud</p>
            </div>
            <a
              href="https://icallhelpline.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl ml-2 flex-shrink-0"
              style={{ background: "#C4516A", color: "#FAE5D8" }}
            >
              Chat
            </a>
          </div>
        </div>
      )}

      {level === "moderate" && (
        <p className="text-xs" style={{ color: "#DFB6B2" }}>
          I'm a little worried about you right now — are you safe? I'm here with you, and it's okay to take your time.
        </p>
      )}
    </motion.div>
  );
}
