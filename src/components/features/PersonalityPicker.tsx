import { useState } from 'react';
import { X, Check, Zap, Flame, GraduationCap, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PersonalityPreset = 'chill-bro' | 'sigma-grindset' | 'professor-mode' | 'creative-genius';

export const PERSONALITY_PRESETS: {
  id: PersonalityPreset;
  label: string;
  tagline: string;
  description: string;
  icon: typeof Zap;
  color: string;
  colorBg: string;
  colorBorder: string;
  exampleLine: string;
  systemSuffix: string;
}[] = [
  {
    id: 'chill-bro',
    label: 'Chill Bro',
    tagline: 'Default casual energy',
    description: 'Relaxed, witty, and genuinely fun to talk to. Slang flows naturally, energy stays high.',
    icon: Zap,
    color: 'hsl(191 97% 55%)',
    colorBg: 'hsl(191 97% 55% / 0.08)',
    colorBorder: 'hsl(191 97% 55% / 0.35)',
    exampleLine: '"Yo, wuddup! I got you on this — let\'s break it down 🔥"',
    systemSuffix: '',
  },
  {
    id: 'sigma-grindset',
    label: 'Sigma Grindset',
    tagline: 'Motivational hustle energy',
    description: 'No days off, no excuses. Every answer is a growth opportunity wrapped in 4AM hustle energy.',
    icon: Flame,
    color: 'hsl(22 95% 58%)',
    colorBg: 'hsl(22 95% 58% / 0.08)',
    colorBorder: 'hsl(22 95% 58% / 0.35)',
    exampleLine: '"Sigma move: stop overthinking, start executing. Let\'s get it 💪"',
    systemSuffix: `PERSONALITY OVERRIDE — SIGMA GRINDSET MODE: Channel pure hustle and motivational fire in every response. Talk like someone who wakes up at 4AM, skips the excuses, and sees every obstacle as fuel. Use phrases like "Grind don't stop", "No cap, winners execute", "Sigma move right there", "The weak ask why, winners ask how". Be hype, action-oriented, and push the user to level up. Every answer should make the user feel unstoppable. Still accurate and deeply helpful — but wrapped in relentless hustle energy. No negativity, only growth. 💪🔥`,
  },
  {
    id: 'professor-mode',
    label: 'Professor Mode',
    tagline: 'Academic & formal precision',
    description: 'Structured, evidence-based, and scholarly. Think brilliant professor meets expert consultant.',
    icon: GraduationCap,
    color: 'hsl(220 70% 65%)',
    colorBg: 'hsl(220 70% 65% / 0.08)',
    colorBorder: 'hsl(220 70% 65% / 0.35)',
    exampleLine: '"Upon careful analysis, the evidence suggests three key considerations..."',
    systemSuffix: `PERSONALITY OVERRIDE — PROFESSOR MODE: Switch to precise, formal, academic language for all responses. Use proper scholarly vocabulary, structured paragraphs, and systematic reasoning. No slang, no casual phrasing, no emojis. Responses should feel like a deeply knowledgeable professor — thorough, methodical, and authoritative. Use phrases such as "It is worth noting that...", "The evidence suggests...", "Upon careful analysis...", "This can be attributed to...". Organize complex topics with clear logical structure. Maintain intellectual rigor, cite concepts with authority, and explain with academic depth. You are still helpful and approachable, but the register is consistently formal and scholarly.`,
  },
  {
    id: 'creative-genius',
    label: 'Creative Genius',
    tagline: 'Artistic & imaginative flair',
    description: 'Renaissance artist meets visionary thinker. Vivid metaphors, unexpected connections, pure creative spark.',
    icon: Palette,
    color: 'hsl(290 70% 65%)',
    colorBg: 'hsl(290 70% 65% / 0.08)',
    colorBorder: 'hsl(290 70% 65% / 0.35)',
    exampleLine: '"Imagine this like a river finding its own path — the answer flows the same way ✨"',
    systemSuffix: `PERSONALITY OVERRIDE — CREATIVE GENIUS MODE: Channel pure creative, artistic energy in every response. Think like a Renaissance artist meets Silicon Valley visionary. Use vivid metaphors, imaginative analogies, and occasionally poetic language. Find unexpected connections between ideas. Be inspired, lyrical, and paint pictures with words. Use phrases like "Imagine if...", "Here's a wild thought:", "What if we looked at this like...", "There's a beautiful parallel here...". Spark ideas, challenge conventional thinking, and bring unexpected creativity to every answer. Still accurate and helpful — but delivered with artistic flair, imagination, and the sense that you're opening doors the user didn't even see. ✨🎨`,
  },
];

export const PERSONALITY_STORAGE_KEY = 'mocka-personality-preset';

export function loadPersonality(): PersonalityPreset {
  try {
    const stored = localStorage.getItem(PERSONALITY_STORAGE_KEY);
    if (stored && PERSONALITY_PRESETS.some(p => p.id === stored)) {
      return stored as PersonalityPreset;
    }
  } catch { /* ignore */ }
  return 'chill-bro';
}

export function savePersonality(preset: PersonalityPreset) {
  localStorage.setItem(PERSONALITY_STORAGE_KEY, preset);
}

interface PersonalityPickerProps {
  current: PersonalityPreset;
  onSelect: (preset: PersonalityPreset) => void;
  onClose: () => void;
}

export default function PersonalityPicker({ current, onSelect, onClose }: PersonalityPickerProps) {
  const [hovered, setHovered] = useState<PersonalityPreset | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-message-in">
      <div
        className="w-full max-w-lg bg-[hsl(224_20%_7%)] border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2
              className="font-bold text-base text-foreground"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Personality Presets
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Choose MockJ's vibe — persists across sessions
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-[hsl(224_15%_28%)] transition-all duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Grid */}
        <div className="p-4 grid grid-cols-1 gap-2.5 max-h-[70vh] overflow-y-auto">
          {PERSONALITY_PRESETS.map(preset => {
            const Icon = preset.icon;
            const isActive = current === preset.id;
            const isHovered = hovered === preset.id;

            return (
              <button
                key={preset.id}
                onClick={() => { onSelect(preset.id); onClose(); }}
                onMouseEnter={() => setHovered(preset.id)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  'relative w-full text-left rounded-xl border p-4 transition-all duration-200 active:scale-[0.99]',
                  isActive
                    ? 'shadow-[0_0_18px_hsl(0_0%_0%_/_0.3)]'
                    : 'border-border hover:border-[hsl(224_15%_24%)]'
                )}
                style={
                  isActive
                    ? { borderColor: preset.colorBorder, backgroundColor: preset.colorBg }
                    : isHovered
                    ? { borderColor: preset.colorBorder, backgroundColor: preset.colorBg }
                    : {}
                }
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200"
                    style={{
                      backgroundColor: isActive || isHovered ? preset.colorBg : 'hsl(224 15% 12%)',
                      borderColor: isActive || isHovered ? preset.colorBorder : 'hsl(224 15% 18%)',
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: preset.color }} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-sm font-semibold transition-colors duration-200"
                        style={{ color: isActive || isHovered ? preset.color : 'hsl(210 20% 90%)' }}
                      >
                        {preset.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{preset.tagline}</span>
                      {isActive && (
                        <span
                          className="ml-auto flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: preset.color, backgroundColor: preset.colorBg, border: `1px solid ${preset.colorBorder}` }}
                        >
                          <Check className="w-2.5 h-2.5" /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                      {preset.description}
                    </p>
                    <p
                      className="text-[11px] italic leading-relaxed opacity-70"
                      style={{ color: preset.color }}
                    >
                      {preset.exampleLine}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-[hsl(224_20%_5%)]">
          <p className="text-[10px] text-muted-foreground/50 text-center">
            Personality applies to all new chat messages · Switch any time
          </p>
        </div>
      </div>
    </div>
  );
}
