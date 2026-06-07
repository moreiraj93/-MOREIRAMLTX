/**
 * MockJ Knowledge Base
 * ─────────────────────
 * Structured knowledge about Jenny Moreira's ecosystem.
 * Expand by adding new entries to KNOWLEDGE_BASE array.
 * Each entry has: id, category, title, keywords[], content
 */

export interface KnowledgeEntry {
  id: string;
  category: KnowledgeCategory;
  title: string;
  keywords: string[];
  content: string;
  lastUpdated?: string;
}

export type KnowledgeCategory =
  | 'projects'
  | 'platforms'
  | 'features'
  | 'branding'
  | 'business'
  | 'technical'
  | 'pricing'
  | 'voice'
  | 'tokens'
  | 'ai';

// ─── CATEGORY METADATA (for UI "Project Brain" panel) ───────────────────────
export const CATEGORY_META: Record<KnowledgeCategory, { label: string; emoji: string; color: string }> = {
  projects:  { label: 'Projects',       emoji: '🚀', color: 'hsl(191 97% 55%)' },
  platforms: { label: 'Platforms',      emoji: '🌐', color: 'hsl(265 80% 65%)' },
  features:  { label: 'Features',       emoji: '⚡', color: 'hsl(38 95% 60%)' },
  branding:  { label: 'Branding',       emoji: '🎨', color: 'hsl(328 80% 65%)' },
  business:  { label: 'Business',       emoji: '💼', color: 'hsl(142 70% 50%)' },
  technical: { label: 'Technical',      emoji: '🔧', color: 'hsl(200 80% 60%)' },
  pricing:   { label: 'Pricing',        emoji: '💰', color: 'hsl(38 95% 60%)' },
  voice:     { label: 'Voice Commands', emoji: '🎙️', color: 'hsl(191 97% 55%)' },
  tokens:    { label: 'Tokens',         emoji: '🪙', color: 'hsl(265 80% 65%)' },
  ai:        { label: 'AI Systems',     emoji: '🤖', color: 'hsl(142 70% 50%)' },
};

// ─── BRAIN PANEL TOPIC GROUPS (for "MockJ Project Brain" UI) ─────────────────
export const BRAIN_TOPICS = [
  { id: 'moreiraJ',     label: 'MoreiraJ',      emoji: '⚡', filter: (e: KnowledgeEntry) => e.keywords.some(k => k.includes('moreiraJ') || k.includes('moreira')) },
  { id: 'mltx',        label: 'MLTX',           emoji: '🌐', filter: (e: KnowledgeEntry) => e.keywords.some(k => k.includes('mltx')) },
  { id: 'mockj',       label: 'MockJ AI',       emoji: '🤖', filter: (e: KnowledgeEntry) => e.keywords.some(k => k.includes('mockj')) },
  { id: 'cammy',       label: 'Cammy',          emoji: '🛍️', filter: (e: KnowledgeEntry) => e.keywords.some(k => k.includes('cammy') || k.includes('camme')) },
  { id: 'tokens',      label: 'Tokens',         emoji: '🪙', filter: (e: KnowledgeEntry) => e.category === 'tokens' },
  { id: 'voice',       label: 'Voice Commands', emoji: '🎙️', filter: (e: KnowledgeEntry) => e.category === 'voice' },
];

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM ENTRY HELPERS  (localStorage-backed)
// ─────────────────────────────────────────────────────────────────────────────

const CUSTOM_KB_KEY = 'mockj_custom_knowledge';

export function getCustomEntries(): KnowledgeEntry[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KB_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as KnowledgeEntry[];
  } catch {
    return [];
  }
}

export function saveCustomEntry(entry: Omit<KnowledgeEntry, 'id'>): KnowledgeEntry {
  const all = getCustomEntries();
  const newEntry: KnowledgeEntry = {
    ...entry,
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    lastUpdated: new Date().toISOString().slice(0, 7),
  };
  localStorage.setItem(CUSTOM_KB_KEY, JSON.stringify([...all, newEntry]));
  return newEntry;
}

