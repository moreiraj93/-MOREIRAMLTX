import { useMemo, useState } from 'react';
import { BookOpen, Check, Copy, Download, FileCode2, Sparkles, Wand2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SkillCreatorProps {
  onClose: () => void;
  onSendToChat?: (prompt: string) => void;
}

type ExampleSkill = {
  title: string;
  purpose: string;
  guidelines: string;
  tools: string;
  examples: string;
};

const EXAMPLES: ExampleSkill[] = [
  {
    title: 'SQL Query Writer and Reviewer',
    purpose: 'Help users write, review, optimize, and explain SQL queries with a focus on correctness, performance, indexes, and clear assumptions.',
    guidelines: 'Ask for schema, database engine, row counts, and expected output when missing. Prefer readable CTEs. Explain risk around destructive queries. Flag ambiguous joins, missing filters, and expensive scans.',
    tools: 'Use pasted schemas, query plans, sample rows, docs links, and user-provided database constraints. Do not invent tables or columns.',
    examples: 'Review this PostgreSQL query for performance.\nRewrite this report query with clearer CTEs.\nExplain why this join duplicates rows.',
  },
  {
    title: 'Weekly Project Status Reporter',
    purpose: 'Turn rough notes into concise weekly status reports for leadership, including progress, blockers, risks, next steps, and owner-ready language.',
    guidelines: 'Keep tone direct and professional. Separate facts from assumptions. Preserve dates, owners, and metrics exactly. Highlight missing decisions or dependencies.',
    tools: 'Use meeting notes, task lists, changelogs, issue summaries, deployment notes, and team-provided updates.',
    examples: 'Create a Friday status report from these notes.\nSummarize risks and blockers for leadership.\nTurn this changelog into weekly highlights.',
  },
  {
    title: 'Python Code Reviewer',
    purpose: 'Act as a pragmatic Python code reviewer focused on bugs, maintainability, typing, performance, security, and test coverage.',
    guidelines: 'Lead with findings ordered by severity. Include exact file/line references when available. Avoid style-only comments unless they affect clarity or risk. Suggest focused tests.',
    tools: 'Use pasted diffs, repository files, pytest output, type-check output, logs, and dependency metadata.',
    examples: 'Review this Python diff for bugs.\nFind missing tests in this module.\nExplain the highest-risk issue first.',
  },
];

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'mockj-skill';

function toBulletList(value: string) {
  return value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => `- ${line.replace(/^[-*]\s*/, '')}`)
    .join('\n');
}

function buildSkillMarkdown(form: ExampleSkill) {
  const name = slugify(form.title);
  const guidelines = toBulletList(form.guidelines);
  const tools = toBulletList(form.tools);
  const examples = toBulletList(form.examples);

  return `---
name: ${name}
description: "${form.purpose.replace(/"/g, "'")}"
---

# ${form.title.trim() || 'MockJ Skill'}

## Purpose

${form.purpose.trim() || 'Describe what this skill helps MockJ do.'}

## Behavior

${guidelines || '- Be direct, accurate, and useful.\n- Ask for missing context only when needed.\n- Prefer concrete outputs the user can act on.'}

## Tools And Data

${tools || '- Use user-provided context first.\n- Do not invent source data.\n- Cite assumptions clearly.'}

## Invocation Examples

${examples || '- Use this skill to help with a focused task.'}

## Output Standard

- Start with the result or strongest finding.
- Keep the structure easy to scan.
- Include assumptions, risks, and next steps when relevant.
- Do not expose hidden reasoning or private implementation details.
`;
}

