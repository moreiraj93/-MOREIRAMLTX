import {
  BookOpen,
  Bot,
  Brain,
  Command,
  Crown,
  Database,
  Image,
  Images,
  LogIn,
  MessageSquare,
  Mic,
  Network,
  Rocket,
  ShieldCheck,
  Sparkles,
  Video,
  Wallet,
  Zap,
} from 'lucide-react';
import logoImg from '@/assets/mockj-logo.png';
import heroBg from '@/assets/mocka-hero-bg.jpg';
import { TokenAction } from '@/hooks/useTokenWallet';

interface WelcomeScreenProps {
  onSuggestion: (text: string) => void;
  onOpenImageStudio?: () => void;
  onOpenVideoStudio?: () => void;
  onOpenProjectBrain?: () => void;
  onOpenPromptLibrary?: () => void;
  onOpenPricing?: () => void;
  onOpenAccount?: () => void;
  onOpenWallet?: () => void;
  onOpenGallery?: () => void;
  tokenBalance?: number;
  tokenCosts?: Record<TokenAction, number>;
}

type ModuleAction =
  | 'chat'
  | 'voice'
  | 'image'
  | 'video'
  | 'brain'
  | 'knowledge'
  | 'account'
  | 'wallet'
  | 'billing'
  | 'library'
  | 'gallery';

const RED = 'hsl(4 90% 58%)';
const VIOLET = 'hsl(265 80% 65%)';
const BLUE = 'hsl(210 100% 62%)';

const COMMAND_MODULES: {
  icon: typeof MessageSquare;
  label: string;
  desc: string;
  action: ModuleAction;
  color: string;
  prompt?: string;
}[] = [
  {
    icon: MessageSquare,
    label: 'AI Chat Copilot',
    desc: 'Plan, write, code, research, and execute from one command stream.',
    action: 'chat',
    color: RED,
    prompt: 'MockJ, act as my AI copilot and help me build the next move for MoreiraJ and MLTX.',
  },
  {
    icon: Mic,
    label: 'Voice Commands',
    desc: 'Speak to MockJ, then hear the response through MLTXPRO Voice.',
    action: 'voice',
    color: BLUE,
    prompt: 'Hey MockJ, turn this idea into a hands-free voice command workflow for my crew.',
  },
  {
    icon: Image,
    label: 'Image Studio',
    desc: 'Upload, generate, edit, and remix visuals without making this the whole product.',
    action: 'image',
    color: VIOLET,
  },
  {
    icon: Video,
    label: 'Video Studio',
    desc: 'Generate motion, social clips, campaign visuals, and cinematic sequences.',
    action: 'video',
    color: BLUE,
  },
  {
    icon: Brain,
    label: 'Project Brain',
    desc: 'Store the mission, product decisions, brand rules, and active builds.',
    action: 'brain',
    color: RED,
  },
  {
    icon: Database,
    label: 'MoreiraJ / MLTX Knowledge',
    desc: 'Ground every response in the brand, ecosystem, and crew context.',
    action: 'knowledge',
    color: VIOLET,
  },
  {
    icon: LogIn,
    label: 'Account / Login',
    desc: 'Profile, saved work, cloud sync, usage, and session ownership.',
    action: 'account',
    color: BLUE,
  },
  {
    icon: Wallet,
    label: 'Token Wallet',
    desc: 'MLTX credits, creative spend, rewards, and ecosystem utility.',
    action: 'wallet',
    color: VIOLET,
    prompt: 'MockJ, map the MLTX token wallet into credits, rewards, and creator access levels.',
  },
  {
    icon: Crown,
    label: 'Billing / Pro Upgrade',
    desc: 'Stripe-powered Pro access for chat, image, video, and voice limits.',
    action: 'billing',
    color: RED,
  },
  {
    icon: BookOpen,
    label: 'Prompt Library',
    desc: 'Reusable commands for builds, ads, content, code, fashion, and launches.',
    action: 'library',
    color: BLUE,
  },
  {
    icon: Images,
    label: 'Saved Creations Gallery',
    desc: 'A living archive of generated images, edits, downloads, and remixes.',
    action: 'gallery',
    color: VIOLET,
  },
];

const CREW_STACK = [
  { label: 'MockJ', value: 'the brains', icon: Bot, color: RED },
  { label: 'MoreiraJ', value: 'the brand', icon: Sparkles, color: VIOLET },
  { label: 'MLTX', value: 'the ecosystem', icon: Network, color: BLUE },
  { label: 'Crew', value: 'the operators', icon: Command, color: RED },
];

