import { Mic, Volume2, Brain, Cpu, Zap, MessageSquare } from 'lucide-react';
import SEOPage, { SEOPageData } from '@/components/features/SEOPage';

const data: SEOPageData = {
  metaTitle: 'Best AI Copilot 2025 — MockJ 4 | Voice-Powered AI Assistant',
  heroTitle: 'The Best',
  heroHighlight: 'AI Copilot',
  heroSub: 'MockJ 4 is your always-on AI copilot — voice-controlled, context-aware, and built to replace 10 different tools.',
  heroCTA: 'Try the Best AI Copilot Free',
  keyword: 'Best AI Copilot',
  featureTitle: 'What Makes MockJ 4 the Best AI Copilot',
  features: [
    { icon: Mic,          title: 'Voice-First Design',      desc: 'Talk naturally to your copilot. No typing required — MockJ understands intent, context, and follow-ups.' },
    { icon: Brain,        title: 'Persistent Memory',       desc: 'Your copilot remembers projects, preferences, and goals across every session automatically.' },
    { icon: Cpu,          title: 'Multi-Modal Intelligence',desc: 'Chat, code, image generation, video — one copilot handles your entire creative and technical workflow.' },
    { icon: Zap,          title: 'Instant Responses',       desc: 'Streaming token-by-token replies mean near-zero latency. MockJ feels fast because it is.' },
    { icon: MessageSquare,title: 'Deep Reasoning Mode',     desc: 'Activate chain-of-thought reasoning for complex problems that need step-by-step analysis.' },
    { icon: Volume2,      title: 'MLTXPRO Voice Output', desc: 'MockJ speaks back to you in a natural, human voice — perfect for hands-free workflows.' },
  ],
  useCases: [
    { title: 'Software Development', desc: 'Use MockJ as your coding copilot — generate functions, debug errors, write tests, and explain complex code in plain English.' },
    { title: 'Content Strategy', desc: 'Brief MockJ on your brand, then let it draft blog posts, social captions, email sequences, and ad copy with consistent tone.' },
    { title: 'Research & Analysis', desc: 'Upload documents or paste URLs. MockJ summarizes, extracts key data, and answers follow-up questions.' },
    { title: 'Product Management', desc: 'Map user stories, write PRDs, prioritize backlogs, and get AI-assisted sprint planning.' },
    { title: 'Creative Projects', desc: 'Generate images, iterate on designs, build moodboards, and get creative feedback — all in one copilot.' },
    { title: 'Business Automation', desc: 'Define workflows and let MockJ automate reports, summaries, outreach messages, and data processing tasks.' },
  ],
  faqs: [
    { q: 'What is an AI copilot?', a: 'An AI copilot is a persistent AI assistant that works alongside you — understanding your context, remembering your projects, and helping you complete tasks faster across coding, writing, design, and more.' },
    { q: 'How is MockJ different from basic coding assistants?', a: 'MockJ 4 is a full-stack copilot covering code, images, voice, documents, and project memory in a single platform.' },
    { q: 'What makes MockJ 4 different?', a: 'MockJ 4 combines advanced reasoning with voice control, image generation, persistent project memory, and MLTXPRO Voice — making it versatile for creators and developers.' },
    { q: 'Does MockJ remember previous conversations?', a: 'Yes — MockJ stores your conversation history and project knowledge base so it maintains context across sessions without you re-explaining each time.' },
  ],
  comparison: {
    headers: ['MockJ 4', 'Basic chat', 'Code tools', 'Text assistants'],
    rows: [
      { label: 'Voice Commands',        values: [true,  false, false, false] },
      { label: 'Image Generation',      values: [true,  true,  false, false] },
      { label: 'Video Generation',      values: [true,  false, false, false] },
      { label: 'Persistent Memory',     values: [true,  true,  false, false] },
      { label: 'MLTXPRO Voice',         values: [true,  false, false, false] },
      { label: 'Project Knowledge Base',values: [true,  false, false, false] },
      { label: 'Free Tier',             values: ['Yes', 'Yes', 'Yes', 'Yes'] },
    ],
  },
};

export default function AICopilotPage() {
  return <SEOPage data={data} />;
}