export function updateCustomEntry(updated: KnowledgeEntry): void {
  const all = getCustomEntries();
  const idx = all.findIndex(e => e.id === updated.id);
  if (idx === -1) return;
  all[idx] = { ...updated, lastUpdated: new Date().toISOString().slice(0, 7) };
  localStorage.setItem(CUSTOM_KB_KEY, JSON.stringify(all));
}

export function deleteCustomEntry(id: string): void {
  const all = getCustomEntries().filter(e => e.id !== id);
  localStorage.setItem(CUSTOM_KB_KEY, JSON.stringify(all));
}

/** Returns static entries merged with localStorage custom entries. */
export function getAllEntries(): KnowledgeEntry[] {
  return [...STATIC_KNOWLEDGE_BASE, ...getCustomEntries()];
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN KNOWLEDGE BASE
// ─────────────────────────────────────────────────────────────────────────────
export const STATIC_KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ── MOREIRAJ ───────────────────────────────────────────────────────────────
  {
    id: 'moreiraJ-overview',
    category: 'projects',
    title: 'MoreiraJ — Overview',
    keywords: ['moreiraJ', 'moreira', 'jenny moreira', 'moreiraJ project', 'moreiraJ app'],
    content: `MoreiraJ is Jenny Moreira's flagship creative platform and personal brand hub. It serves as the central home for her digital identity, projects, and creative work across the MLTX ecosystem. MoreiraJ is positioned as a premium creative AI experience, combining personal branding with AI-powered tools for content, design, and business growth. The platform emphasizes authenticity, creative freedom, and next-generation digital experience. It is deeply integrated with MLTX and powered by MockJ AI for intelligent assistance.`,
    lastUpdated: '2026-06',
  },
  {
    id: 'moreiraJ-features',
    category: 'features',
    title: 'MoreiraJ — Key Features',
    keywords: ['moreiraJ features', 'moreiraJ dashboard', 'moreiraJ tools', 'jenny moreira'],
    content: `MoreiraJ includes: personalized AI dashboard powered by MockJ, content creation tools (AI writing, image generation, video generation), brand management suite, analytics and insights panel, token wallet integration for MLTX tokens, voice command assistant for hands-free operation, and a project portfolio showcase. The platform is designed for creators, entrepreneurs, and anyone building a personal or professional brand in the digital space.`,
    lastUpdated: '2026-06',
  },
  {
    id: 'moreiraJ-branding',
    category: 'branding',
    title: 'MoreiraJ — Brand & Identity',
    keywords: ['moreiraJ branding', 'moreiraJ colors', 'moreiraJ design', 'jenny moreira brand'],
    content: `MoreiraJ brand identity centers on bold, premium aesthetics with a dark tech-forward design language. Primary colors include deep navy/charcoal backgrounds with cyan (hsl 191 97% 55%) and violet (hsl 265 80% 65%) accent system — consistent with MockJ's visual language. Typography uses Space Grotesk for headings and clean sans-serif for body text. The brand voice is confident, creative, and energetic — mirroring Jenny's personal style. Tone: "Built different. Designed to lead."`,
    lastUpdated: '2026-06',
  },

  // ── MLTX ───────────────────────────────────────────────────────────────────
  {
    id: 'mltx-overview',
    category: 'projects',
    title: 'MLTX — Overview',
    keywords: ['mltx', 'mltx ecosystem', 'mltxpro', 'mltx platform', 'creative ai ecosystem'],
    content: `MLTX (also branded as MLTXPRO) is Jenny Moreira's creative AI ecosystem — a suite of interconnected platforms, tools, and services that power modern creators and businesses. MLTX operates as the umbrella brand encompassing MockJ AI, MoreiraJ, Cammy/CAMME, and related services. The ecosystem is built on the principle of "AI for the people" — making powerful AI accessible, fun, and genuinely useful. MLTX is not a token platform per se, though it integrates token-based features. Operator attribution: "Operated by MLTXPRO".`,
    lastUpdated: '2026-06',
  },
  {
    id: 'mltx-mission',
    category: 'business',
    title: 'MLTX — Mission & Goals',
    keywords: ['mltx mission', 'mltx goals', 'mltx vision', 'mltxpro goals'],
    content: `MLTX's mission is to democratize AI-powered creative tools and make them accessible to everyday creators, entrepreneurs, and small businesses. Business goals include: building the go-to AI assistant for creative professionals, establishing a token-based rewards ecosystem, growing MockJ as a mainstream AI assistant brand, scaling Cammy as an AI-powered shopping experience, and creating interconnected value through the MLTX token system. Long-term vision: become the creative AI infrastructure that powers the next generation of digital entrepreneurs.`,
    lastUpdated: '2026-06',
  },

  // ── MOCKJ AI ────────────────────────────────────────────────────────────────
  {
    id: 'mockj-overview',
    category: 'ai',
    title: 'MockJ AI — Overview',
    keywords: ['mockj', 'mockj ai', 'mockj assistant', 'mock a', 'mocka', 'ai assistant'],
    content: `MockJ is MLTX's flagship AI assistant — a next-generation conversational AI built to be smarter, more personable, and more useful than existing models. Powered by Google Gemini 3 Flash Preview via the OnSpace AI platform. Features include: streaming chat with Deep Reasoning mode, image generation (Gemini 2.5 Flash Image), video generation (Sora 2), voice input via Web Speech API, personality presets (Chill Bro, Sigma Grindset, Professor Mode, Creative Genius), prompt library with 20+ presets, and a full subscription system.`,
    lastUpdated: '2026-06',
  },
  {
    id: 'mockj-personality',
    category: 'features',
    title: 'MockJ — Personality Presets',
    keywords: ['mockj personality', 'personality preset', 'chill bro', 'sigma grindset', 'professor mode', 'creative genius', 'mockj vibe'],
    content: `MockJ has four personality presets:
1. Chill Bro (default) — casual, energetic, uses internet slang, feels like chatting with a brilliant friend. Phrases: "Yo wuddup", "no cap", "fr fr", "that's fire".
2. Sigma Grindset — motivational hustle energy, 4AM grinder energy. Phrases: "Grind don't stop", "No cap winners execute", "Sigma move right there".
3. Professor Mode — formal academic language, scholarly vocabulary, systematic reasoning. Phrases: "It is worth noting that...", "The evidence suggests...".
4. Creative Genius — artistic and imaginative, vivid metaphors, poetic language. Phrases: "Imagine if...", "Here's a wild thought:", "There's a beautiful parallel here...".
Personalities are stored in localStorage and injected as system prompt overrides on each request.`,
    lastUpdated: '2026-06',
  },
  {
    id: 'mockj-pricing',
    category: 'pricing',
    title: 'MockJ — Pricing & Plans',
    keywords: ['mockj pricing', 'mockj pro', 'mockj subscription', 'mockj plans', 'mockj cost', 'mockj free', 'upgrade mockj', 'mockj intro'],
    content: `MockJ offers two paid plans and a free tier:
FREE TIER: 10 chat messages/day, 3 image generations/day, 1 video generation/day. After hitting limits, a paywall modal prompts upgrade.
MOCKJ PRO ($50.99/month): Unlimited AI chat with Deep Reasoning, all image generation styles, video generation with Sora 2, all personality presets, priority response speed, unlimited export & history. Checkout via Stripe payment link.
MOCKJ INTRO ($2.99/month): Introductory rate — unlimited chat, standard image generation, video generation, personality presets, chat export.
Billing is monthly via Stripe. Cancel any time through the subscription portal. Post-checkout, a WelcomeProModal confirms the active plan and renewal date.`,
    lastUpdated: '2026-06',
  },
  {
    id: 'mockj-online',
    category: 'platforms',
    title: 'mockj.online — Platform',
    keywords: ['mockj.online', 'mockj website', 'mockj url', 'mockj domain'],
    content: `mockj.online is the primary domain for MockJ AI. It serves as the main entry point for users accessing MockJ's chat interface, image/video generation, and subscription management. The platform is a React/TypeScript SPA deployed on OnSpace cloud infrastructure. It features a dark-themed UI with cyan/violet accent system, sidebar navigation, and full AI capabilities.`,
    lastUpdated: '2026-06',
  },
  {
    id: 'mockk-online',
    category: 'platforms',
    title: 'mockk.online — Platform',
    keywords: ['mockk.online', 'mockk website', 'mockk url', 'mockk domain'],
    content: `mockk.online is an alternate/mirror domain associated with the MockJ/MLTX ecosystem. It may serve as a redirect, alternate brand entry point, or secondary deployment for MockJ-related services. Part of Jenny Moreira's broader digital footprint under MLTXPRO operations.`,
    lastUpdated: '2026-06',
  },

  // ── CAMMY / CAMME ──────────────────────────────────────────────────────────
  {
    id: 'cammy-overview',
    category: 'projects',
    title: 'Cammy / CAMME — Overview',
    keywords: ['cammy', 'camme', 'cammy shop', 'camme shop', 'cammy.shop', 'ai shopping', 'cammy brand'],
    content: `Cammy (also referred to as CAMME) is the AI-powered shopping and e-commerce platform within the MLTX ecosystem, accessible at cammy.shop. It is NOT a token platform — Cammy is a dedicated shopping/retail experience enhanced with AI. The platform likely features AI product recommendations, smart search, and a personalized shopping assistant. Cammy is a separate brand from MockJ and MoreiraJ — it has its own identity, audience (shoppers/consumers), and value proposition focused on commerce. Design and branding should maintain Cammy's distinct identity rather than blending with MockJ's dark tech aesthetic.`,
    lastUpdated: '2026-06',
  },

  // ── TOKEN WALLET SYSTEM ────────────────────────────────────────────────────
  {
    id: 'tokens-overview',
    category: 'tokens',
    title: 'MLTX Token Wallet System',
    keywords: ['tokens', 'mltx tokens', 'token wallet', 'token system', 'mltx wallet', 'reward tokens', 'token balance'],
    content: `The MLTX token wallet system is a rewards and utility token infrastructure within the MLTX ecosystem. Tokens can be earned through platform engagement, purchases, or special events, and spent on premium features, AI credits, or marketplace items. The wallet system is integrated into user dashboards across MLTX platforms. Token transactions are tracked per-user and the wallet displays current balance, transaction history, and available redemption options. The system is designed to create ecosystem stickiness and reward loyal users.`,
    lastUpdated: '2026-06',
  },

  // ── VOICE COMMAND ASSISTANT ────────────────────────────────────────────────
  {
    id: 'voice-overview',
    category: 'voice',
    title: 'MockJ Voice Command Assistant',
    keywords: ['voice', 'voice commands', 'voice assistant', 'microphone', 'speech', 'hey mockj', 'voice mode', 'hands-free'],
    content: `MockJ includes a voice command assistant powered by the Web Speech API for speech-to-text transcription. Features: microphone button in ChatInput for voice recording with live indicator, auto-fill transcribed text into input field, hands-free operation. Wake word: "Hey MockJ" to grab attention mid-session. Barge-in: speak while MockJ is talking to interrupt playback. AEC (Acoustic Echo Cancellation) prevents MockJ from hearing his own TTS output. Voice mode supports Chrome and Edge on desktop best — iOS WebKit may have reliability issues. Voice is metered on TTS output (bytes/second), not listening time.`,
    lastUpdated: '2026-06',
  },
  {
    id: 'voice-commands-list',
    category: 'voice',
    title: 'Voice Command Examples',
    keywords: ['voice commands list', 'voice examples', 'what can i say', 'voice input examples'],
    content: `Example voice commands for MockJ:
- "Hey MockJ, write me a product description for..." — triggers chat mode
- "Generate an image of a futuristic city at night" — can be used with image mode
- "Hey MockJ, explain quantum computing in simple terms" — standard chat
- "What's the weather like?" (with web search enabled) — live search
- "Switch to Professor Mode" — change personality
- "Help me write a cover letter for..." — writing assistance
- "Debug this code: [paste code]" — coding help
Voice input transcribes spoken words and populates the chat input field for review before sending.`,
    lastUpdated: '2026-06',
  },

  // ── AI ADVERTISING PROMPT GENERATOR ───────────────────────────────────────
  {
    id: 'ai-ad-prompt-generator',
    category: 'ai',
    title: 'AI Advertising Prompt Generator',
    keywords: ['ad prompt generator', 'advertising prompts', 'ai ads', 'mockj ads', 'marketing prompts', 'ai advertising'],
    content: `The AI Advertising Prompt Generator is a specialized feature within the MLTX/MockJ ecosystem for creating high-converting ad copy and marketing prompts. It leverages MockJ's AI capabilities to generate tailored advertising content for social media, product listings, email campaigns, and creative briefs. Users input product/service details and target audience, and the system outputs optimized prompt sequences for various AI image and text generation platforms. This ties into MLTX's mission of democratizing AI tools for marketing professionals and small business owners.`,
    lastUpdated: '2026-06',
  },

  // ── USER DASHBOARDS ────────────────────────────────────────────────────────
  {
    id: 'user-dashboards',
    category: 'features',
    title: 'User Dashboards — Overview',
    keywords: ['dashboard', 'user dashboard', 'mockj dashboard', 'mltx dashboard', 'user panel', 'account dashboard'],
    content: `User dashboards across the MLTX ecosystem provide centralized control and analytics for each platform. MockJ dashboard includes: conversation history, subscription status and renewal date, daily usage meters (chat/image/video), personality preset management, and account settings. MoreiraJ dashboard includes: creative project portfolio, token wallet balance and history, brand analytics, and AI tool access. All dashboards share a consistent dark-themed UI with the MLTX cyan/violet design system and role-based access control tied to subscription tier.`,
    lastUpdated: '2026-06',
  },

  // ── TECHNICAL STACK ────────────────────────────────────────────────────────
  {
    id: 'technical-stack',
    category: 'technical',
    title: 'MockJ — Technical Stack',
    keywords: ['tech stack', 'mockj tech', 'mockj built with', 'mockj technology', 'react', 'supabase', 'onspace', 'stripe'],
    content: `MockJ is built with: React 18 + TypeScript (frontend), Vite (build tool), Tailwind CSS (styling), OnSpace Cloud / Supabase (backend — auth, database, storage, edge functions), Stripe (payments and subscriptions), OnSpace AI (AI model access — Gemini 3 Flash for chat, Gemini 2.5 Flash Image for image gen, Sora 2 for video). State management via React Query + localStorage. Routing via React Router. UI components via shadcn/ui. Deployed on OnSpace infrastructure with serverless edge functions for AI calls.`,
    lastUpdated: '2026-06',
  },

  // ── BUSINESS GOALS ─────────────────────────────────────────────────────────
  {
    id: 'business-goals',
    category: 'business',
    title: 'Jenny Moreira / MLTXPRO — Business Goals',
    keywords: ['business goals', 'jenny moreira goals', 'mltx business', 'mltxpro strategy', 'mockj growth'],
    content: `Jenny Moreira / MLTXPRO core business objectives:
1. Scale MockJ Pro subscriptions — primary recurring revenue driver at $50.99/mo
2. Build the MLTX ecosystem brand as the go-to creative AI platform
3. Establish Cammy as a leading AI-enhanced shopping destination
4. Grow MoreiraJ as a premium personal brand and creator platform
5. Develop the MLTX token economy for ecosystem engagement and retention
6. Expand to mobile apps and voice-first interfaces
7. Monetize the AI advertising prompt generator as a B2B SaaS product
8. Achieve mainstream recognition as an independent AI assistant brand separate from Big Tech models`,
    lastUpdated: '2026-06',
  },

  // ── JENNY MOREIRA IDENTITY ────────────────────────────────────────────────
  {
    id: 'jenny-moreira',
    category: 'branding',
    title: 'Jenny Moreira — Identity & Role',
    keywords: ['jenny moreira', 'jenny', 'moreira', 'founder', 'creator', 'mltxpro founder'],
    content: `Jenny Moreira is the founder and creative director of MLTXPRO and the entire MLTX ecosystem. She is a digital entrepreneur, creator, and AI innovator building next-generation tools for creators and businesses. Her personal brand (MoreiraJ) reflects her identity: bold, creative, tech-forward, and authentically human. She operates at the intersection of AI, design, and entrepreneurship. MockJ is named after her — "MockJ" = Mock + J (Jenny). The "J" family of brands (MockJ, MoreiraJ) reflects her personal ownership and vision for the ecosystem.`,
    lastUpdated: '2026-06',
  },
];

// Keep KNOWLEDGE_BASE as a backwards-compat alias pointing to static entries.
// Components that need live data (including custom) should call getAllEntries().
export const KNOWLEDGE_BASE = STATIC_KNOWLEDGE_BASE;