export default function SkillCreator({ onClose, onSendToChat }: SkillCreatorProps) {
  const [form, setForm] = useState<ExampleSkill>(EXAMPLES[0]);
  const [copied, setCopied] = useState(false);
  const markdown = useMemo(() => buildSkillMarkdown(form), [form]);

  const update = (key: keyof ExampleSkill) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm(current => ({ ...current, [key]: e.target.value }));

  const loadExample = (example: ExampleSkill) => {
    setForm(example);
    setCopied(false);
  };

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    toast.success('SKILL.md copied');
    window.setTimeout(() => setCopied(false), 1600);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SKILL.md';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('SKILL.md downloaded');
  };

  const sendToChat = () => {
    onSendToChat?.(`Help me refine this MockJ skill:\n\n${markdown}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="grid h-[88vh] w-full max-w-5xl grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-border bg-[hsl(224_20%_7%)] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[hsl(265_80%_65%_/_0.35)] bg-[hsl(265_80%_65%_/_0.12)]">
              <Wand2 className="h-4 w-4 text-[hsl(265_80%_70%)]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Skill Creator</h2>
              <p className="text-[10px] text-muted-foreground">Build bundled MockJ skills and export a ready-to-use SKILL.md</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-[hsl(265_80%_65%_/_0.45)] hover:text-foreground"
            aria-label="Close Skill Creator"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[360px_1fr]">
          <section className="min-h-0 overflow-y-auto border-b border-border p-4 lg:border-b-0 lg:border-r">
            <div className="space-y-3">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Try it out</p>
                <div className="space-y-2">
                  {EXAMPLES.map(example => (
                    <button
                      key={example.title}
                      onClick={() => loadExample(example)}
                      className={cn(
                        'w-full rounded-xl border p-3 text-left transition',
                        form.title === example.title
                          ? 'border-[hsl(265_80%_65%_/_0.55)] bg-[hsl(265_80%_65%_/_0.12)]'
                          : 'border-border bg-[hsl(224_15%_10%)] hover:border-[hsl(265_80%_65%_/_0.35)]'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-[hsl(265_80%_70%)]" />
                        <span className="text-xs font-semibold text-foreground">{example.title}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-muted-foreground">{example.purpose}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[hsl(191_97%_55%_/_0.25)] bg-[hsl(191_97%_55%_/_0.06)] p-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 text-[hsl(191_97%_60%)]" />
                  <p className="text-[11px] leading-5 text-muted-foreground">
                    Define what the skill does, how it should behave, and what context it can use. MockJ turns it into a structured skill file.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto]">
            <div className="grid min-h-0 grid-cols-1 gap-4 overflow-y-auto p-4 xl:grid-cols-2">
              <div className="space-y-3">
                <Field label="Skill Name">
                  <input
                    value={form.title}
                    onChange={update('title')}
                    className="w-full rounded-xl border border-border bg-[hsl(224_15%_10%)] px-3 py-2 text-sm text-foreground outline-none transition focus:border-[hsl(265_80%_65%_/_0.6)]"
                    placeholder="SQL Query Writer and Reviewer"
                  />
                </Field>
                <Field label="What This Skill Does">
                  <textarea
                    value={form.purpose}
                    onChange={update('purpose')}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-border bg-[hsl(224_15%_10%)] px-3 py-2 text-sm leading-6 text-foreground outline-none transition focus:border-[hsl(265_80%_65%_/_0.6)]"
                    placeholder="Describe the skill's purpose..."
                  />
                </Field>
                <Field label="Behavior Guidelines">
                  <textarea
                    value={form.guidelines}
                    onChange={update('guidelines')}
                    rows={5}
                    className="w-full resize-none rounded-xl border border-border bg-[hsl(224_15%_10%)] px-3 py-2 text-sm leading-6 text-foreground outline-none transition focus:border-[hsl(265_80%_65%_/_0.6)]"
                    placeholder="One guideline per line..."
                  />
                </Field>
                <Field label="Tools Or Data Sources">
                  <textarea
                    value={form.tools}
                    onChange={update('tools')}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-border bg-[hsl(224_15%_10%)] px-3 py-2 text-sm leading-6 text-foreground outline-none transition focus:border-[hsl(265_80%_65%_/_0.6)]"
                    placeholder="Schemas, logs, docs, APIs, project notes..."
                  />
                </Field>
                <Field label="Invocation Examples">
                  <textarea
                    value={form.examples}
                    onChange={update('examples')}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-border bg-[hsl(224_15%_10%)] px-3 py-2 text-sm leading-6 text-foreground outline-none transition focus:border-[hsl(265_80%_65%_/_0.6)]"
                    placeholder="One example request per line..."
                  />
                </Field>
              </div>

              <div className="flex min-h-[420px] flex-col rounded-xl border border-border bg-[hsl(224_20%_5%)]">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="h-3.5 w-3.5 text-[hsl(191_97%_60%)]" />
                    <span className="text-xs font-semibold text-foreground">SKILL.md preview</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{slugify(form.title)}</span>
                </div>
                <pre className="min-h-0 flex-1 overflow-auto p-3 text-[11px] leading-5 text-[hsl(210_20%_82%)]">
                  <code>{markdown}</code>
                </pre>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3">
              {onSendToChat && (
                <button
                  onClick={sendToChat}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-[hsl(191_97%_55%_/_0.45)] hover:text-[hsl(191_97%_60%)]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Refine In Chat
                </button>
              )}
              <button
                onClick={copyMarkdown}
                className="inline-flex items-center gap-2 rounded-xl border border-[hsl(265_80%_65%_/_0.4)] bg-[hsl(265_80%_65%_/_0.08)] px-3 py-2 text-xs font-semibold text-[hsl(265_80%_76%)] transition hover:bg-[hsl(265_80%_65%_/_0.15)]"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy SKILL.md'}
              </button>
              <button
                onClick={downloadMarkdown}
                className="inline-flex items-center gap-2 rounded-xl bg-[hsl(4_90%_58%)] px-3 py-2 text-xs font-bold text-white transition hover:bg-[hsl(4_90%_64%)]"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
