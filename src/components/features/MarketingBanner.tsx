/**
 * MockJ Marketing Banner — AI Creative Studio
 * Full-width promotional section showcasing image-to-image capabilities.
 * Uses the AI-generated hero image as background.
 */
import { useState } from 'react';
import { Sparkles, Zap, Mic, Brain, ChevronRight, X, Image, RefreshCw, User, Palette, Layers } from 'lucide-react';
import bannerImg from '@/assets/mockj-creative-studio-banner.jpg';
import { cn } from '@/lib/utils';

const FEATURE_CALLOUTS = [
  { emoji: '🎨', label: 'Reference Images' },
  { emoji: '🔄', label: 'Image-to-Image' },
  { emoji: '👤', label: 'Character Consistency' },
  { emoji: '🖼️', label: 'Style Transfer' },
  { emoji: '⚡', label: 'Lightning Fast' },
  { emoji: '🎙️', label: 'Voice Commands' },
  { emoji: '🧠', label: 'Multiple AI Models' },
];

const INTERFACE_FEATURES = [
  { icon: Image,   label: 'Upload Reference Images' },
  { icon: RefreshCw, label: 'Image-to-Image Generation' },
  { icon: User,    label: 'Character Consistency' },
  { icon: Palette, label: 'Style Transfer' },
  { icon: Layers,  label: 'Face Preservation' },
  { icon: Zap,     label: 'Ultra Detail Enhancement' },
];

interface MarketingBannerProps {
  onStartCreating?: () => void;
  dismissable?: boolean;
}

export default function MarketingBanner({ onStartCreating, dismissable = true }: MarketingBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-[hsl(265_80%_65%_/_0.25)] shadow-2xl">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={bannerImg}
          alt="MockJ AI Creative Studio"
          className="w-full h-full object-cover object-center"
        />
        {/* Gradient overlays for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(224_20%_5%_/_0.97)] via-[hsl(224_20%_5%_/_0.82)] to-[hsl(224_20%_5%_/_0.4)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(224_20%_5%_/_0.7)] via-transparent to-transparent" />
      </div>

      {/* Dismiss button */}
      {dismissable && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/60 transition-all"
          title="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Content */}
      <div className="relative z-10 px-6 py-8 md:px-10 md:py-10 max-w-2xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[hsl(265_80%_65%_/_0.4)] bg-[hsl(265_80%_65%_/_0.12)] mb-4">
          <Sparkles className="w-3 h-3 text-[hsl(265_80%_65%)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(265_80%_65%)]">
            New · Image Studio
          </span>
        </div>

        {/* Headline */}
        <h2
          className="text-2xl md:text-3xl font-black text-white leading-tight mb-2"
          style={{ fontFamily: 'Space Grotesk, sans-serif', textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}
        >
          CREATE FROM A{' '}
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(135deg, hsl(191 97% 55%), hsl(265 80% 65%))' }}
          >
            REFERENCE
          </span>
          .{' '}
          <br className="hidden sm:block" />
          NOT FROM SCRATCH.
        </h2>

        {/* Subheadline */}
        <p className="text-sm text-white/70 leading-relaxed mb-5 max-w-md">
          Upload any image. Transform it into artwork, photos, characters, branding, and more
          with AI-powered image-to-image generation.
        </p>

        {/* Feature Callout Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FEATURE_CALLOUTS.map(f => (
            <span
              key={f.label}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-white/10 bg-white/5 text-white/80 backdrop-blur-sm"
            >
              <span>{f.emoji}</span>
              {f.label}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onStartCreating}
          className={cn(
            'group flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.97]',
            'text-[hsl(224_20%_5%)]'
          )}
          style={{
            background: 'linear-gradient(135deg, hsl(191 97% 55%), hsl(265 80% 65%))',
            boxShadow: '0 0 24px hsl(191 97% 55% / 0.4), 0 0 48px hsl(265 80% 65% / 0.2)',
          }}
        >
          <Zap className="w-4 h-4" />
          START CREATING WITH MOCKJ AI TODAY
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Right side — Interface feature list (hidden on small screens) */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2 z-10">
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">
          Interface Features
        </p>
        {INTERFACE_FEATURES.map(f => (
          <div key={f.label} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[hsl(191_97%_55%_/_0.15)] border border-[hsl(191_97%_55%_/_0.3)] flex items-center justify-center">
              <f.icon className="w-2.5 h-2.5 text-[hsl(191_97%_55%)]" />
            </div>
            <span className="text-xs text-white/60 font-medium">{f.label}</span>
          </div>
        ))}
        <div className="mt-2 flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-[hsl(265_80%_65%_/_0.15)] border border-[hsl(265_80%_65%_/_0.3)] flex items-center justify-center">
            <Mic className="w-2.5 h-2.5 text-[hsl(265_80%_65%)]" />
          </div>
          <span className="text-xs text-white/60 font-medium">Voice Commands</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-[hsl(265_80%_65%_/_0.15)] border border-[hsl(265_80%_65%_/_0.3)] flex items-center justify-center">
            <Brain className="w-2.5 h-2.5 text-[hsl(265_80%_65%)]" />
          </div>
          <span className="text-xs text-white/60 font-medium">Multiple AI Models</span>
        </div>
      </div>
    </div>
  );
}
