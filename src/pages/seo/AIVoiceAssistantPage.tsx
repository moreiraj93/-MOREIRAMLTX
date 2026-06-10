import { Mic, Volume2, Brain, Zap, MessageSquare, Cpu } from 'lucide-react';
import SEOPage, { SEOPageData } from '@/components/features/SEOPage';

const data: SEOPageData = {
  metaTitle: 'AI Voice Assistant 2025 — MockJ 4 | Control Your AI With Voice',
  heroTitle: 'The Most Advanced',
  heroHighlight: 'AI Voice Assistant',
  heroSub: 'Speak naturally and watch MockJ 4 execute — generate images, write code, answer questions, and read responses aloud with MLTXPRO Voice.',
  heroCTA: 'Try AI Voice Control Free',
  keyword: 'AI Voice Assistant',
  featureTitle: 'How MockJ 4 Voice Works',
  features: [
    { icon: Mic,          title: 'Natural Speech Input',    desc: 'Uses browser Web Speech API for accurate, low-latency voice transcription in real-time.' },
    { icon: Volume2,      title: 'MLTXPRO Voice Output', desc: 'MockJ speaks back in a natural human voice with customizable speed (0.75× to 1.5×).' },
    { icon: Brain,        title: 'Voice + Context Memory',  desc: 'Your voice commands carry context — MockJ remembers what you discussed earlier in the session.' },
    { icon: Zap,          title: 'Hands-Free Workflow',     desc: 'Enable Auto-Speak and control your entire AI workflow without touching a keyboard.' },
    { icon: Cpu,          title: 'Multi-Modal Voice',       desc: 'Say "generate an image of a sunset" or "write me a Python function" — MockJ handles it all.' },
    { icon: MessageSquare,title: 'Barge-In Support',        desc: 'Stop MockJ mid-sentence and redirect — true barge-in support for natural conversation flow.' },
  ],
  useCases: [
    { title: 'Hands-Free Coding', desc: 'Describe the function you need, listen to the implementation, and ask follow-up questions — all without leaving your keyboard shortcut.' },
    { title: 'Accessibility', desc: 'Users with motor impairments can use MockJ entirely via voice — full platform access through speech alone.' },
    { title: 'On-the-Go Research', desc: 'Ask questions while commuting, walking, or working out. MockJ reads answers aloud through your earbuds.' },
    { title: 'Language Learning', desc: 'Practice conversations with MockJ\'s natural voice output, then adjust speaking speed to match your comprehension level.' },
    { title: 'Content Dictation', desc: 'Dictate articles, emails, and scripts. MockJ transcribes, formats, and refines your spoken content.' },
    { title: 'Meeting Assistant', desc: 'Speak a meeting summary to MockJ — it formats it into action items, assigns owners, and drafts follow-up emails.' },
  ],
  faqs: [
    { q: 'How do I enable voice input in MockJ?', a: 'Click the microphone button in the chat input bar. Your browser will request microphone permissions. Once granted, speak your message and MockJ will transcribe and respond.' },
    { q: 'What is Auto-Speak?', a: 'Auto-Speak automatically reads every AI response aloud using MLTXPRO Voice. Enable it from the sidebar toggle — great for hands-free use.' },
    { q: 'Can I control playback speed?', a: 'Yes — while audio is playing, a speed selector appears (0.75×, 1×, 1.25×, 1.5×) so you can control how fast MockJ reads responses.' },
    { q: 'Does voice work on mobile?', a: 'Yes — MockJ\'s voice features work on mobile browsers that support the Web Speech API, including Chrome on Android and Safari on iOS.' },
  ],
  comparison: {
    headers: ['MockJ 4', 'Phone assistants', 'Search assistants', 'Smart speakers'],
    rows: [
      { label: 'AI Text Generation',  values: [true,  false, false, false] },
      { label: 'Image Generation',    values: [true,  false, false, false] },
      { label: 'Code Writing',        values: [true,  false, false, false] },
      { label: 'MLTXPRO Voice',       values: [true,  false, false, false] },
      { label: 'Speed Control',       values: [true,  false, false, false] },
      { label: 'Project Memory',      values: [true,  false, false, false] },
    ],
  },
};

export default function AIVoiceAssistantPage() {
  return <SEOPage data={data} />;
}
