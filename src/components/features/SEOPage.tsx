/**
 * SEO Landing Page Template
 * Reusable component for all SEO-targeted pages
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, ChevronUp, ArrowRight, Cpu, Star } from 'lucide-react';
import logoImg from '@/assets/mockj-logo.png';
import { cn } from '@/lib/utils';

const RED   = 'hsl(4 90% 58%)';
const VIOLET = 'hsl(265 80% 65%)';

export interface SEOPageData {
  metaTitle: string;
  heroTitle: string;
  heroHighlight: string;
  heroSub: string;
  heroCTA: string;
  keyword: string;
  featureTitle: string;
  features: { icon: React.ElementType; title: string; desc: string }[];
  useCases: { title: string; desc: string }[];
  faqs: { q: string; a: string }[];
  comparison: {
    headers: string[];
    rows: { label: string; values: (boolean | string)[] }[];
  };
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left text-sm font-semibold text-foreground hover:text-[hsl(4_90%_68%)] transition-colors"
      >
        <span>{q}</span>
        {open ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && <p className="pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>}
    </div>
  );
}

export default function SEOPage({ data }: { data: SEOPageData }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[hsl(224_20%_4%)] text-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 px-6 py-3 border-b border-white/5 backdrop-blur-xl bg-[hsl(224_20%_4%_/_0.92)]">
        <a href="/landing" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <img src={logoImg} alt="MockJ" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-base text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            MockJ <span style={{ color: RED }}>4</span>
          </span>
        </a>
        <div className="flex-1" />
        <div className="hidden sm:flex items-center gap-5 text-sm text-muted-foreground">
          <a href="/landing#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="/landing#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="/landing#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
          style={{ background: RED, color: '#fff', boxShadow: `0 0 16px hsl(4 90% 58% / 0.3)` }}
        >
          Try Free <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center top, hsl(4 90% 58% / 0.11) 0%, transparent 65%)' }} />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8 text-xs font-bold" style={{ borderColor: 'hsl(4 90% 58% / 0.3)', color: RED, background: 'hsl(4 90% 58% / 0.07)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: RED }} />
            {data.keyword}
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1.05 }}>
            {data.heroTitle}{' '}
            <span style={{ color: RED, textShadow: `0 0 25px hsl(4 90% 58% / 0.5)` }}>{data.heroHighlight}</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">{data.heroSub}</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-base font-bold transition-all active:scale-95 hover:scale-[1.03]"
            style={{ background: `linear-gradient(135deg, ${RED}, hsl(20 90% 55%))`, color: '#fff', boxShadow: `0 4px 30px hsl(4 90% 58% / 0.4)` }}
          >
            <Cpu className="w-5 h-5" />
            {data.heroCTA}
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-center mb-12" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {data.featureTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.features.map(({ icon: Icon, title, desc }, i) => {
              const accent = i % 2 === 0 ? RED : VIOLET;
              return (
                <div key={title} className="p-5 rounded-2xl border flex flex-col gap-3" style={{ background: 'hsl(224 15% 7%)', borderColor: 'hsl(224 15% 12%)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accent.replace(')', ' / 0.1)')}`, border: `1px solid ${accent.replace(')', ' / 0.25)')}` }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: accent }} />
                  </div>
                  <h3 className="font-bold text-foreground text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black tracking-tight text-center mb-12" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Real-World <span style={{ color: RED }}>Use Cases</span>
          </h2>
          <div className="space-y-3">
            {data.useCases.map(({ title, desc }, i) => (
              <div key={title} className="flex items-start gap-4 p-4 rounded-xl border" style={{ background: 'hsl(224 15% 7%)', borderColor: 'hsl(224 15% 11%)' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5" style={{ background: i % 2 === 0 ? 'hsl(4 90% 58% / 0.12)' : 'hsl(265 80% 65% / 0.12)', color: i % 2 === 0 ? RED : VIOLET }}>
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black tracking-tight text-center mb-12" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            MockJ 4 vs. <span style={{ color: RED }}>The Rest</span>
          </h2>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'hsl(224 15% 14%)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'hsl(224 15% 9%)' }}>
                  <th className="py-3 px-5 text-left font-semibold text-muted-foreground text-xs">Feature</th>
                  {data.comparison.headers.map((h, i) => (
                    <th key={h} className={cn('py-3 px-5 text-center text-xs font-bold', i === 0 && 'rounded-t-xl')} style={{ color: i === 0 ? RED : 'hsl(210 20% 55%)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.comparison.rows.map(({ label, values }, ri) => (
                  <tr key={label} style={{ background: ri % 2 === 0 ? 'hsl(224 15% 7%)' : 'hsl(224 15% 5%)' }}>
                    <td className="py-3 px-5 text-xs text-muted-foreground">{label}</td>
                    {values.map((v, vi) => (
                      <td key={vi} className="py-3 px-5 text-center">
                        {typeof v === 'boolean'
                          ? v
                            ? <Check className="w-4 h-4 mx-auto" style={{ color: vi === 0 ? RED : 'hsl(142 70% 55%)' }} />
                            : <span className="text-muted-foreground/30 text-lg">—</span>
                          : <span className="text-xs font-semibold" style={{ color: vi === 0 ? RED : 'hsl(210 20% 65%)' }}>{v}</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black tracking-tight text-center mb-12" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Frequently Asked Questions
          </h2>
          {data.faqs.map(item => <FAQItem key={item.q} {...item} />)}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-6 border-t border-white/[0.04] text-center">
        <div className="max-w-2xl mx-auto">
          <Star className="w-8 h-8 mx-auto mb-6" style={{ color: RED }} />
          <h2 className="text-3xl font-black mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Try MockJ 4 Free
          </h2>
          <p className="text-muted-foreground mb-8">No credit card required. Upgrade when you're ready.</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold transition-all active:scale-95 hover:scale-[1.03]"
            style={{ background: `linear-gradient(135deg, ${RED}, hsl(20 90% 55%))`, color: '#fff', boxShadow: `0 4px 30px hsl(4 90% 58% / 0.35)` }}
          >
            <Cpu className="w-4 h-4" />
            Start Using MockJ 4
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded overflow-hidden">
              <img src={logoImg} alt="MockJ" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              MockJ <span style={{ color: RED }}>4</span>
            </span>
          </div>
          <nav className="flex items-center gap-5 text-xs text-muted-foreground">
            <a href="/ai-copilot" className="hover:text-foreground">AI Copilot</a>
            <a href="/ai-voice-assistant" className="hover:text-foreground">Voice AI</a>
            <a href="/ai-image-generator" className="hover:text-foreground">Image AI</a>
            <a href="/ai-coding-assistant" className="hover:text-foreground">Code AI</a>
            <a href="/ai-agent-platform" className="hover:text-foreground">AI Agents</a>
          </nav>
          <p className="text-xs text-muted-foreground/50">© 2025 MockJ</p>
        </div>
      </footer>
    </div>
  );
}
