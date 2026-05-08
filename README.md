# Solace — Mental Health Companion

> "Always here with you, on the days you feel the heaviest."

A warm, empathetic mental health companion web app powered by **Groq's Llama 3 70B**. Solace offers gentle AI conversation, mood tracking, breathing exercises, and a private Soul Space — all in a beautiful, mobile-first design.

---

## Features

| Feature | Description |
|---|---|
| **Landing page** | Animated deep navy gradient, moon logo, CTA |
| **Onboarding** | 3-step flow — name, tone preference, check-in time |
| **AI Chat** | Powered by Groq llama3-70b-8192, typing indicator, quick actions |
| **Daily Check-In** | Mood taps 😊😐😔😰, time-gated, AI warm response |
| **Crisis Detection** | 3-tier system (mild / moderate / high) with resource links |
| **Breathing Exercise** | Animated box breathing (4-4-4), 3 cycles |
| **Grounding Exercise** | 5-4-3-2-1 method, step-by-step |
| **Mood History** | 7-day bar chart, emoji timeline, stats |
| **Soul Space** | Private sanctuary with 5 modules (see below) |

### Soul Space Modules

- **Letter to Yourself** — write to your future or past self, private always
- **Thought Reframing** — gently examine a thought that's been weighing on you
- **Grief & Loss Space** — no advice, no fixing, just deep presence
- **Heartbreak & Lonely Souls** — 3 paths (breakup / lonely / missing someone), unsent letters, "What I Loved" reflection, Let It Out mode, and a **Missing You card** composer that generates a shareable link or downloadable image
- **For Someone You Miss** — compose a digital love letter, share via link or image

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion |
| Routing | Wouter |
| Data fetching | TanStack Query |
| Backend | Node.js, Express 5, Pino logging |
| AI | Groq API — `llama3-70b-8192` |
| Storage | localStorage (moods, preferences, chat history) |
| Monorepo | pnpm workspaces |

---

## Project Structure

```
/
├── artifacts/
│   ├── solace/          # React + Vite frontend  (@workspace/solace)
│   │   ├── src/
│   │   │   ├── components/   # UI components
│   │   │   ├── pages/        # Route pages
│   │   │   └── lib/          # API client, storage helpers, utils
│   │   └── public/           # Static assets
│   └── api-server/      # Express backend  (@workspace/api-server)
│       └── src/
│           ├── routes/       # /api/chat, /api/checkin, /api/healthz
│           └── lib/          # Logger
├── lib/                 # Shared workspace libraries
├── scripts/             # Utility scripts
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.base.json
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- A [Groq API key](https://console.groq.com/) (free tier available)

### Installation

```bash
# Clone the repository
git clone https://github.com/draxzi/Solace.git
cd Solace

# Install all dependencies
pnpm install
```

### Environment Variables

Create a `.env` file in `artifacts/api-server/`:

```env
GROQ_API_KEY=your_groq_api_key_here
PORT=8080
```

### Running Locally

```bash
# Start the API server (port 8080)
PORT=8080 pnpm --filter @workspace/api-server run dev

# In a separate terminal — start the frontend (port 5000)
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/solace run dev
```

Open [http://localhost:5000](http://localhost:5000).

### Building for Production

```bash
# Build both packages
pnpm run build
```

---

## API Routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/healthz` | Health check |
| `POST` | `/api/chat` | Send message, receive AI response + crisis level |
| `POST` | `/api/checkin/respond` | Submit mood check-in, get warm response |

---

## Design System

- **Background:** Deep navy `#0D0B1E`
- **Primary accent:** Soft lavender `hsl(252, 60%, 65%)`
- **Heartbreak accent:** Rose `#A33757`
- **Font:** Inter (UI), Georgia (card compositions)
- **Motion:** Framer Motion — entrance animations, chat bubbles, breathing circle
- **Mobile-first:** max-w-sm containers, responsive layout

---

## Privacy

All user data (moods, preferences, chat history, unsent letters) is stored exclusively in **localStorage** in the user's browser. Nothing is sent to any server except the AI chat messages processed via the Groq API. No accounts, no tracking, no analytics.

---

## License

MIT
