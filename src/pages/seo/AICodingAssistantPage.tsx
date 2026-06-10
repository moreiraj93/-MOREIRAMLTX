import { Code2, Brain, Zap, Cpu, MessageSquare, FileText } from 'lucide-react';
import SEOPage, { SEOPageData } from '@/components/features/SEOPage';

const data: SEOPageData = {
  metaTitle: 'AI Coding Assistant 2025 — MockJ 4 | Write Better Code Faster',
  heroTitle: 'The Smartest',
  heroHighlight: 'AI Coding Assistant',
  heroSub: 'Write, debug, refactor, and explain code with MockJ 4 — your always-on AI pair programmer that remembers your codebase and speaks your language.',
  heroCTA: 'Start Coding with AI Free',
  keyword: 'AI Coding Assistant',
  featureTitle: 'Why Developers Choose MockJ 4',
  features: [
    { icon: Code2,        title: 'Code Generation',         desc: 'Generate complete functions, components, and modules in any language — from Python to Solidity.' },
    { icon: Brain,        title: 'Codebase Memory',         desc: 'Tell MockJ about your stack, conventions, and architecture — it remembers and applies them to every suggestion.' },
    { icon: Zap,          title: 'Real-Time Streaming',     desc: 'Code appears token by token, just like watching a senior dev type in real time.' },
    { icon: MessageSquare,title: 'Debug Conversations',     desc: 'Paste an error, describe the expected behavior, and MockJ traces the root cause step by step.' },
    { icon: Cpu,          title: 'Deep Reasoning Mode',     desc: 'Enable chain-of-thought for complex architectural decisions and multi-step algorithm design.' },
    { icon: FileText,     title: 'Code Review',             desc: 'Paste a PR or function and get detailed review comments on readability, performance, and security.' },
  ],
  useCases: [
    { title: 'Rapid Prototyping', desc: 'Describe a feature in plain English. MockJ scaffolds the implementation, writes the tests, and explains trade-offs — getting you from idea to working code in minutes.' },
    { title: 'Legacy Code Refactoring', desc: 'Paste old code and ask MockJ to modernize it — updating to current patterns, adding types, and improving readability.' },
    { title: 'Algorithm Design', desc: 'Work through algorithm challenges with MockJ\'s Deep Reasoning mode — it shows its thinking process and explains time/space complexity.' },
    { title: 'API Integration', desc: 'Describe the API you need to integrate. MockJ writes the client code, handles error cases, and explains authentication patterns.' },
    { title: 'Test Writing', desc: 'Paste a function and get a comprehensive test suite — unit tests, edge cases, and integration tests in your preferred framework.' },
    { title: 'Documentation', desc: 'Let MockJ generate docstrings, README files, API references, and inline comments from your existing code.' },
  ],
  faqs: [
    { q: 'What programming languages does MockJ support?', a: 'MockJ supports all major programming languages including Python, JavaScript/TypeScript, Rust, Go, Java, C++, Swift, Kotlin, SQL, Solidity, and more.' },
    { q: 'Can MockJ access my codebase?', a: 'MockJ doesn\'t directly access your files, but you can paste code snippets and use the Project Brain to store architecture notes, conventions, and component descriptions that MockJ references in every response.' },
    { q: 'How is MockJ different from basic code completion tools?', a: 'Basic code completion focuses on inline suggestions. MockJ is a conversational pair programmer — you can discuss architecture, debug errors, learn concepts, and generate entire modules through natural dialogue.' },
    { q: 'Does MockJ support voice for coding?', a: 'Yes — you can describe functions verbally using MockJ\'s voice input, and hear code explanations read aloud. Great for reviewing logic while keeping your eyes on the screen.' },
  ],
  comparison: {
    headers: ['MockJ 4', 'Completion tools', 'IDE helpers', 'Chat tools'],
    rows: [
      { label: 'Conversational Coding',  values: [true,  false, true,  true] },
      { label: 'Voice Input/Output',     values: [true,  false, false, false] },
      { label: 'Project Memory',         values: [true,  false, true,  false] },
      { label: 'Image Generation',       values: [true,  false, false, true] },
      { label: 'Deep Reasoning Mode',    values: [true,  false, false, true] },
      { label: 'Free Tier',              values: ['Yes', 'No',  'Lim.', 'Yes'] },
    ],
  },
};

export default function AICodingAssistantPage() {
  return <SEOPage data={data} />;
}
