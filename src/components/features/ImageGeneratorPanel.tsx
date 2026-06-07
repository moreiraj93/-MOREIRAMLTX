import { useState, useRef, useCallback, useEffect, TouchEvent } from 'react';
import {
  Image, Download, RefreshCw, Sparkles, Zap, Star, Upload, X, Wand2,
  Mic, MicOff, Shield, Droplets, User, Layers, Move, Crown,
  CheckCircle2, Lock, Award, ChevronDown, ChevronUp, History, Trash2,
  ZoomIn, Clock, Maximize2,
} from 'lucide-react';
import { ImageGenRequest } from '@/types/chat';
import { generateImage } from '@/lib/mockAI';
import { saveImageGeneration, loadImageHistory, deleteImageGeneration, ImageHistoryItem } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type PanelMode = 'generate' | 'edit' | 'history';

const STYLES: { value: ImageGenRequest['style']; label: string; emoji: string; desc: string }[] = [
  { value: 'realistic',  label: 'Realistic',   emoji: '📷', desc: 'Photo-real' },
  { value: 'artistic',   label: 'Artistic',    emoji: '🎨', desc: 'Fine art' },
  { value: 'anime',      label: 'Anime',       emoji: '✨', desc: 'Japanese' },
  { value: 'sketch',     label: 'Sketch',      emoji: '✏️', desc: 'Hand-drawn' },
  { value: 'cyberpunk',  label: 'Cyberpunk',   emoji: '🌆', desc: 'Neon future' },
  { value: 'watercolor', label: 'Watercolor',  emoji: '💧', desc: 'Soft paint' },
  { value: 'oil',        label: 'Oil Paint',   emoji: '🖼️', desc: 'Classic oil' },
  { value: '3d',         label: '3D Render',   emoji: '🔮', desc: 'CGI style' },
];

const RATIOS: { value: ImageGenRequest['aspectRatio']; label: string; desc: string; visualW: number; visualH: number }[] = [
  { value: '1:1',  label: '1:1',  desc: 'Square',    visualW: 32, visualH: 32 },
  { value: '16:9', label: '16:9', desc: 'Landscape', visualW: 40, visualH: 22 },
  { value: '9:16', label: '9:16', desc: 'Portrait',  visualW: 22, visualH: 40 },
  { value: '4:3',  label: '4:3',  desc: 'Standard',  visualW: 36, visualH: 27 },
];

const QUALITY_OPTIONS = [
  { value: '1K', label: 'Standard', icon: Zap,   desc: 'Fast · Good' },
  { value: '2K', label: 'HD',       icon: Star,  desc: 'Balanced · Great' },
  { value: '4K', label: 'Ultra',    icon: Crown, desc: 'Slow · Best', pro: true },
];

const GENERATE_PROMPTS = [
  'A neon-lit Tokyo street in heavy rain, cyberpunk aesthetic',
  'Majestic golden dragon soaring over ancient mountains at sunset',
  'Deep space nebula with a lone astronaut, reflection in visor',
  'Serene zen garden with floating cherry blossoms, ultra-detailed',
];

const EDIT_PROMPTS = [
  'Add a dramatic sunset sky with orange and pink clouds',
  'Change the background to a snowy winter landscape',
  'Add volumetric fog and mysterious cinematic lighting',
  'Make it look like a hand-painted watercolor artwork',
  'Add glowing neon accents and cyberpunk atmosphere',
  'Change to nighttime with glowing city lights reflected',
];

const LOADING_MESSAGES = [
  'Mixing pixels with imagination…',
  'Conjuring visual magic…',
  'Teaching neurons to paint…',
  'Rendering your vision…',
  'Almost there — adding final details…',
];
const EDIT_LOADING_MESSAGES = [
  'Analyzing your reference image…',
  'Understanding the creative direction…',
  'Applying transformations intelligently…',
  'Blending edits seamlessly…',
  'Finalizing your creation…',
];

const CREATOR_FEATURES = [
  { icon: Mic,          label: 'Voice Commands',        color: 'hsl(191 97% 55%)', desc: 'Speak your prompt' },
  { icon: Upload,       label: 'Reference Images',      color: 'hsl(265 80% 65%)', desc: 'Upload & transform' },
  { icon: RefreshCw,    label: 'Image-to-Image',        color: 'hsl(191 97% 55%)', desc: 'Edit any photo' },
  { icon: User,         label: 'Character Consistency', color: 'hsl(265 80% 65%)', desc: 'Keep faces stable' },
  { icon: Shield,       label: 'Face Preservation',     color: 'hsl(142 70% 55%)', desc: 'Identity-safe edits' },
  { icon: Move,         label: 'Pose Reference',        color: 'hsl(38 95% 60%)',  desc: 'Control the pose' },
  { icon: Layers,       label: 'Style Transfer',        color: 'hsl(191 97% 55%)', desc: 'Apply any style' },
  { icon: Lock,         label: 'Private Workspace',     color: 'hsl(265 80% 65%)', desc: 'Secure & private' },
  { icon: Droplets,     label: 'Watermark Control',     color: 'hsl(200 80% 60%)', desc: 'Add or remove' },
  { icon: Award,        label: 'Commercial License',    color: 'hsl(38 95% 60%)',  desc: 'Use commercially' },
];

