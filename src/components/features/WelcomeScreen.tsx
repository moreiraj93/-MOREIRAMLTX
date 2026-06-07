import { Mic, Code2, Brain, Globe, FileText, Zap, Bot, Image, Video, Cpu } from 'lucide-react';
import logoImg from '@/assets/mockj-logo.png';
import heroBg from '@/assets/mocka-hero-bg.jpg';

interface WelcomeScreenProps {
  onSuggestion: (text: string) => void;
  onOpenImageStudio?: () => void;
}

const COPILOT_FEATURES = [
  { icon: Mic,      label: 'Voice Commands',    desc: 'Control everything hands-free', color: 'red' },
  { icon: Code2,    label: 'Code Generation',   desc: 'Ship code 10× faster',          color: 'violet' },
  { icon: Image,    label: 'Image Generation',  desc: 'Create stunning visuals',       color: 'red' },
  { icon: Globe,    label: 'Website Building',  desc: 'Full sites in minutes',         color: 'violet' },
  { icon: Brain,    label: 'Project Memory',    desc: 'Remembers everything you build',color: 'red' },
  { icon: FileText, label: 'Document Analysis', desc: 'Understand any file instantly', color: 'violet' },
  { icon: Bot,      label: 'AI Agents',         desc: 'Autonomous task completion',    color: 'red' },
  { icon: Zap,      label: 'Task Automation',   desc: 'Eliminate repetitive work',     color: 'violet' },
];

const SUGGESTIONS = [
  { icon: Code2,    label: 'Build me a full-stack app — scaffold, code, and explain it',     color: 'red' },
  { icon: Globe,    label: 'Create a landing page for my startup with SEO meta tags',        color: 'violet' },
  { icon: FileText, label: 'Analyze this document and extract all action items',             color: 'red' },
  { icon: Brain,    label: 'Remember: my project is called MoreiraJ — help me roadmap it',  color: 'violet' },
];

const RED   = 'hsl(4 90% 58%)';
const VIOLET = 'hsl(265 80% 65%)';

export default function WelcomeScreen({ onSuggestion, onOpenImageStudio }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-start h-full px-6 py-10 relative overflow-auto">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-[0.06] bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background pointer-events-none" />
      {/* Red ambient glow top-center */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[260px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, hsl(4 90% 58% / 0.12) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl w-full">
        {/* Logo + Badge */}
        <div className="relative mb-6">
          <div
            className="w-20 h-20 rounded-2xl overflow-hidden animate-pulse-glow ring-2"
            style={{ ringColor: 'hsl(4 90% 58% / 0.4)' }}
          >
            <img src={logoImg} alt="MockJ 4" className="w-full h-full object-cover" />
          </div>
          {/* Version badge */}
          <span
            className="absolute -top-2 -right-3 text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${RED}, hsl(20 90% 55%))`,
              color: '#fff',
              boxShadow: `0 0 10px hsl(4 90% 58% / 0.6)`,
              fontFamily: 'Space Grotesk, sans-serif',
            }}
          >
            v4
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-4xl sm:text-5xl font-black mb-3 leading-tight tracking-tight"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          <span className="text-foreground">MockJ AI — Your </span>
          <span
            className="text-glow-red"
            style={{ color: RED }}
          >
            Voice-Powered
          </span>
          <br />
          <span className="text-foreground">AI Copilot</span>
        </h1>

        {/* Sub-headline */}
        <p className="text-muted-foreground text-base sm:text-lg mb-2 max-w-xl leading-relaxed">
          Build websites, create images, write code, automate tasks,
          and control everything with your voice.
        </p>
        <p className="text-muted-foreground/50 text-xs mb-10 tracking-wide uppercase font-semibold">
          MockJ 4 · Always-On Copilot · Built Different 🔥
        </p>

        {/* Copilot Feature Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full mb-10">
          {COPILOT_FEATURES.map(({ icon: Icon, label, desc, color }) => {
            const accent = color === 'red' ? RED : VIOLET;
            return (
              <div
                key={label}
                className="flex flex-col items-start gap-2 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.02] cursor-default"
                style={{
                  background: `${accent.replace('hsl(', 'hsl(').replace(')', ' / 0.04)')}`,
                  borderColor: `${accent.replace(')', ' / 0.2)')}`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${accent.replace(')', ' / 0.1)')}`, border: `1px solid ${accent.replace(')', ' / 0.3)')}` }}
                >
                  <Icon className="w-4 h-4" style={{ color: accent }} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-foreground leading-tight">{label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick-Start CTA row */}
        <div className="flex items-center gap-3 mb-8 flex-wrap justify-center">
          <button
            onClick={onOpenImageStudio}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 hover:scale-[1.03]"
            style={{
              background: `linear-gradient(135deg, ${RED}, hsl(20 90% 55%))`,
              color: '#fff',
              boxShadow: `0 0 18px hsl(4 90% 58% / 0.35)`,
            }}
          >
            <Image className="w-4 h-4" />
            Open Image Studio
          </button>
          <a
            href="/landing"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 hover:scale-[1.02]"
            style={{
              borderColor: 'hsl(4 90% 58% / 0.35)',
              color: RED,
              background: 'hsl(4 90% 58% / 0.06)',
            }}
          >
            <Cpu className="w-4 h-4" />
            Explore All Features
          </a>
        </div>

        {/* Suggestion Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
          {SUGGESTIONS.map(({ icon: Icon, label, color }) => {
            const accent = color === 'red' ? RED : VIOLET;
            return (
              <button
                key={label}
                onClick={() => onSuggestion(label)}
                className="flex items-start gap-3 p-3.5 rounded-xl border text-left text-sm transition-all duration-200 active:scale-[0.98] hover:scale-[1.01]"
                style={{
                  borderColor: 'hsl(224 15% 18%)',
                  background: 'hsl(224 15% 8%)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `${accent.replace(')', ' / 0.45)')}`;
                  (e.currentTarget as HTMLButtonElement).style.background = `${accent.replace(')', ' / 0.05)')}`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(224 15% 18%)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'hsl(224 15% 8%)';
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${accent.replace(')', ' / 0.1)')}`, border: `1px solid ${accent.replace(')', ' / 0.25)')}` }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
                </div>
                <span className="text-muted-foreground leading-relaxed">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
