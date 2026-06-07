import { useState, useCallback } from 'react';
import {
  Brain, ChevronDown, ChevronRight, X, Search,
  Plus, Pencil, Trash2, Save, XCircle, AlertTriangle,
} from 'lucide-react';
import {
  STATIC_KNOWLEDGE_BASE, BRAIN_TOPICS, CATEGORY_META,
  KnowledgeEntry, KnowledgeCategory,
  getCustomEntries, saveCustomEntry, updateCustomEntry, deleteCustomEntry,
} from '@/data/knowledgeBase';
import { searchKnowledge } from '@/lib/knowledgeSearch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProjectBrainProps {
  onClose: () => void;
}

// ── Blank form state ──────────────────────────────────────────────────────────
const BLANK_FORM = {
  title: '',
  category: 'projects' as KnowledgeCategory,
  keywords: '',
  content: '',
};

type FormState = typeof BLANK_FORM;

// ── Simple form component ──────────────────────────────────────────────────────
function EntryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: FormState;
  onSave: (f: FormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(f => ({ ...f, [key]: e.target.value }));

  const valid = form.title.trim().length > 0 && form.content.trim().length > 0;

  const inputCls =
    'w-full bg-[hsl(224_15%_10%)] border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(191_97%_55%_/_0.6)] transition-colors';

  return (
    <div className="space-y-3">
      {/* Title */}
      <div>
        <label className="block text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
          Title *
        </label>
        <input
          value={form.title}
          onChange={set('title')}
          placeholder="e.g. MoreiraJ — New Feature"
          className={inputCls}
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
          Category *
        </label>
        <select
          value={form.category}
          onChange={set('category')}
          className={inputCls}
        >
          {(Object.keys(CATEGORY_META) as KnowledgeCategory[]).map(cat => (
            <option key={cat} value={cat}>
              {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
            </option>
          ))}
        </select>
      </div>

      {/* Keywords */}
      <div>
        <label className="block text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
          Keywords <span className="normal-case font-normal">(comma-separated)</span>
        </label>
        <input
          value={form.keywords}
          onChange={set('keywords')}
          placeholder="moreiraJ, new feature, dashboard"
          className={inputCls}
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
          Content *
        </label>
        <textarea
          value={form.content}
          onChange={set('content')}
          placeholder="Describe this topic in detail. MockJ will use this to answer questions about it."
          rows={5}
          className={cn(inputCls, 'resize-none leading-relaxed')}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => valid && onSave(form)}
          disabled={!valid}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'hsl(191 97% 55%)', color: 'hsl(224 20% 6%)' }}
        >
          <Save className="w-3 h-3" />
          Save Entry
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-[hsl(191_97%_55%_/_0.4)] transition-all"
        >
          <XCircle className="w-3 h-3" />
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProjectBrain({ onClose }: ProjectBrainProps) {
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Custom entries live in state so UI re-renders on CRUD
  const [customEntries, setCustomEntries] = useState<KnowledgeEntry[]>(getCustomEntries);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── Derived display list ────────────────────────────────────────────────────
  const allEntries = [...STATIC_KNOWLEDGE_BASE, ...customEntries];

  const displayedEntries: KnowledgeEntry[] = searchQuery.trim().length > 1
    ? searchKnowledge(searchQuery, 20, 1).map(r => r.entry)
    : activeTopic
      ? (() => {
          const topic = BRAIN_TOPICS.find(t => t.id === activeTopic);
          return topic ? allEntries.filter(topic.filter) : allEntries;
        })()
      : allEntries;

  const isCustomEntry = useCallback(
    (id: string) => customEntries.some(e => e.id === id),
    [customEntries]
  );

  // ── CRUD handlers ───────────────────────────────────────────────────────────
  const handleAdd = (form: FormState) => {
    const keywords = form.keywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    const newEntry = saveCustomEntry({
      title: form.title.trim(),
      category: form.category,
      keywords,
      content: form.content.trim(),
    });

    setCustomEntries(getCustomEntries());
    setShowAddForm(false);
    setExpandedId(newEntry.id);
    toast.success('Entry added to Project Brain');
  };

  const handleUpdate = (id: string, form: FormState) => {
    const existing = customEntries.find(e => e.id === id);
    if (!existing) return;

    const keywords = form.keywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    updateCustomEntry({
      ...existing,
      title: form.title.trim(),
      category: form.category,
      keywords,
      content: form.content.trim(),
    });

    setCustomEntries(getCustomEntries());
    setEditingId(null);
    toast.success('Entry updated');
  };

  const handleDelete = (id: string) => {
    deleteCustomEntry(id);
    setCustomEntries(getCustomEntries());
    setConfirmDeleteId(null);
    setExpandedId(null);
    toast.success('Entry deleted');
  };

  const entryToForm = (e: KnowledgeEntry): FormState => ({
    title: e.title,
    category: e.category,
    keywords: e.keywords.join(', '),
    content: e.content,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-[90vh] flex flex-col bg-[hsl(224_20%_7%)] border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[hsl(191_97%_55%_/_0.12)] border border-[hsl(191_97%_55%_/_0.3)] flex items-center justify-center">
              <Brain className="w-4 h-4 text-[hsl(191_97%_55%)]" />
            </div>
            <div>
              <h2
                className="text-sm font-bold text-foreground leading-none"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                MockJ Project Brain
              </h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {STATIC_KNOWLEDGE_BASE.length} built-in · {customEntries.length} custom
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowAddForm(v => !v); setEditingId(null); setExpandedId(null); }}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95',
                showAddForm
                  ? 'bg-[hsl(191_97%_55%_/_0.15)] border-[hsl(191_97%_55%_/_0.5)] text-[hsl(191_97%_55%)]'
                  : 'border-[hsl(191_97%_55%_/_0.4)] text-[hsl(191_97%_55%)] hover:bg-[hsl(191_97%_55%_/_0.1)]'
              )}
              title="Add new knowledge entry"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground border border-border hover:border-[hsl(191_97%_55%_/_0.4)] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Add Form ───────────────────────────────────────────────────────── */}
        {showAddForm && (
          <div className="px-5 py-4 border-b border-border shrink-0 bg-[hsl(224_15%_9%)]">
            <p className="text-[10px] font-semibold text-[hsl(191_97%_55%)] uppercase tracking-wider mb-3">
              + New Knowledge Entry
            </p>
            <EntryForm
              initial={BLANK_FORM}
              onSave={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* ── Search ─────────────────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setActiveTopic(null); }}
              placeholder="Search knowledge base…"
              className="w-full pl-9 pr-4 py-2 bg-[hsl(224_15%_10%)] border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(191_97%_55%_/_0.5)] transition-colors"
            />
          </div>
        </div>

        {/* ── Topic pills ────────────────────────────────────────────────────── */}
        {!searchQuery && (
          <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-border shrink-0">
            <button
              onClick={() => setActiveTopic(null)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                activeTopic === null
                  ? 'bg-[hsl(191_97%_55%)] text-[hsl(224_20%_6%)]'
                  : 'bg-[hsl(224_15%_12%)] text-muted-foreground border border-border hover:border-[hsl(191_97%_55%_/_0.4)] hover:text-foreground'
              )}
            >
              All ({allEntries.length})
            </button>
            {BRAIN_TOPICS.map(topic => {
              const count = allEntries.filter(topic.filter).length;
              return (
                <button
                  key={topic.id}
                  onClick={() => setActiveTopic(activeTopic === topic.id ? null : topic.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    activeTopic === topic.id
                      ? 'bg-[hsl(191_97%_55%)] text-[hsl(224_20%_6%)]'
                      : 'bg-[hsl(224_15%_12%)] text-muted-foreground border border-border hover:border-[hsl(191_97%_55%_/_0.4)] hover:text-foreground'
                  )}
                >
                  <span>{topic.emoji}</span>
                  {topic.label}
                  <span className="opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Entries list ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {displayedEntries.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No entries found{searchQuery ? ` for "${searchQuery}"` : ''}
            </div>
          )}

          {displayedEntries.map(entry => {
            const catMeta = CATEGORY_META[entry.category];
            const isExpanded = expandedId === entry.id;
            const isEditing = editingId === entry.id;
            const isDeleting = confirmDeleteId === entry.id;
            const custom = isCustomEntry(entry.id);

            return (
              <div
                key={entry.id}
                className={cn(
                  'rounded-xl border overflow-hidden transition-all duration-200',
                  custom
                    ? 'border-[hsl(265_80%_65%_/_0.35)] hover:border-[hsl(265_80%_65%_/_0.6)]'
                    : 'border-border hover:border-[hsl(191_97%_55%_/_0.3)]'
                )}
              >
                {/* Row header */}
                <div className="flex items-center gap-2 px-4 py-3 hover:bg-[hsl(224_15%_10%)] transition-colors">
                  <button
                    onClick={() => {
                      if (!isEditing) setExpandedId(isExpanded ? null : entry.id);
                    }}
                    className="flex items-center gap-3 flex-1 text-left min-w-0"
                  >
                    <span className="text-base shrink-0">{catMeta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-foreground truncate">{entry.title}</p>
                        {custom && (
                          <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: 'hsl(265 80% 65% / 0.18)', color: 'hsl(265 80% 75%)' }}>
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{
                            color: catMeta.color,
                            backgroundColor: catMeta.color.replace(')', ' / 0.1)').replace('hsl(', 'hsl('),
                          }}
                        >
                          {catMeta.label}
                        </span>
                        {entry.lastUpdated && (
                          <span className="text-[10px] text-muted-foreground/50">
                            {entry.lastUpdated}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Custom entry actions */}
                  {custom && !isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditingId(entry.id); setExpandedId(entry.id); setConfirmDeleteId(null); }}
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-[hsl(191_97%_55%)] hover:bg-[hsl(191_97%_55%_/_0.1)] transition-all"
                        title="Edit entry"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(isDeleting ? null : entry.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Expand chevron */}
                  {!custom && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="w-6 h-6 flex items-center justify-center shrink-0"
                    >
                      {isExpanded
                        ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      }
                    </button>
                  )}
                </div>

                {/* Delete confirmation */}
                {isDeleting && (
                  <div className="px-4 pb-3 pt-1 border-t border-border/50 bg-[hsl(0_70%_50%_/_0.06)]">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                      <p className="text-xs text-muted-foreground">Delete this custom entry permanently?</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-destructive text-destructive-foreground hover:opacity-90 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded / edit content */}
                {isExpanded && !isDeleting && (
                  <div className="px-4 pb-4 border-t border-border/50">
                    {isEditing && custom ? (
                      <div className="mt-3">
                        <EntryForm
                          initial={entryToForm(entry)}
                          onSave={f => handleUpdate(entry.id, f)}
                          onCancel={() => setEditingId(null)}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="mt-3 flex flex-wrap gap-1.5 mb-3">
                          {entry.keywords.slice(0, 8).map(kw => (
                            <span
                              key={kw}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(224_15%_12%)] text-muted-foreground border border-border"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {entry.content}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <div className="px-5 py-3 border-t border-border shrink-0">
          <p className="text-[10px] text-muted-foreground/50 text-center">
            {STATIC_KNOWLEDGE_BASE.length} built-in · {customEntries.length} custom · auto-injected into AI responses
          </p>
        </div>
      </div>
    </div>
  );
}