function useVoiceInput(onTranscript: (t: string) => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognition | null>(null);
  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = useCallback(() => {
    if (!supported) { toast.error('Voice input not supported in this browser.'); return; }
    const SR = (window.SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition);
    const rec = new SR();
    rec.lang = 'en-US'; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join(' ').trim();
      if (text) onTranscript(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); toast.error('Voice input failed.'); };
    rec.start(); recRef.current = rec; setListening(true);
  }, [supported, onTranscript]);

  const stop = useCallback(() => { recRef.current?.stop(); setListening(false); }, []);
  return { listening, supported, start, stop };
}

export default function ImageGeneratorPanel() {
  const [panelMode, setPanelMode] = useState<PanelMode>('generate');

  const [prompt, setPrompt]   = useState('');
  const [style, setStyle]     = useState<ImageGenRequest['style']>('realistic');
  const [ratio, setRatio]     = useState<ImageGenRequest['aspectRatio']>('1:1');
  const [quality, setQuality] = useState('1K');

  const [charConsistency, setCharConsistency] = useState(false);
  const [facePreservation, setFacePreservation] = useState(false);
  const [addWatermark, setAddWatermark]         = useState(false);
  const [privateMode, setPrivateMode]           = useState(false);
  const [showAdvanced, setShowAdvanced]         = useState(false);

  // History
  const [historyItems, setHistoryItems]   = useState<ImageHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedItem, setExpandedItem]   = useState<ImageHistoryItem | null>(null);

  const [editPrompt, setEditPrompt]     = useState('');
  const [sourceImage, setSourceImage]   = useState<string | null>(null);
  const [sourceFileName, setSourceFileName] = useState('');
  const [dragging, setDragging]         = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading]           = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [result, setResult]             = useState<string | null>(null);
  const [resultPrompt, setResultPrompt] = useState('');
  const [error, setError]               = useState<string | null>(null);

  // ── Mobile fullscreen + pinch-to-zoom ─────────────────────────────────────
  const [fullscreenSrc, setFullscreenSrc] = useState<string | null>(null);
  const [fsScale, setFsScale]             = useState(1);
  const [fsOffset, setFsOffset]           = useState({ x: 0, y: 0 });
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const dragRef  = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
  const fsScaleRef   = useRef(1);
  const fsOffsetRef  = useRef({ x: 0, y: 0 });

  // Keep refs in sync so touch handlers have latest values without stale closures
  useEffect(() => { fsScaleRef.current  = fsScale;  }, [fsScale]);
  useEffect(() => { fsOffsetRef.current = fsOffset; }, [fsOffset]);

  const openFullscreen = useCallback((src: string) => {
    setFullscreenSrc(src);
    setFsScale(1);
    setFsOffset({ x: 0, y: 0 });
  }, []);

  const closeFullscreen = useCallback(() => {
    setFullscreenSrc(null);
    setFsScale(1);
    setFsOffset({ x: 0, y: 0 });
  }, []);

  const handleFsTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), scale: fsScaleRef.current };
      dragRef.current  = null;
    } else if (e.touches.length === 1 && fsScaleRef.current > 1) {
      dragRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        offsetX: fsOffsetRef.current.x,
        offsetY: fsOffsetRef.current.y,
      };
      pinchRef.current = null;
    }
  }, []);

  const handleFsTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const ratio = Math.hypot(dx, dy) / pinchRef.current.dist;
      const newScale = Math.min(5, Math.max(1, pinchRef.current.scale * ratio));
      setFsScale(newScale);
      if (newScale <= 1) setFsOffset({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && dragRef.current) {
      const dx = e.touches[0].clientX - dragRef.current.startX;
      const dy = e.touches[0].clientY - dragRef.current.startY;
      setFsOffset({ x: dragRef.current.offsetX + dx, y: dragRef.current.offsetY + dy });
    }
  }, []);

  const handleFsTouchEnd = useCallback(() => {
    pinchRef.current = null;
    dragRef.current  = null;
    if (fsScaleRef.current <= 1.05) {
      setFsScale(1);
      setFsOffset({ x: 0, y: 0 });
    }
  }, []);

  const voiceGenerate = useVoiceInput(t => setPrompt(p => p ? `${p} ${t}` : t));
  const voiceEdit     = useVoiceInput(t => setEditPrompt(p => p ? `${p} ${t}` : t));
  const voice = panelMode === 'generate' ? voiceGenerate : voiceEdit;

  useEffect(() => {
    if (panelMode !== 'history') return;
    setHistoryLoading(true);
    loadImageHistory().then(items => { setHistoryItems(items); setHistoryLoading(false); });
  }, [panelMode]);

  const loadFile = useCallback((file: File) => {
    if (file.size > 8 * 1024 * 1024) { setError('Image must be under 8MB'); return; }
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return; }
    setSourceFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => { setSourceImage(reader.result as string); setError(null); };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) loadFile(file);
  };

  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) { loadFile(file); if (panelMode === 'generate') setPanelMode('edit'); }
  };

  const clearSource = () => {
    setSourceImage(null); setSourceFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async (overridePrompt?: string, overrideStyle?: ImageGenRequest['style'], overrideRatio?: ImageGenRequest['aspectRatio'], overrideQuality?: string) => {
    const activePrompt = overridePrompt ?? (panelMode === 'generate' ? prompt : editPrompt).trim();
    if (!activePrompt || loading) return;
    if (panelMode === 'edit' && !sourceImage && !overridePrompt) return;

    const useStyle   = overrideStyle   ?? style;
    const useRatio   = overrideRatio   ?? ratio;
    const useQuality = overrideQuality ?? quality;

    setLoading(true); setResult(null); setError(null);
    setResultPrompt(activePrompt); setLoadingMsgIdx(0);

    const msgs = panelMode === 'edit' ? EDIT_LOADING_MESSAGES : LOADING_MESSAGES;
    const iv = setInterval(() => setLoadingMsgIdx(i => (i + 1) % msgs.length), 2500);

    let enhancedPrompt = activePrompt;
    if (charConsistency) enhancedPrompt += ', maintain consistent character identity and facial features';
    if (facePreservation) enhancedPrompt += ', preserve and protect facial identity';
    if (addWatermark) enhancedPrompt += ', add subtle watermark';

    try {
      const url = await generateImage({
        prompt: enhancedPrompt,
        style: useStyle,
        aspectRatio: useRatio,
        quality: useQuality,
        sourceImageDataUrl: panelMode === 'edit' ? (sourceImage ?? undefined) : undefined,
      });
      setResult(url);
      saveImageGeneration({
        prompt: activePrompt,
        style: useStyle,
        aspectRatio: useRatio,
        quality: useQuality,
        mode: (panelMode === 'history' ? 'generate' : panelMode) as 'generate' | 'edit',
        imageUrl: url,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.');
    } finally {
      clearInterval(iv);
      setLoading(false);
    }
  };

  const handleDownload = (src?: string) => {
    const href = src ?? result;
    if (!href) return;
    const a = document.createElement('a');
    a.href = href; a.download = `mockj-studio-${Date.now()}.png`; a.target = '_blank'; a.click();
  };

  const aspectVisual = RATIOS.find(r => r.value === ratio);
  const msgs = panelMode === 'edit' ? EDIT_LOADING_MESSAGES : LOADING_MESSAGES;
  const canSubmit = panelMode === 'generate'
    ? !!prompt.trim() && !loading
    : panelMode === 'edit'
    ? !!editPrompt.trim() && !!sourceImage && !loading
    : false;

  return (
    <>
    <div
      className="flex flex-col md:flex-row h-full overflow-y-auto md:overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ── Left Controls ─────────────────────────────────────────────────────── */}
      <div className="w-full md:w-80 md:shrink-0 border-b md:border-b-0 md:border-r border-border bg-[hsl(224_20%_5%)] flex flex-col">
        <div className="p-5 space-y-4">

          {/* Header */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'hsl(4 90% 58% / 0.12)', border: '1px solid hsl(4 90% 58% / 0.35)' }}>
              <Image className="w-4 h-4" style={{ color: 'hsl(4 90% 58%)' }} />
            </div>
            <div>
              <h2 className="font-black text-sm text-foreground leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                MOCKJ <span style={{ color: 'hsl(4 90% 58%)' }}>AI STUDIO</span>
              </h2>
              <p className="text-[10px] text-muted-foreground">Create Anything. Control Everything.</p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex rounded-xl border border-border overflow-hidden p-1 bg-[hsl(224_15%_9%)] gap-1">
            {(['generate', 'edit', 'history'] as PanelMode[]).map(m => (
              <button
                key={m}
                onClick={() => { setPanelMode(m); setResult(null); setError(null); }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-medium transition-all duration-200',
                  panelMode === m
                    ? 'bg-[hsl(265_80%_65%_/_0.15)] border border-[hsl(265_80%_65%_/_0.4)] text-[hsl(265_80%_65%)]'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {m === 'generate' ? <><Sparkles className="w-3 h-3" /> Generate</>
                  : m === 'edit'  ? <><Wand2    className="w-3 h-3" /> Edit</>
                  :                  <><History  className="w-3 h-3" /> History</>}
              </button>
            ))}
          </div>

          {/* GENERATE MODE */}
          {panelMode === 'generate' && (
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Describe your image</label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="A majestic wolf howling at the moon over snow-capped peaks…"
                  rows={4}
                  className="w-full bg-[hsl(224_15%_9%)] border border-border rounded-xl px-3.5 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none focus:border-[hsl(265_80%_65%_/_0.5)] transition-all duration-200 leading-relaxed"
                />
                <button
                  onClick={voice.listening ? voice.stop : voice.start}
                  className={cn(
                    'absolute right-2.5 bottom-2.5 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200',
                    voice.listening
                      ? 'bg-[hsl(0_70%_55%_/_0.15)] border border-[hsl(0_70%_55%_/_0.5)] text-[hsl(0_70%_55%)] animate-pulse'
                      : 'bg-[hsl(191_97%_55%_/_0.1)] border border-[hsl(191_97%_55%_/_0.3)] text-[hsl(191_97%_55%)] hover:bg-[hsl(191_97%_55%_/_0.18)]'
                  )}
                  title={voice.listening ? 'Stop recording' : 'Voice input'}
                >
                  {voice.listening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                </button>
              </div>
              {voice.listening && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(0_70%_55%_/_0.08)] border border-[hsl(0_70%_55%_/_0.3)]">
                  <div className="flex gap-0.5">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1 bg-[hsl(0_70%_55%)] rounded-full animate-bounce"
                        style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-[hsl(0_70%_55%)] font-medium">Listening… speak your prompt</span>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                {GENERATE_PROMPTS.map(idea => (
                  <button key={idea} onClick={() => setPrompt(idea)}
                    className="text-[10px] px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-[hsl(265_80%_65%_/_0.35)] hover:bg-[hsl(265_80%_65%_/_0.04)] transition-all text-left leading-relaxed">
                    {idea}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* EDIT MODE */}
          {panelMode === 'edit' && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Reference Image</label>
                {!sourceImage ? (
                  <button onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'w-full flex flex-col items-center gap-3 py-6 rounded-xl border-2 border-dashed transition-all duration-200 text-center group',
                      dragging ? 'border-[hsl(265_80%_65%)] bg-[hsl(265_80%_65%_/_0.08)]'
                               : 'border-border hover:border-[hsl(265_80%_65%_/_0.4)] hover:bg-[hsl(265_80%_65%_/_0.03)]'
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[hsl(265_80%_65%_/_0.08)] border border-[hsl(265_80%_65%_/_0.2)] flex items-center justify-center group-hover:border-[hsl(265_80%_65%_/_0.4)] transition-all">
                      <Upload className="w-4 h-4 text-[hsl(265_80%_65%_/_0.6)]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Click or drag &amp; drop image</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">PNG, JPG, WebP · Max 8MB</p>
                    </div>
                  </button>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-[hsl(265_80%_65%_/_0.3)]">
                    <img src={sourceImage} alt="Reference" className="w-full object-cover max-h-36" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm">
                        <CheckCircle2 className="w-3 h-3 text-[hsl(142_70%_55%)]" />
                        <span className="text-[10px] text-white font-medium truncate max-w-[120px]">{sourceFileName}</span>
                      </div>
                      <button onClick={clearSource}
                        className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-destructive/60 transition-all">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange} className="hidden" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Creative Direction</label>
                <div className="relative">
                  <textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)}
                    placeholder="Transform this into a cyberpunk scene with neon lighting…"
                    rows={3}
                    className="w-full bg-[hsl(224_15%_9%)] border border-border rounded-xl px-3.5 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none focus:border-[hsl(265_80%_65%_/_0.5)] transition-all duration-200 leading-relaxed"
                  />
                  <button onClick={voice.listening ? voice.stop : voice.start}
                    className={cn(
                      'absolute right-2.5 bottom-2.5 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200',
                      voice.listening
                        ? 'bg-[hsl(0_70%_55%_/_0.15)] border border-[hsl(0_70%_55%_/_0.5)] text-[hsl(0_70%_55%)] animate-pulse'
                        : 'bg-[hsl(191_97%_55%_/_0.1)] border border-[hsl(191_97%_55%_/_0.3)] text-[hsl(191_97%_55%)] hover:bg-[hsl(191_97%_55%_/_0.18)]'
                    )}
                    title={voice.listening ? 'Stop' : 'Voice input'}>
                    {voice.listening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {EDIT_PROMPTS.map(idea => (
                    <button key={idea} onClick={() => setEditPrompt(idea)}
                      className="text-[10px] px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-[hsl(265_80%_65%_/_0.35)] hover:bg-[hsl(265_80%_65%_/_0.04)] transition-all text-left">
                      {idea}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* HISTORY INFO */}
          {panelMode === 'history' && (
            <div className="p-4 rounded-xl border border-[hsl(265_80%_65%_/_0.2)] bg-[hsl(265_80%_65%_/_0.05)] space-y-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[hsl(265_80%_65%)]" />
                <p className="text-xs font-semibold text-foreground">Your Image History</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                All generated images are saved here. Click any image to expand, re-generate, or download it.
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="w-2 h-2 rounded-full bg-[hsl(142_70%_55%)]" />
                <span className="text-[10px] text-muted-foreground">Logged-in users: synced to cloud</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[hsl(38_95%_60%)]" />
                <span className="text-[10px] text-muted-foreground">Guests: stored locally (up to 50)</span>
              </div>
            </div>
          )}

          {/* Style */}
          {panelMode !== 'history' && (
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Style</label>
              <div className="grid grid-cols-3 md:grid-cols-2 gap-1.5">
                {STYLES.map(s => (
                  <button key={s.value} onClick={() => setStyle(s.value)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200',
                      style === s.value
                        ? 'bg-[hsl(265_80%_65%_/_0.12)] border-[hsl(265_80%_65%_/_0.45)] text-[hsl(265_80%_65%)]'
                        : 'border-border text-muted-foreground hover:border-[hsl(224_15%_22%)] hover:text-foreground'
                    )}>
                    <span>{s.emoji}</span>
                    <div className="text-left">
                      <div>{s.label}</div>
                      <div className="text-[9px] opacity-60">{s.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Aspect Ratio */}
          {panelMode === 'generate' && (
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Aspect Ratio</label>
              <div className="grid grid-cols-4 gap-1.5">
                {RATIOS.map(r => (
                  <button key={r.value} onClick={() => setRatio(r.value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-200',
                      ratio === r.value
                        ? 'bg-[hsl(265_80%_65%_/_0.1)] border-[hsl(265_80%_65%_/_0.45)] text-[hsl(265_80%_65%)]'
                        : 'border-border text-muted-foreground hover:border-[hsl(224_15%_22%)] hover:text-foreground'
                    )}>
                    <div className={cn('rounded-sm border transition-colors duration-200',
                      ratio === r.value
                        ? 'border-[hsl(265_80%_65%_/_0.7)] bg-[hsl(265_80%_65%_/_0.2)]'
                        : 'border-border bg-[hsl(224_15%_14%)]'
                    )} style={{ width: r.visualW * 0.55, height: r.visualH * 0.55 }} />
                    <span className="text-[9px] font-bold">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quality */}
          {panelMode !== 'history' && (
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Quality</label>
              <div className="grid grid-cols-3 gap-1.5">
                {QUALITY_OPTIONS.map(q => {
                  const Icon = q.icon;
                  return (
                    <button key={q.value} onClick={() => setQuality(q.value)}
                      className={cn(
                        'flex flex-col items-start gap-0.5 px-2.5 py-2.5 rounded-xl border transition-all duration-200',
                        quality === q.value
                          ? 'bg-[hsl(265_80%_65%_/_0.1)] border-[hsl(265_80%_65%_/_0.45)] text-[hsl(265_80%_65%)]'
                          : 'border-border text-muted-foreground hover:border-[hsl(224_15%_22%)] hover:text-foreground'
                      )}>
                      <div className="flex items-center gap-1">
                        <Icon className="w-3 h-3" />
                        <span className="text-[10px] font-bold">{q.label}</span>
                      </div>
                      <span className="text-[9px] opacity-60">{q.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Advanced Creator Options */}
          {panelMode !== 'history' && (
            <div className="rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setShowAdvanced(v => !v)}
                className="w-full flex items-center justify-between px-3.5 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Crown className="w-3.5 h-3.5 text-[hsl(265_80%_65%)]" />
                  Advanced Creator Options
                </span>
                {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showAdvanced && (
                <div className="px-3.5 pb-3.5 space-y-2 border-t border-border/50 pt-3">
                  {[
                    { icon: User, label: 'Character Consistency', sub: 'Stable identity across generations', color: 'hsl(265 80% 65%)', val: charConsistency, set: setCharConsistency },
                    { icon: Shield, label: 'Face Preservation', sub: 'Protect facial identity in edits', color: 'hsl(142 70% 55%)', val: facePreservation, set: setFacePreservation },
                    { icon: Lock, label: 'Private Workspace', sub: 'Images not stored in public gallery', color: 'hsl(200 80% 60%)', val: privateMode, set: setPrivateMode },
                    { icon: Droplets, label: 'Add Watermark', sub: 'Embed subtle MockJ watermark', color: 'hsl(38 95% 60%)', val: addWatermark, set: setAddWatermark },
                  ].map(({ icon: Icon, label, sub, color, val, set }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                        <div>
                          <p className="text-xs font-medium text-foreground">{label}</p>
                          <p className="text-[10px] text-muted-foreground">{sub}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => set(v => !v)}
                        className={cn('w-9 h-5 rounded-full transition-all duration-200 relative shrink-0')}
                        style={{ background: val ? color : 'hsl(224 15% 18%)' }}
                      >
                        <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200', val ? 'left-[18px]' : 'left-0.5')} />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(38_95%_60%_/_0.08)] border border-[hsl(38_95%_60%_/_0.25)]">
                    <Award className="w-3.5 h-3.5 text-[hsl(38_95%_60%)] shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-[hsl(38_95%_60%)]">Commercial Use Ready</p>
                      <p className="text-[9px] text-muted-foreground">All generated images are commercially licensed</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Generate button */}
        {panelMode !== 'history' && (
          <div className="sticky bottom-0 mt-auto p-4 border-t border-border bg-[hsl(224_20%_5%)] z-10">
            <button
              onClick={() => handleGenerate()}
              disabled={!canSubmit}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.97]',
                canSubmit
                  ? 'text-white hover:opacity-90 shadow-[0_0_20px_hsl(4_90%_58%_/_0.3)]'
                  : 'bg-[hsl(224_15%_12%)] text-muted-foreground cursor-not-allowed'
              )}
              style={canSubmit ? { background: 'linear-gradient(135deg, hsl(4 90% 58%), hsl(265 80% 65%))' } : undefined}
            >
              {loading
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> {panelMode === 'edit' ? 'Transforming…' : 'Creating…'}</>
                : panelMode === 'edit'
                ? <><Wand2 className="w-4 h-4" /> Transform Image</>
                : <><Sparkles className="w-4 h-4" /> Generate Image</>
              }
            </button>
            {panelMode === 'edit' && !sourceImage && (
              <p className="text-[10px] text-muted-foreground/50 text-center mt-2">Upload or drag a reference image to enable</p>
            )}
          </div>
        )}
      </div>

      {/* ── Right Panel ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[hsl(224_20%_6%)] overflow-hidden relative min-h-[320px] md:min-h-0">

        {/* HISTORY VIEW */}
        {panelMode === 'history' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5 sticky top-0 bg-[hsl(224_20%_6%)] pb-3 z-10">
              <div>
                <h3 className="font-bold text-foreground text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Image History</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{historyItems.length} generation{historyItems.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => { setHistoryLoading(true); loadImageHistory().then(items => { setHistoryItems(items); setHistoryLoading(false); }); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-[hsl(224_15%_24%)] transition-all"
              >
                <RefreshCw className={cn('w-3 h-3', historyLoading && 'animate-spin')} /> Refresh
              </button>
            </div>

            {historyLoading && (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-[hsl(265_80%_65%)] animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}</div>
                <p className="text-xs text-muted-foreground">Loading history…</p>
              </div>
            )}

            {!historyLoading && historyItems.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[hsl(265_80%_65%_/_0.08)] border border-[hsl(265_80%_65%_/_0.2)] flex items-center justify-center">
                  <Clock className="w-6 h-6 text-[hsl(265_80%_65%_/_0.5)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">No images yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Generate your first image to see it here.</p>
                </div>
              </div>
            )}

            {!historyLoading && historyItems.length > 0 && (
              <div className="columns-2 lg:columns-3 gap-3 space-y-3">
                {historyItems.map(item => (
                  <div
                    key={item.id}
                    className="break-inside-avoid group relative rounded-xl overflow-hidden border border-border hover:border-[hsl(265_80%_65%_/_0.4)] transition-all duration-200 cursor-pointer"
                    onClick={() => setExpandedItem(item)}
                  >
                    <img src={item.imageUrl} alt={item.prompt} className="w-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
                      <div className="flex justify-end">
                        <div className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <ZoomIn className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/90 line-clamp-2 leading-relaxed">"{item.prompt}"</p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/70">{item.style}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/70">{item.aspectRatio}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/70">{item.quality}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GENERATE / EDIT PREVIEW */}
        {panelMode !== 'history' && (
          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto relative">
            {dragging && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[hsl(265_80%_65%_/_0.12)] border-2 border-dashed border-[hsl(265_80%_65%)] rounded-2xl m-4 pointer-events-none">
                <Upload className="w-10 h-10 text-[hsl(265_80%_65%)] mb-3" />
                <p className="text-sm font-bold text-[hsl(265_80%_65%)]">Drop image to edit</p>
              </div>
            )}

            {/* Empty state */}
            {!loading && !result && !error && (
              <div className="text-center max-w-md w-full">
                <div className="mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'hsl(4 90% 58% / 0.1)', border: '1px solid hsl(4 90% 58% / 0.3)', boxShadow: '0 0 30px hsl(4 90% 58% / 0.15)' }}>
                    {panelMode === 'edit'
                      ? <Wand2 className="w-7 h-7" style={{ color: 'hsl(4 90% 58%)' }} />
                      : <Image className="w-7 h-7" style={{ color: 'hsl(4 90% 58%)' }} />}
                  </div>
                  <h3 className="font-black text-lg text-foreground mb-0.5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    MOCKJ <span style={{ color: 'hsl(4 90% 58%)', textShadow: '0 0 20px hsl(4 90% 58% / 0.5)' }}>AI STUDIO</span>
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'hsl(265 80% 65%)' }}>
                    {panelMode === 'edit' ? 'Transform. Reimagine. Create.' : 'Generate. Edit. Control.'}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    {panelMode === 'edit'
                      ? 'Upload any image as a reference — transform it with voice commands, style transfer, and advanced creator tools.'
                      : 'Describe your vision with text or voice. Choose style, ratio, and quality — MockJ AI brings it to life.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {CREATOR_FEATURES.map(f => (
                    <div key={f.label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border bg-[hsl(224_15%_8%)] hover:border-[hsl(265_80%_65%_/_0.3)] transition-all">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: f.color.replace(')', ' / 0.12)').replace('hsl(', 'hsl('),
                          border: `1px solid ${f.color.replace(')', ' / 0.3)').replace('hsl(', 'hsl(')}`,
                        }}>
                        <f.icon className="w-3.5 h-3.5" style={{ color: f.color }} />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-[11px] font-semibold text-foreground truncate">{f.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {panelMode === 'generate' && aspectVisual && (
                  <div className="flex items-center justify-center">
                    <div className="rounded-xl border-2 border-dashed border-[hsl(265_80%_65%_/_0.2)] bg-[hsl(265_80%_65%_/_0.04)] flex items-center justify-center"
                      style={{ width: aspectVisual.visualW * 3, height: aspectVisual.visualH * 3 }}>
                      <span className="text-[10px] text-muted-foreground/50">{ratio}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="w-full max-w-lg space-y-4 animate-message-in">
                <div className="w-full animate-shimmer rounded-2xl overflow-hidden border border-[hsl(265_80%_65%_/_0.15)]"
                  style={{ aspectRatio: ratio.replace(':', '/'), maxHeight: '480px' }} />
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-[hsl(265_80%_65%)] animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                  </div>
                  <p className="text-sm text-muted-foreground transition-all duration-500">{msgs[loadingMsgIdx]}</p>
                  {(charConsistency || facePreservation || privateMode) && (
                    <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground/60">
                      {charConsistency && <span className="flex items-center gap-1"><User className="w-3 h-3" /> Character lock active</span>}
                      {facePreservation && <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Face protected</span>}
                      {privateMode && <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Private mode</span>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Result */}
            {result && !loading && (
              <div className="w-full max-w-lg animate-message-in space-y-4">
                {panelMode === 'edit' && sourceImage ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest text-center">Original</p>
                      <div className="rounded-xl overflow-hidden border border-border">
                        <img src={sourceImage} alt="Original" className="w-full object-cover max-h-52" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-[hsl(265_80%_65%)] font-semibold uppercase tracking-widest text-center">Transformed</p>
                      <div className="relative rounded-xl overflow-hidden border border-[hsl(265_80%_65%_/_0.3)] shadow-[0_0_20px_hsl(265_80%_65%_/_0.1)] group/transformed">
                        <img src={result} alt={resultPrompt} className="w-full object-cover max-h-52" />
                        <button onClick={() => openFullscreen(result!)}
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-black/60 flex items-center justify-center text-white border border-white/20 md:opacity-0 md:group-hover/transformed:opacity-100 transition-all active:scale-90">
                          <Maximize2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden border border-[hsl(265_80%_65%_/_0.3)] shadow-[0_0_40px_hsl(265_80%_65%_/_0.1)] relative group/img">
                    <img src={result} alt={resultPrompt} className="w-full object-contain" style={{ maxHeight: '520px' }} />
                    {/* Always visible on mobile, hover on desktop */}
                    <button
                      onClick={() => openFullscreen(result!)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 md:opacity-0 md:group-hover/img:opacity-100 transition-all active:scale-90"
                      title="View fullscreen"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">"{resultPrompt}"</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-[10px] text-muted-foreground/50">
                        {STYLES.find(s => s.value === style)?.label} · {panelMode === 'generate' ? ratio : 'Reference Edit'} · {QUALITY_OPTIONS.find(q => q.value === quality)?.label}
                      </p>
                      {privateMode && <span className="flex items-center gap-1 text-[10px] text-[hsl(200_80%_60%)]"><Lock className="w-2.5 h-2.5" />Private</span>}
                      <span className="flex items-center gap-1 text-[10px] text-[hsl(38_95%_60%)]"><Award className="w-2.5 h-2.5" />Commercial</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleGenerate()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-[hsl(224_15%_24%)] transition-all">
                      <RefreshCw className="w-3 h-3" /> Redo
                    </button>
                    <button onClick={() => handleDownload()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[hsl(265_80%_65%_/_0.12)] border border-[hsl(265_80%_65%_/_0.35)] text-[hsl(265_80%_65%)] hover:bg-[hsl(265_80%_65%_/_0.22)] transition-all">
                      <Download className="w-3 h-3" /> Save
                    </button>
                    <button onClick={() => setPanelMode('history')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-[hsl(224_15%_24%)] transition-all">
                      <History className="w-3 h-3" /> History
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="w-full max-w-lg animate-message-in space-y-4">
                <div className="p-5 rounded-2xl border border-destructive/30 bg-destructive/5 text-center">
                  <p className="text-sm text-destructive font-medium mb-1">Generation failed</p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                </div>
                <button onClick={() => handleGenerate()} disabled={!canSubmit}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-[hsl(265_80%_65%_/_0.3)] text-[hsl(265_80%_65%)] hover:bg-[hsl(265_80%_65%_/_0.08)] transition-all">
                  <RefreshCw className="w-4 h-4" /> Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Lightbox (history item expand) ───────────────────────────────────── */}
      {expandedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setExpandedItem(null)}>
          <div className="relative bg-[hsl(224_15%_8%)] border border-border rounded-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-[hsl(265_80%_65%)]" />
                <span className="text-xs font-semibold text-foreground">Image Detail</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => handleDownload(expandedItem.imageUrl)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[hsl(265_80%_65%_/_0.12)] border border-[hsl(265_80%_65%_/_0.35)] text-[hsl(265_80%_65%)] hover:bg-[hsl(265_80%_65%_/_0.22)] transition-all">
                  <Download className="w-3 h-3" /> Download
                </button>
                <button onClick={() => {
                  setPrompt(expandedItem.prompt);
                  setStyle(expandedItem.style as ImageGenRequest['style']);
                  setRatio(expandedItem.aspectRatio as ImageGenRequest['aspectRatio']);
                  setQuality(expandedItem.quality);
                  setPanelMode('generate');
                  setExpandedItem(null);
                  toast.success('Settings restored — ready to re-generate');
                }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[hsl(4_90%_58%_/_0.35)] text-[hsl(4_90%_58%)] bg-[hsl(4_90%_58%_/_0.08)] hover:bg-[hsl(4_90%_58%_/_0.16)] transition-all">
                  <RefreshCw className="w-3 h-3" /> Re-generate
                </button>
                <button onClick={() => openFullscreen(expandedItem.imageUrl)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:text-foreground transition-all" title="Fullscreen">
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={async () => {
                  await deleteImageGeneration(expandedItem.id);
                  setHistoryItems(prev => prev.filter(i => i.id !== expandedItem.id));
                  setExpandedItem(null);
                  toast.success('Deleted from history');
                }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setExpandedItem(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:text-foreground transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto">
              <img src={expandedItem.imageUrl} alt={expandedItem.prompt} className="w-full object-contain" style={{ maxHeight: '60vh' }} />
              <div className="p-4 space-y-3">
                <p className="text-sm text-foreground leading-relaxed">"{expandedItem.prompt}"</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Style',   value: expandedItem.style },
                    { label: 'Ratio',   value: expandedItem.aspectRatio },
                    { label: 'Quality', value: expandedItem.quality },
                    { label: 'Mode',    value: expandedItem.mode },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[hsl(224_15%_12%)] border border-border">
                      <span className="text-[10px] text-muted-foreground">{label}:</span>
                      <span className="text-[10px] font-semibold text-foreground capitalize">{value}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[hsl(224_15%_12%)] border border-border">
                    <span className="text-[10px] text-muted-foreground">Created:</span>
                    <span className="text-[10px] font-semibold text-foreground">
                      {new Date(expandedItem.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* ── Mobile / Desktop Fullscreen Image Viewer ─────────────────────────── */}
    {fullscreenSrc && (
      <div
        className="fixed inset-0 z-[60] bg-black flex flex-col"
        style={{ touchAction: 'none' }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-black/80 backdrop-blur-sm z-10 absolute top-0 inset-x-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white/80">
              {fsScale > 1 ? `${Math.round(fsScale * 100)}%` : 'Pinch to zoom'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setFsScale(1); setFsOffset({ x: 0, y: 0 }); }}
              disabled={fsScale <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 border border-white/20 disabled:opacity-30 hover:text-white transition-all"
            >
              Reset zoom
            </button>
            <button
              onClick={() => handleDownload(fullscreenSrc)}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all active:scale-90"
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={closeFullscreen}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all active:scale-90"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Image container — intercept touch for pinch/drag */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden select-none"
          style={{ touchAction: 'none', cursor: fsScale > 1 ? 'grab' : 'default' }}
          onTouchStart={handleFsTouchStart}
          onTouchMove={handleFsTouchMove}
          onTouchEnd={handleFsTouchEnd}
          onDoubleClick={() => {
            if (fsScale > 1) { setFsScale(1); setFsOffset({ x: 0, y: 0 }); }
            else { setFsScale(2.5); }
          }}
        >
          <img
            src={fullscreenSrc}
            alt="Fullscreen view"
            draggable={false}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transform: `scale(${fsScale}) translate(${fsOffset.x / fsScale}px, ${fsOffset.y / fsScale}px)`,
              transition: pinchRef.current || dragRef.current ? 'none' : 'transform 0.2s ease',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          />
        </div>

        {/* Zoom hint */}
        {fsScale <= 1 && (
          <div className="absolute bottom-8 inset-x-0 flex justify-center pointer-events-none">
            <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] text-white/60">
              Pinch to zoom · Double-tap to zoom in
            </div>
          </div>
        )}
      </div>
    )}
    </>
  );
}
