# Solace — Mental Health Companion

A warm, empathetic mental health companion web app powered by Groq's Llama 3 70B.

**Tagline:** "Always here with you, on the days you feel the heaviest."

## Architecture

### Monorepo structure
- `artifacts/solace` — React + Vite frontend (`@workspace/solace`)
- `artifacts/api-server` — Node.js + Express backend (`@workspace/api-server`)

### Tech Stack
- **Frontend:** React, Tailwind CSS v4, Framer Motion, Wouter (routing), TanStack Query
- **Backend:** Express 5, Pino logging
- **AI:** Groq API — `llama3-70b-8192` model
- **Storage:** localStorage (moods, preferences, chat history)

## Features

1. **Landing Page** — animated deep navy gradient, moon logo, tagline, CTA
2. **Onboarding** — 3-step flow: name (optional), tone preference, check-in time
3. **Chat Interface** — warm chat bubbles, AI-powered via Groq, typing indicator, quick actions
4. **Daily Check-In** — mood taps (😊😐😔😰), time-gated per preferences, AI warm response
5. **Silent Pattern Tracking** — detects 4+ negative days in 7 and gently surfaces it
6. **No-Guilt Skip Policy** — check-in modal dismissible, no follow-up spam
7. **Crisis Detection** — 3-tier system (mild/moderate/high) with crisis resources box
8. **Breathing Exercise** — animated circle, box breathing (4-4-4), 3 cycles
9. **Grounding Exercise** — 5-4-3-2-1 method, step-by-step in chat
10. **Psychoeducation** — conversational snippets on panic attacks, anxiety, grounding
11. **Mood History** — 7-day bar chart, emoji timeline, day-by-day list, stats

## Routes

### Frontend (wouter)
- `/` — Landing
- `/onboarding` — Onboarding wizard
- `/chat` — Main chat interface
- `/mood` — Mood history

### Backend API (`/api`)
- `GET /api/healthz` — Health check
- `POST /api/chat` — Send message, get AI response + crisis level
- `POST /api/checkin/respond` — Submit mood check-in, get warm response

## Environment Variables / Secrets
- `GROQ_API_KEY` — Groq API key (required for AI)
- `SESSION_SECRET` — Express session secret
- `PORT` — Auto-assigned per artifact by Replit

## Key Files
- `artifacts/solace/src/lib/storage.ts` — localStorage helpers (prefs, moods, messages)
- `artifacts/solace/src/lib/api.ts` — API client
- `artifacts/solace/src/pages/Chat.tsx` — Main chat page with all features
- `artifacts/api-server/src/routes/chat.ts` — Chat route with crisis detection
- `artifacts/api-server/src/routes/checkin.ts` — Check-in route with pattern detection

## Design
- **Colors:** Deep navy background, soft lavender primary (hsl 252), warm white surfaces
- **Font:** Inter
- **Animations:** Framer Motion throughout — entrance, chat bubbles, breathing circle
- **Mobile-first:** max-w-sm/lg containers, responsive layout