const SIGNALS = [
  { label: 'Voice layer', value: 'MLTXPRO Voice' },
  { label: 'Style code', value: 'MJELTXSJ777111' },
  { label: 'Mode', value: 'Luxury cyberpunk' },
  { label: 'Access', value: 'Free + Pro' },
];

export default function WelcomeScreen({
  onSuggestion,
  onOpenImageStudio,
  onOpenVideoStudio,
  onOpenProjectBrain,
  onOpenPromptLibrary,
  onOpenPricing,
  onOpenAccount,
  onOpenWallet,
  onOpenGallery,
  tokenBalance = 7711,
  tokenCosts,
}: WelcomeScreenProps) {
  const handleModule = (action: ModuleAction, prompt?: string) => {
    if (action === 'image') {
      onOpenImageStudio?.();
      return;
    }
    if (action === 'video') {
      onOpenVideoStudio?.();
      return;
    }
    if (action === 'brain' || action === 'knowledge') {
      onOpenProjectBrain?.();
      return;
    }
    if (action === 'library') {
      onOpenPromptLibrary?.();
      return;
    }
    if (action === 'billing') {
      onOpenPricing?.();
      return;
    }
    if (action === 'account') {
      onOpenAccount?.();
      return;
    }
    if (action === 'wallet') {
      onOpenWallet?.();
      return;
    }
    if (action === 'gallery') {
      onOpenGallery?.();
      return;
    }

    onSuggestion(prompt ?? 'MockJ, help me operate the MoreiraJ and MLTX ecosystem from one command center.');
  };

  return (
    <div className="relative h-full overflow-auto bg-[hsl(224_28%_4%)] px-4 py-5 sm:px-6 lg:px-8">
      <div
        className="absolute inset-0 opacity-[0.08] bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,hsl(4_90%_58%_/_0.20),transparent_32%),radial-gradient(circle_at_86%_12%,hsl(265_80%_65%_/_0.18),transparent_30%),radial-gradient(circle_at_65%_88%,hsl(210_100%_62%_/_0.13),transparent_34%),linear-gradient(180deg,hsl(224_28%_4%_/_0.15),hsl(224_28%_4%))]" />

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-7xl flex-col gap-5">
        <header className="grid gap-4 border-b border-white/10 pb-5 lg:grid-cols-[1fr_420px] lg:items-end">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-lg border border-[hsl(4_90%_58%_/_0.55)] shadow-[0_0_28px_hsl(4_90%_58%_/_0.35)]">
                <img src={logoImg} alt="MockJ AI" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.34em] text-[hsl(4_90%_68%)]">MoreiraJ / MLTX</p>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">We are the crew</p>
              </div>
            </div>

            <div>
              <h1 className="max-w-4xl text-4xl font-black leading-[0.94] text-white sm:text-6xl lg:text-7xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                MockJ AI
                <span className="block bg-gradient-to-r from-[hsl(4_90%_64%)] via-[hsl(265_80%_70%)] to-[hsl(210_100%_66%)] bg-clip-text text-transparent">
                  Command Center
                </span>
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/62 sm:text-lg">
                MockJ is the brains. MoreiraJ is the brand. MLTX is the ecosystem. The full app is a premium AI dashboard for chat, voice, image, video, memory, billing, wallet, prompts, and saved creations.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleModule('chat', 'MockJ, build me a launch plan for the MoreiraJ and MLTX AI ecosystem.')}
                className="inline-flex items-center gap-2 rounded-lg bg-[hsl(4_90%_58%)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_22px_hsl(4_90%_58%_/_0.38)] transition hover:bg-[hsl(4_90%_64%)]"
              >
                <MessageSquare className="h-4 w-4" />
                Start Copilot
              </button>
              <button
                onClick={() => handleModule('library')}
                className="inline-flex items-center gap-2 rounded-lg border border-[hsl(265_80%_65%_/_0.45)] bg-[hsl(265_80%_65%_/_0.08)] px-4 py-2.5 text-sm font-bold text-[hsl(265_80%_76%)] transition hover:bg-[hsl(265_80%_65%_/_0.16)]"
              >
                <BookOpen className="h-4 w-4" />
                Prompt Library
              </button>
              <button
                onClick={() => handleModule('image')}
                className="inline-flex items-center gap-2 rounded-lg border border-[hsl(210_100%_62%_/_0.42)] bg-[hsl(210_100%_62%_/_0.08)] px-4 py-2.5 text-sm font-bold text-[hsl(210_100%_74%)] transition hover:bg-[hsl(210_100%_62%_/_0.15)]"
              >
                <Image className="h-4 w-4" />
                Image Studio
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/25 p-4 shadow-[0_0_45px_hsl(265_80%_65%_/_0.12)] backdrop-blur">
            <div className="grid grid-cols-2 gap-2">
              {CREW_STACK.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md border" style={{ borderColor: color.replace(')', ' / 0.34)'), background: color.replace(')', ' / 0.10)') }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <p className="text-sm font-black text-white">{label}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/43">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <main className="grid flex-1 gap-5 xl:grid-cols-[1fr_360px]">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {COMMAND_MODULES.map(({ icon: Icon, label, desc, action, color, prompt }) => (
              <button
                key={label}
                onClick={() => handleModule(action, prompt)}
                className="group min-h-[132px] rounded-lg border border-white/10 bg-[linear-gradient(145deg,hsl(224_18%_9%_/_0.82),hsl(224_28%_5%_/_0.92))] p-4 text-left shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)] transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-[hsl(224_18%_10%)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border transition group-hover:scale-105" style={{ borderColor: color.replace(')', ' / 0.36)'), background: color.replace(')', ' / 0.11)') }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <Zap className="h-4 w-4 text-white/18 transition group-hover:text-white/45" />
                </div>
                <h2 className="mt-4 text-sm font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{label}</h2>
                <p className="mt-2 text-xs leading-5 text-white/50">{desc}</p>
              </button>
            ))}
          </section>

          <aside className="space-y-4">
            <div className="rounded-lg border border-[hsl(4_90%_58%_/_0.28)] bg-[linear-gradient(160deg,hsl(4_90%_58%_/_0.13),hsl(224_18%_7%_/_0.9)_42%,hsl(265_80%_65%_/_0.12))] p-4 shadow-[0_0_42px_hsl(4_90%_58%_/_0.12)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-[hsl(4_90%_70%)]">MLTX Wallet</p>
                  <p className="mt-2 text-3xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{tokenBalance.toLocaleString()}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[hsl(4_90%_58%_/_0.38)] bg-black/30">
                  <Wallet className="h-5 w-5 text-[hsl(4_90%_64%)]" />
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-white/55">Token wallet surface for credits, rewards, Pro access, and saved creation spend.</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38">
                Chat {tokenCosts?.chat ?? 5} · Image {tokenCosts?.image ?? 50} · Video {tokenCosts?.video ?? 300}
              </p>
              <button
                onClick={() => handleModule('wallet')}
                className="mt-4 w-full rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2 text-xs font-bold text-white/75 transition hover:border-[hsl(4_90%_58%_/_0.45)] hover:text-white"
              >
                Map Wallet System
              </button>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/25 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[hsl(210_100%_72%)]">Build Signals</p>
              <div className="mt-4 space-y-2">
                {SIGNALS.map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.035] px-3 py-2">
                    <span className="text-xs text-white/46">{label}</span>
                    <span className="text-xs font-bold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[hsl(265_80%_65%_/_0.28)] bg-[hsl(265_80%_65%_/_0.07)] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-[hsl(265_80%_75%)]" />
                <div>
                  <p className="text-sm font-black text-white">MoreiraJ style lock</p>
                  <p className="mt-1 text-xs leading-5 text-white/55">
                    Every MoreiraJ style, image, or fashion build carries <span className="font-black text-[hsl(265_80%_78%)]">MJELTXSJ777111</span>.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleModule('billing')}
              className="flex w-full items-center justify-between rounded-lg border border-[hsl(4_90%_58%_/_0.38)] bg-[hsl(4_90%_58%_/_0.09)] px-4 py-3 text-left transition hover:bg-[hsl(4_90%_58%_/_0.15)]"
            >
              <span>
                <span className="block text-sm font-black text-white">MockJ Pro</span>
                <span className="block text-xs text-white/50">Billing, upgrade, portal access</span>
              </span>
              <Rocket className="h-5 w-5 text-[hsl(4_90%_64%)]" />
            </button>
          </aside>
        </main>
      </div>
    </div>
  );
}
