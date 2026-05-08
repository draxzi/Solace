export interface UserPrefs {
  name: string;
  tone: "warm" | "direct" | "balanced";
  checkinTime: "morning" | "evening" | "both";
  onboardingDone: boolean;
}

export interface MoodEntry {
  date: string;
  mood: "good" | "meh" | "notgreat" | "rough";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  createdAt: number;
  updatedAt: number;
  preview: string;
  messages: ChatMessage[];
}

export interface MemoryNote {
  id: string;
  content: string;
  date: string;
  referenced: boolean;
}

export interface Letter {
  id: string;
  content: string;
  createdAt: number;
}

export interface MissCard {
  id: string;
  to: string;
  from: string;
  message: string;
  savedAt: number;
}

const PREFS_KEY    = "solace_prefs";
const MOODS_KEY    = "solace_moods";
const MESSAGES_KEY = "solace_messages";
const CHECKIN_KEY  = "solace_last_checkin";
const CONVS_KEY    = "solace_conversations";
const CURRENT_KEY  = "solace_current_conv";
const MEMORY_KEY   = "solace_memory_notes";
const LETTERS_KEY  = "solace_letters";
const SILENCE_KEY  = "solace_silence_mode";
const LISTEN_KEY   = "solace_listen_mode";
const PINNED_KEY   = "solace_pinned_convs";
const MISS_SAVED_KEY = "solace_miss_saved";
const MISS_DRAFT_KEY = "solace_miss_draft";

// ── For Someone You Miss ──────────────────────────────────────────────────────

export function getMissCards(): MissCard[] {
  try { return JSON.parse(localStorage.getItem(MISS_SAVED_KEY) ?? "[]"); }
  catch { return []; }
}
export function saveMissCard(card: MissCard): void {
  const cards = getMissCards();
  const idx = cards.findIndex(c => c.id === card.id);
  if (idx >= 0) cards[idx] = card; else cards.unshift(card);
  localStorage.setItem(MISS_SAVED_KEY, JSON.stringify(cards));
}
export function deleteMissCard(id: string): void {
  localStorage.setItem(MISS_SAVED_KEY, JSON.stringify(getMissCards().filter(c => c.id !== id)));
}
export function getMissDraft(): { to: string; from: string; message: string } | null {
  try { return JSON.parse(localStorage.getItem(MISS_DRAFT_KEY) ?? "null"); }
  catch { return null; }
}
export function saveMissDraft(d: { to: string; from: string; message: string }): void {
  localStorage.setItem(MISS_DRAFT_KEY, JSON.stringify(d));
}

function newId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

// ── User prefs ────────────────────────────────────────────────────────────────

export function getPrefs(): UserPrefs | null {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null"); }
  catch { return null; }
}

