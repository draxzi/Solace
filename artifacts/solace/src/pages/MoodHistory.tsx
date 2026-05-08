import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { getLast7Moods, getMoods } from "@/lib/storage";
import { ChevronLeft, BarChart2 } from "lucide-react";

const MOOD_CONFIG = {
  good:     { label: "Good",      color: "#E8A882",  bg: "rgba(255,187,148,0.12)" },
  meh:      { label: "Meh",       color: "#DFB6B2",  bg: "rgba(223,182,178,0.12)" },
  notgreat: { label: "Not great", color: "#C4516A",  bg: "rgba(220,88,109,0.12)" },
  rough:    { label: "Rough day", color: "#824D69",  bg: "rgba(130,77,105,0.15)" },
} as const;

const MOOD_SCORE: Record<string, number> = { good: 4, meh: 3, notgreat: 2, rough: 1 };
const MOOD_DOT: Record<string, string> = { good: "●", meh: "●", notgreat: "●", rough: "●" };

function getDayLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

export default function MoodHistory() {
  const [, navigate] = useLocation();
  const last7 = getLast7Moods();
  const allMoods = getMoods();

  const days: { date: string; mood?: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0]!;
    const entry = last7.find(m => m.date === dateStr);
    days.push({ date: dateStr, mood: entry?.mood });
  }

  const loggedCount = days.filter(d => d.mood).length;
  const positiveCount = days.filter(d => d.mood === "good" || d.mood === "meh").length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#180018" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-4 border-b flex-shrink-0"
        style={{ background: "#1D1A39", borderColor: "rgba(130,77,105,0.25)", boxShadow: "0 1px 16px rgba(24,0,24,0.5)" }}
      >
        <button
          onClick={() => navigate("/chat")}
          className="w-9 h-9 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(130,77,105,0.2)" }}
        >
          <ChevronLeft size={20} color="#FAE5D8" strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-2.5">
          <BarChart2 size={20} color="#C4516A" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#FAE5D8" }}>Mood Journal</p>
            <p className="text-xs" style={{ color: "#DFB6B2" }}>Last 7 days</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 solace-scroll">
        <div className="max-w-sm mx-auto flex flex-col gap-5">

          {/* 7-day timeline */}
          <motion.div
            className="rounded-2xl p-4"
            style={{ background: "#2A114B", border: "1px solid rgba(130,77,105,0.2)", boxShadow: "0 2px 20px rgba(24,0,24,0.4)" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#824D69" }}>This week</p>
            <div className="flex items-end justify-between gap-1.5">
              {days.map((day, i) => {
                const cfg = day.mood ? MOOD_CONFIG[day.mood as keyof typeof MOOD_CONFIG] : null;
                const score = day.mood ? MOOD_SCORE[day.mood] ?? 0 : 0;
                const barHeight = day.mood ? 20 + score * 18 : 12;

                return (
                  <div key={day.date} className="flex flex-col items-center gap-1.5 flex-1">
                    <motion.div
                      className="w-full rounded-xl"
                      style={{
                        height: barHeight,
                        background: cfg ? cfg.bg : "rgba(130,77,105,0.12)",
                        border: cfg ? `1px solid ${cfg.color}30` : "1px solid rgba(130,77,105,0.15)",
                        minWidth: 0,
                      }}
                      initial={{ scaleY: 0, originY: 1 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.5, delay: i * 0.07 }}
                    />
                    <span style={{ fontSize: "10px", color: "#824D69" }}>
                      {getDayLabel(day.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              className="rounded-2xl p-4 text-center"
              style={{ background: "#2A114B", border: "1px solid rgba(130,77,105,0.2)" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <p className="text-2xl font-bold" style={{ color: "#C4516A" }}>{loggedCount}/7</p>
              <p className="text-xs mt-1" style={{ color: "#DFB6B2" }}>days logged</p>
            </motion.div>
            <motion.div
              className="rounded-2xl p-4 text-center"
              style={{ background: "#2A114B", border: "1px solid rgba(130,77,105,0.2)" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <p className="text-2xl font-bold" style={{ color: "#E8A882" }}>{loggedCount > 0 ? Math.round((positiveCount / loggedCount) * 100) : 0}%</p>
              <p className="text-xs mt-1" style={{ color: "#DFB6B2" }}>positive days</p>
            </motion.div>
          </div>

          {/* Day list */}
          <motion.div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#2A114B", border: "1px solid rgba(130,77,105,0.2)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider px-4 pt-4 pb-2" style={{ color: "#824D69" }}>Day by day</p>
            {days.map((day, i) => {
              const cfg = day.mood ? MOOD_CONFIG[day.mood as keyof typeof MOOD_CONFIG] : null;
              return (
                <div
                  key={day.date}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderTop: i > 0 ? "1px solid rgba(130,77,105,0.15)" : "none" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-center">
                      {cfg ? (
                        <span style={{ color: cfg.color, fontSize: 18 }}>{MOOD_DOT[day.mood!]}</span>
                      ) : (
                        <span style={{ color: "rgba(130,77,105,0.4)", fontSize: 14 }}>—</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#FAE5D8" }}>{getDayLabel(day.date)}</p>
                      <p className="text-xs" style={{ color: "#824D69" }}>{day.date}</p>
                    </div>
                  </div>
                  {cfg ? (
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}
                    >
                      {cfg.label}
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: "#824D69" }}>no check-in</span>
                  )}
                </div>
              );
            })}
          </motion.div>

          {allMoods.length > 7 && (
            <p className="text-center text-xs pb-4" style={{ color: "#824D69" }}>
              {allMoods.length} total check-ins recorded
            </p>
          )}

          {loggedCount === 0 && (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: "rgba(130,77,105,0.15)" }}>
                <BarChart2 size={20} color="#824D69" strokeWidth={1.5} />
              </div>
              <p className="text-sm mb-1" style={{ color: "#DFB6B2" }}>No check-ins yet this week.</p>
              <p className="text-xs mb-4" style={{ color: "#824D69" }}>They'll show up here as you check in each day.</p>
              <button
                onClick={() => navigate("/chat")}
                className="px-5 py-2.5 rounded-2xl text-sm font-medium"
                style={{ background: "#C4516A", color: "#FAE5D8" }}
              >
                Go talk to Solace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
