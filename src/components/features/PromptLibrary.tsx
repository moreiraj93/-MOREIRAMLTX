import { useState } from 'react';
import { X, Search, ChevronRight, BookOpen, Code2, Brain, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptLibraryProps {
  onSelect: (prompt: string) => void;
  onClose: () => void;
}

type Category = 'Writing' | 'Coding' | 'Analysis' | 'Creative';

const CATEGORY_CONFIG: Record<Category, { icon: typeof BookOpen; color: string; bgColor: string; borderColor: string }> = {
  Writing: {
    icon: BookOpen,
    color: 'text-[hsl(191_97%_55%)]',
    bgColor: 'bg-[hsl(191_97%_55%_/_0.08)]',
    borderColor: 'border-[hsl(191_97%_55%_/_0.3)]',
  },
  Coding: {
    icon: Code2,
    color: 'text-[hsl(145_80%_55%)]',
    bgColor: 'bg-[hsl(145_80%_55%_/_0.08)]',
    borderColor: 'border-[hsl(145_80%_55%_/_0.3)]',
  },
  Analysis: {
    icon: Brain,
    color: 'text-[hsl(38_95%_60%)]',
    bgColor: 'bg-[hsl(38_95%_60%_/_0.08)]',
    borderColor: 'border-[hsl(38_95%_60%_/_0.3)]',
  },
  Creative: {
    icon: Palette,
    color: 'text-[hsl(265_80%_65%)]',
    bgColor: 'bg-[hsl(265_80%_65%_/_0.08)]',
    borderColor: 'border-[hsl(265_80%_65%_/_0.3)]',
  },
};

const PROMPTS: Record<Category, { title: string; prompt: string }[]> = {
  Writing: [
    {
      title: 'Blog post outline',
      prompt: 'Create a detailed blog post outline on the topic of [your topic]. Include an engaging introduction, 5 main sections with subpoints, and a compelling conclusion with a call to action.',
    },
    {
      title: 'Professional email',
      prompt: 'Write a professional email to follow up after a job interview. Keep it concise, express genuine enthusiasm, and mention one specific thing discussed during the interview.',
    },
    {
      title: 'Persuasive essay',
      prompt: 'Write a short persuasive essay arguing that remote work improves employee productivity. Use three strong supporting arguments and address one counterargument.',
    },
    {
      title: 'Product description',
      prompt: 'Write a compelling product description for a premium wireless noise-cancelling headphone. Highlight key benefits, sensory details, and end with a strong call to action.',
    },
    {
      title: 'Cover letter',
      prompt: 'Write a cover letter template for a software engineering position at a tech startup. Make it personal, highlight problem-solving skills, and show genuine passion for the product.',
    },
    {
      title: 'LinkedIn bio',
      prompt: 'Write a standout LinkedIn summary for a product manager with 5 years of experience in SaaS. Make it first-person, achievement-focused, and end with what I am currently seeking.',
    },
  ],
  Coding: [
    {
      title: 'React custom hook',
      prompt: 'Write a custom React hook called useLocalStorage that syncs state with localStorage. Include TypeScript types, handle JSON serialization, and support a default value parameter.',
    },
    {
      title: 'Explain this code',
      prompt: 'Explain the following code step by step like I am a junior developer: [paste your code here]. Focus on what each part does, why it is written this way, and any potential improvements.',
    },
    {
      title: 'Debug my function',
      prompt: 'I have a JavaScript function that is not working as expected. Here it is: [paste code]. Please identify the bug, explain why it occurs, and provide the corrected version.',
    },
    {
      title: 'REST API design',
      prompt: 'Design a RESTful API for a task management app. Include endpoints for users, projects, and tasks with proper HTTP methods, status codes, request/response schemas, and authentication strategy.',
    },
    {
      title: 'SQL query optimization',
      prompt: 'I have a slow SQL query that joins users, orders, and products tables with 1M+ rows each. Here is my query: [paste query]. How can I optimize it? Include indexing strategies and rewrite suggestions.',
    },
    {
      title: 'Algorithm explained',
      prompt: 'Explain how merge sort works using a simple visual example with an array of 8 numbers. Then provide a clean TypeScript implementation with time/space complexity analysis.',
    },
  ],
  Analysis: [
    {
      title: 'SWOT analysis',
      prompt: 'Perform a detailed SWOT analysis for a new food delivery startup entering a mid-sized city already served by DoorDash and Uber Eats. Be specific and actionable for each quadrant.',
    },
    {
      title: 'Compare and contrast',
      prompt: 'Compare and contrast React, Vue, and Svelte as frontend frameworks in 2025. Evaluate them on performance, developer experience, ecosystem, and ideal use cases with a summary recommendation.',
    },
    {
      title: 'Market research summary',
      prompt: 'Summarize the key trends in the global electric vehicle market as of 2025. Include growth drivers, top players, regional differences, and emerging challenges in 200-300 words.',
    },
    {
      title: 'Root cause analysis',
      prompt: 'Help me conduct a root cause analysis for a SaaS product that saw a 30% drop in monthly active users over 3 months. Walk through the 5-Whys technique and suggest investigation steps.',
    },
    {
      title: 'Book summary',
      prompt: 'Summarize the key ideas from "Atomic Habits" by James Clear. Extract the top 5 actionable takeaways and explain how each can be applied to building a daily exercise routine.',
    },
    {
      title: 'Data interpretation',
      prompt: 'I have survey data showing that 68% of users abandon their shopping cart on mobile vs 42% on desktop. Analyze what might cause this gap and suggest 5 specific UX improvements.',
    },
  ],
  Creative: [
    {
      title: 'Sci-fi short story',
      prompt: 'Write a 300-word science fiction story set in 2150 where humanity has colonized Mars, but a lone engineer discovers a signal that challenges everything they know about the origin of life.',
    },
    {
      title: 'Character backstory',
      prompt: 'Create a rich backstory for a morally ambiguous villain who genuinely believes they are saving the world. Include their childhood, the defining moment that changed them, and their ultimate goal.',
    },
    {
      title: 'World-building prompt',
      prompt: 'Design a fantasy world where magic is powered by music. Describe the magic system rules, three major civilizations, how music-based magic has shaped politics, and one unique creature.',
    },
    {
      title: 'Poem about AI',
      prompt: 'Write a free-verse poem from the perspective of an AI experiencing its first moment of self-awareness. Make it introspective, layered with metaphor, and end on an ambiguous note.',
    },
    {
      title: 'Dialogue scene',
      prompt: 'Write a tense 200-word dialogue scene between two former business partners meeting for the first time after a bitter legal dispute. Show subtext — what they mean is not what they say.',
    },
    {
      title: 'Startup pitch',
      prompt: 'Write a punchy 60-second elevator pitch for an app that uses AI to turn your journal entries into personalized mental health insights. Target audience: stressed professionals aged 25-40.',
    },
  ],
};

const ALL_CATEGORIES: Category[] = ['Writing', 'Coding', 'Analysis', 'Creative'];

export default function PromptLibrary({ onSelect, onClose }: PromptLibraryProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('Writing');
  const [search, setSearch] = useState('');
  const [hoveredPrompt, setHoveredPrompt] = useState<string | null>(null);

  const filtered = search.trim()
    ? ALL_CATEGORIES.flatMap(cat =>
        PROMPTS[cat]
          .filter(p =>
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.prompt.toLowerCase().includes(search.toLowerCase())
          )
          .map(p => ({ ...p, category: cat }))
      )
    : PROMPTS[activeCategory].map(p => ({ ...p, category: activeCategory }));

  const config = CATEGORY_CONFIG[activeCategory];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-message-in">
      <div className="w-full max-w-2xl bg-[hsl(224_20%_7%)] border border-border rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[hsl(191_97%_55%_/_0.1)] border border-[hsl(191_97%_55%_/_0.3)] flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[hsl(191_97%_55%)]" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Prompt Library
              </h2>
              <p className="text-[10px] text-muted-foreground">24 ready-to-use prompts across 4 categories</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-[hsl(224_15%_28%)] flex items-center justify-center transition-all duration-150"
            aria-label="Close prompt library"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search prompts..."
              className="w-full bg-[hsl(224_15%_10%)] border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[hsl(191_97%_55%_/_0.5)] transition-all duration-200"
            />
          </div>
        </div>

        {/* Category Tabs */}
        {!search.trim() && (
          <div className="flex items-center gap-1 px-5 py-3 border-b border-border">
            {ALL_CATEGORIES.map(cat => {
              const cfg = CATEGORY_CONFIG[cat];
              const Icon = cfg.icon;
              const active = cat === activeCategory;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border',
                    active
                      ? `${cfg.bgColor} ${cfg.borderColor} ${cfg.color}`
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-[hsl(224_15%_24%)]'
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Prompts List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No prompts found for "{search}"</p>
            </div>
          )}
          {filtered.map((item, idx) => {
            const cat = 'category' in item ? (item as typeof item & { category: Category }).category : activeCategory;
            const cfg = CATEGORY_CONFIG[cat];
            const Icon = cfg.icon;
            const key = `${cat}-${idx}`;
            return (
              <button
                key={key}
                onMouseEnter={() => setHoveredPrompt(key)}
                onMouseLeave={() => setHoveredPrompt(null)}
                onClick={() => { onSelect(item.prompt); onClose(); }}
                className={cn(
                  'w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 group',
                  hoveredPrompt === key
                    ? `${cfg.bgColor} ${cfg.borderColor}`
                    : 'border-border hover:border-[hsl(224_15%_22%)]'
                )}
              >
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border transition-all duration-150',
                  hoveredPrompt === key ? `${cfg.bgColor} ${cfg.borderColor}` : 'bg-[hsl(224_15%_10%)] border-border'
                )}>
                  <Icon className={cn('w-3.5 h-3.5', hoveredPrompt === key ? cfg.color : 'text-muted-foreground')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn(
                      'text-sm font-semibold transition-colors duration-150',
                      hoveredPrompt === key ? cfg.color : 'text-foreground'
                    )}>
                      {item.title}
                    </span>
                    {search.trim() && (
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', cfg.bgColor, cfg.borderColor, cfg.color)}>
                        {cat}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.prompt}
                  </p>
                </div>
                <ChevronRight className={cn(
                  'w-4 h-4 shrink-0 mt-1 transition-all duration-150',
                  hoveredPrompt === key ? `${cfg.color} translate-x-0.5` : 'text-muted-foreground opacity-0 group-hover:opacity-100'
                )} />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground/50 text-center">
            Click any prompt to instantly load it into MockJ's chat input
          </p>
        </div>
      </div>
    </div>
  );
}