export function savePrefs(prefs: UserPrefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// ── Moods ─────────────────────────────────────────────────────────────────────

export function getMoods(): MoodEntry[] {
  try { return JSON.parse(localStorage.getItem(MOODS_KEY) ?? "[]"); }
  catch { return []; }
}

export function saveMood(mood: MoodEntry["mood"]): void {
  const moods = getMoods();
  const today = new Date().toISOString().split("T")[0]!;
  const idx = moods.findIndex(m => m.date === today);
  if (idx >= 0) moods[idx] = { date: today, mood };
  else moods.push({ date: today, mood });
  localStorage.setItem(MOODS_KEY, JSON.stringify(moods.slice(-30)));
}

export function getLast7Moods(): MoodEntry[] {
  return getMoods().slice(-7);
}

export function countNegativeRecentMoods(): number {
  return getLast7Moods().filter(m => m.mood === "notgreat" || m.mood === "rough").length;
}

// ── Check-in ──────────────────────────────────────────────────────────────────

export function getLastCheckinDate(): string | null {
  return localStorage.getItem(CHECKIN_KEY);
}

export function setLastCheckinDate(date: string): void {
  localStorage.setItem(CHECKIN_KEY, date);
}

export function shouldShowCheckin(checkinTime: "morning" | "evening" | "both"): boolean {
  const today = new Date().toISOString().split("T")[0]!;
  if (getLastCheckinDate() === today) return false;
  const hour = new Date().getHours();
  if (checkinTime === "morning") return hour >= 7 && hour < 14;
  if (checkinTime === "evening") return hour >= 17 && hour < 23;
  return (hour >= 7 && hour < 14) || (hour >= 17 && hour < 23);
}

// ── 3AM / Time context ────────────────────────────────────────────────────────

export function is3AMMode(): boolean {
  const h = new Date().getHours();
  return h >= 23 || h < 5;
}

export interface TimeContext {
  period: "latenight" | "morning" | "afternoon" | "evening";
  is3AM: boolean;
  dayName: string;
  dayGreeting: string | null;
}

export function getTimeContext(): TimeContext {
  const hour = new Date().getHours();
  const day  = new Date().getDay(); // 0 = Sun, 1 = Mon … 5 = Fri
  const is3AM = hour >= 23 || hour < 5;

  let period: TimeContext["period"];
  if (is3AM) period = "latenight";
  else if (hour < 12) period = "morning";
  else if (hour < 17) period = "afternoon";
  else period = "evening";

  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const dayName = days[day] ?? "today";

  let dayGreeting: string | null = null;
  if (day === 1) dayGreeting = "Mondays can feel heavy. How are you holding up?";
  if (day === 5) dayGreeting = "Almost the weekend. How has this week been for you?";

  return { period, is3AM, dayName, dayGreeting };
}

export function buildGreeting(name?: string, ghost = false): string {
  if (ghost) {
    return "Nothing you say here will be remembered. This is just for you. Talk freely. 🌫️";
  }
  const { period, is3AM, dayGreeting } = getTimeContext();
  const nameStr = name?.trim() ? `, ${name}` : "";

  if (is3AM) {
    return `Hey${nameStr}. It's late. I'm glad you're here. Whatever brought you here tonight — I'm listening. 🌙`;
  }

  if (dayGreeting) {
    return `${dayGreeting}${nameStr ? ` ${name},` : ""} 🌿`;
  }

  const greetMap: Record<string, string> = {
    morning:   `Good morning${nameStr}. 🌤️ I hope you're starting today gently. How are you feeling?`,
    afternoon: `Hey${nameStr}. 🌿 I'm here — how are you doing this afternoon?`,
    evening:   `Good evening${nameStr}. 🌙 How has your day been? I'm listening.`,
  };
  return greetMap[period] ?? `Hey${nameStr}. 🌙 I'm here. How are you feeling today?`;
}

// ── Memory notes ──────────────────────────────────────────────────────────────

const MEMORY_PATTERNS: RegExp[] = [
  /\b(?:have|got|taking|have my|had)\s+(?:an?\s+)?(?:exam|test|quiz|finals?)\b/i,
  /\b(?:job\s+)?interview\b/i,
  /\b(?:have|got|had)\s+(?:an?\s+)?(?:meeting|appointment|presentation|deadline)\b/i,
  /\b(?:worried|scared|nervous|anxious)\s+about\s+(.{4,40}?)(?:\.|,|$)/i,
  /\b(?:my\s+)?(?:mom|dad|mother|father|sister|brother|friend|partner|boyfriend|girlfriend)\s+(?:is|was|has|have)\b/i,
  /\b(?:I'm|I am)\s+(?:going through|dealing with|struggling with)\s+(.{4,40}?)(?:\.|,|$)/i,
  /\bbreakup\b|\bbreak[\s-]up\b|\bdivorce\b|\bgrieving\b|\blost\s+(?:my|a)\b/i,
];

export function extractMemoryFromMessage(text: string): string | null {
  for (const pattern of MEMORY_PATTERNS) {
    if (pattern.test(text)) {
      const sentence = text.split(/[.!?]/).find(s => pattern.test(s))?.trim();
      return sentence?.slice(0, 80) ?? text.slice(0, 80);
    }
  }
  return null;
}

export function getMemoryNotes(): MemoryNote[] {
  try { return JSON.parse(localStorage.getItem(MEMORY_KEY) ?? "[]"); }
  catch { return []; }
}

export function saveMemoryNote(content: string): void {
  const notes = getMemoryNotes();
  const today = new Date().toISOString().split("T")[0]!;
  const note: MemoryNote = { id: newId(), content, date: today, referenced: false };
  notes.unshift(note);
  localStorage.setItem(MEMORY_KEY, JSON.stringify(notes.slice(0, 20)));
}

export function getUnreferencedMemories(): MemoryNote[] {
  const today = new Date().toISOString().split("T")[0]!;
  return getMemoryNotes().filter(n => !n.referenced && n.date < today);
}

export function markMemoriesReferenced(ids: string[]): void {
  const notes = getMemoryNotes().map(n =>
    ids.includes(n.id) ? { ...n, referenced: true } : n
  );
  localStorage.setItem(MEMORY_KEY, JSON.stringify(notes));
}

export function buildMemoryContext(): string | null {
  const mems = getUnreferencedMemories().slice(0, 3);
  if (mems.length === 0) return null;
  const lines = mems.map(m => `- "${m.content}" (mentioned on ${m.date})`).join("\n");
  return `The user previously mentioned the following. If natural and appropriate, gently reference one of them with warmth:\n${lines}`;
}

// ── Letters ───────────────────────────────────────────────────────────────────

export function getLetters(): Letter[] {
  try { return JSON.parse(localStorage.getItem(LETTERS_KEY) ?? "[]"); }
  catch { return []; }
}

export function saveLetter(letter: Letter): void {
  const letters = getLetters();
  const idx = letters.findIndex(l => l.id === letter.id);
  if (idx >= 0) letters[idx] = letter;
  else letters.unshift(letter);
  localStorage.setItem(LETTERS_KEY, JSON.stringify(letters.slice(0, 50)));
}

export function deleteLetter(id: string): void {
  localStorage.setItem(LETTERS_KEY, JSON.stringify(getLetters().filter(l => l.id !== id)));
}

export function createLetter(): Letter {
  return { id: newId(), content: "", createdAt: Date.now() };
}

// ── Pinned conversations ──────────────────────────────────────────────────────

export function getPinnedConvIds(): string[] {
  try { return JSON.parse(localStorage.getItem(PINNED_KEY) ?? "[]"); }
  catch { return []; }
}

export function setPinnedConvIds(ids: string[]): void {
  localStorage.setItem(PINNED_KEY, JSON.stringify(ids));
}

export function pinConversation(id: string): boolean {
  const pinned = getPinnedConvIds();
  if (pinned.includes(id)) return true;
  if (pinned.length >= 2) return false;
  setPinnedConvIds([...pinned, id]);
  return true;
}

export function unpinConversation(id: string): void {
  setPinnedConvIds(getPinnedConvIds().filter(p => p !== id));
}

// ── Silence / Listen mode ─────────────────────────────────────────────────────

export function getSilenceMode(): boolean {
  return localStorage.getItem(SILENCE_KEY) === "1";
}

export function setSilenceMode(on: boolean): void {
  if (on) localStorage.setItem(SILENCE_KEY, "1");
  else localStorage.removeItem(SILENCE_KEY);
}

export function getListenMode(): boolean {
  return localStorage.getItem(LISTEN_KEY) === "1";
}

export function setListenMode(on: boolean): void {
  if (on) localStorage.setItem(LISTEN_KEY, "1");
  else localStorage.removeItem(LISTEN_KEY);
}

// ── Conversations ─────────────────────────────────────────────────────────────

export function getConversations(): Conversation[] {
  try { return JSON.parse(localStorage.getItem(CONVS_KEY) ?? "[]"); }
  catch { return []; }
}

function writeConversations(convs: Conversation[]): void {
  localStorage.setItem(CONVS_KEY, JSON.stringify(convs));
}

export function saveConversation(conv: Conversation): void {
  const convs = getConversations();
  const idx = convs.findIndex(c => c.id === conv.id);
  if (idx >= 0) convs[idx] = conv;
  else convs.unshift(conv);
  writeConversations(convs.slice(0, 50));
}

export function deleteConversation(id: string): void {
  writeConversations(getConversations().filter(c => c.id !== id));
}

export function getCurrentConversationId(): string | null {
  return localStorage.getItem(CURRENT_KEY);
}

export function setCurrentConversationId(id: string): void {
  localStorage.setItem(CURRENT_KEY, id);
}

export function createConversation(firstMessage?: ChatMessage): Conversation {
  const now = Date.now();
  const conv: Conversation = {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    preview: firstMessage?.content.slice(0, 60) ?? "",
    messages: firstMessage ? [firstMessage] : [],
  };
  saveConversation(conv);
  setCurrentConversationId(conv.id);
  return conv;
}

export function loadCurrentConversation(): Conversation {
  const convs = getConversations();

  if (convs.length === 0) {
    try {
      const raw = localStorage.getItem(MESSAGES_KEY);
      const legacy: ChatMessage[] = raw ? JSON.parse(raw) : [];
      if (legacy.length > 0) {
        const conv: Conversation = {
          id: newId(),
          createdAt: legacy[0]!.timestamp,
          updatedAt: legacy[legacy.length - 1]!.timestamp,
          preview: legacy.find(m => m.role === "user")?.content.slice(0, 60) ?? "",
          messages: legacy,
        };
        saveConversation(conv);
        setCurrentConversationId(conv.id);
        localStorage.removeItem(MESSAGES_KEY);
        return conv;
      }
    } catch { /* ignore */ }
  }

  const currentId = getCurrentConversationId();
  const found = convs.find(c => c.id === currentId);
  if (found) return found;

  if (convs.length > 0) {
    const newest = convs[0]!;
    setCurrentConversationId(newest.id);
    return newest;
  }

  return createConversation();
}

export function getMessages(): ChatMessage[] {
  return loadCurrentConversation().messages;
}

export function saveMessages(messages: ChatMessage[]): void {
  const convs = getConversations();
  const currentId = getCurrentConversationId();
  if (!currentId) return;
  const idx = convs.findIndex(c => c.id === currentId);
  if (idx < 0) return;
  const first = messages.find(m => m.role === "user");
  convs[idx] = {
    ...convs[idx]!,
    messages: messages.slice(-100),
    updatedAt: Date.now(),
    preview: first?.content.slice(0, 60) ?? convs[idx]!.preview,
  };
  writeConversations(convs);
}
