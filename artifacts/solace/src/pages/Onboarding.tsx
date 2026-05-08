import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { savePrefs } from "@/lib/storage";
import type { UserPrefs } from "@/lib/storage";

const STEPS = ["name", "tone", "checkin"] as const;

export default function Onboarding() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<Partial<UserPrefs>>({
    name: "",
    tone: "balanced",
    checkinTime: "evening",
  });

  function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      const final: UserPrefs = {
        name: prefs.name ?? "",
        tone: prefs.tone ?? "balanced",
        checkinTime: prefs.checkinTime ?? "evening",
        onboardingDone: true,
      };
      savePrefs(final);
      navigate("/chat");
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(160deg, #1D1A39 0%, #180018 100%)" }}
    >
      {/* Progress dots */}
      <div className="flex gap-2 mb-10">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-500"
            style={{
              width: i === step ? 24 : 8,
              height: 8,
              background: i <= step ? "#C4516A" : "rgba(130,77,105,0.4)"
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <StepCard key="name">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#C4516A" }}>Welcome</p>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#FAE5D8" }}>What should I call you?</h2>
            <p className="text-sm mb-6" style={{ color: "#DFB6B2" }}>Totally optional — you can stay anonymous if you prefer.</p>
            <input
              type="text"
              placeholder="Your name (or leave blank)"
              value={prefs.name}
              onChange={e => setPrefs(p => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all"
              style={{
                background: "rgba(42,17,75,0.8)",
                border: "1.5px solid rgba(130,77,105,0.4)",
                color: "#FAE5D8",
              }}
              onFocus={e => (e.target.style.borderColor = "#C4516A")}
              onBlur={e => (e.target.style.borderColor = "rgba(130,77,105,0.4)")}
              maxLength={40}
            />
            <NextButton onClick={next} label={prefs.name?.trim() ? `Hello, ${prefs.name}` : "Continue anonymously"} />
          </StepCard>
        )}

        {step === 1 && (
          <StepCard key="tone">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#C4516A" }}>Communication</p>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#FAE5D8" }}>How would you like me to talk to you?</h2>
            <p className="text-sm mb-6" style={{ color: "#DFB6B2" }}>I'll match whatever feels right for you.</p>
            <div className="flex flex-col gap-3">
              {([
                { value: "warm", label: "Warm & Gentle", desc: "Soft, nurturing, and emotionally supportive" },
                { value: "direct", label: "Direct & Practical", desc: "Clear, concise, with actionable thoughts" },
                { value: "balanced", label: "Somewhere In Between", desc: "A natural blend of warmth and clarity" },
              ] as const).map(opt => (
                <ToneCard
                  key={opt.value}
                  selected={prefs.tone === opt.value}
                  onClick={() => setPrefs(p => ({ ...p, tone: opt.value }))}
                  label={opt.label}
                  desc={opt.desc}
                />
              ))}
            </div>
            <NextButton onClick={next} label="That's me" />
          </StepCard>
        )}

        {step === 2 && (
          <StepCard key="checkin">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#C4516A" }}>Check-ins</p>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#FAE5D8" }}>When should I check in?</h2>
            <p className="text-sm mb-6" style={{ color: "#DFB6B2" }}>I'll gently check in on you — no pressure, no guilt if you skip.</p>
            <div className="flex flex-col gap-3">
              {([
                { value: "morning", label: "Morning", desc: "Start the day with a gentle hello" },
                { value: "evening", label: "Evening", desc: "Wind down and reflect at the end of the day" },
                { value: "both", label: "Both", desc: "Morning and evening, whenever you need" },
              ] as const).map(opt => (
                <ToneCard
                  key={opt.value}
                  selected={prefs.checkinTime === opt.value}
                  onClick={() => setPrefs(p => ({ ...p, checkinTime: opt.value }))}
                  label={opt.label}
                  desc={opt.desc}
                />
              ))}
            </div>
            <NextButton onClick={next} label="Let's begin" />
          </StepCard>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="w-full max-w-sm"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function ToneCard({ selected, onClick, label, desc }: {
  selected: boolean;
  onClick: () => void;
  label: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3.5 rounded-2xl border-2 transition-all duration-200"
      style={{
        borderColor: selected ? "#C4516A" : "rgba(130,77,105,0.35)",
        background: selected ? "rgba(220,88,109,0.12)" : "rgba(42,17,75,0.5)",
      }}
    >
      <p className="text-sm font-semibold" style={{ color: selected ? "#FAE5D8" : "#DFB6B2" }}>{label}</p>
      <p className="text-xs mt-0.5" style={{ color: "rgba(223,182,178,0.6)" }}>{desc}</p>
    </button>
  );
}

function NextButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full mt-6 py-3.5 rounded-2xl text-sm font-semibold"
      style={{ background: "#C4516A", color: "#FAE5D8", boxShadow: "0 4px 20px rgba(220,88,109,0.3)" }}
      whileHover={{ scale: 1.02, background: "#A33757" } as never}
      whileTap={{ scale: 0.98 }}
    >
      {label}
    </motion.button>
  );
}
