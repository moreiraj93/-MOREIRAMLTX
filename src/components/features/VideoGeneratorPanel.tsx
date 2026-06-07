import { useState, useEffect, useRef } from 'react';
import { Video, RefreshCw, Sparkles, Download, Play, Pause, Clock, Loader2, CheckCircle2, AlertCircle, History, Film } from 'lucide-react';
import { VideoGenRequest } from '@/types/chat';
import { createVideoTask, checkVideoTask } from '@/lib/mockAI';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const STYLES: { value: VideoGenRequest['style']; label: string; desc: string; emoji: string }[] = [
  { value: 'cinematic', label: 'Cinematic', desc: 'Film-grade quality', emoji: '🎬' },
  { value: 'animation', label: 'Animation', desc: 'Vivid & stylized', emoji: '✨' },
  { value: 'documentary', label: 'Documentary', desc: 'Natural & real', emoji: '🎥' },
  { value: 'abstract', label: 'Abstract', desc: 'Artistic motion', emoji: '🌀' },
];

const DURATIONS: { value: VideoGenRequest['duration']; label: string; seconds: number }[] = [
  { value: '5s', label: '5 sec', seconds: 5 },
  { value: '10s', label: '10 sec', seconds: 10 },
  { value: '15s', label: '15 sec', seconds: 15 },
];

const RATIOS = [
  { value: '16:9', label: '16:9', desc: 'Landscape', soraRatio: 'landscape' },
  { value: '9:16', label: '9:16', desc: 'Portrait', soraRatio: 'portrait' },
  { value: '1:1', label: '1:1', desc: 'Square', soraRatio: 'square' },
];

const PROMPT_IDEAS = [
  'Ocean waves crashing on a volcanic black sand beach at golden hour, cinematic wide shot',
  'Time-lapse of a futuristic city skyline transforming from day to night, rain reflects neon signs',
  'Abstract geometric shapes morphing and dissolving in a dark digital void, electronic pulse',
  'Dense ancient forest fog slowly dissolving as shafts of morning sunlight break through the canopy',
];

const POLLING_STATUS_MESSAGES = [
  'Starting your video generation...',
  'Sora AI is analyzing your prompt...',
  'Rendering frames...',
  'Adding motion and lighting...',
  'Applying cinematic effects...',
  'Finalizing your video...',
  'Almost ready — polishing final frames...',
];

type TaskStatus = 'idle' | 'creating' | 'polling' | 'succeeded' | 'failed';
type PanelMode = 'generate' | 'history';

interface VideoHistoryItem {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  size?: number;
}

export default function VideoGeneratorPanel() {
  const [panelMode, setPanelMode] = useState<PanelMode>('generate');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<VideoGenRequest['style']>('cinematic');
  const [duration, setDuration] = useState<VideoGenRequest['duration']>('5s');
  const [ratio, setRatio] = useState('16:9');

  const [taskStatus, setTaskStatus] = useState<TaskStatus>('idle');
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsgIdx, setStatusMsgIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [historyItems, setHistoryItems] = useState<VideoHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedHistoryVideo, setSelectedHistoryVideo] = useState<VideoHistoryItem | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusMsgRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUploadedRef = useRef(false);

  const stopPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (statusMsgRef.current) clearInterval(statusMsgRef.current);
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    pollingRef.current = null;
    statusMsgRef.current = null;
    elapsedRef.current = null;
  };

  useEffect(() => () => stopPolling(), []);

  const loadVideoHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    const { data, error } = await supabase.storage
      .from('videos')
      .list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) {
      setHistoryItems([]);
      setSelectedHistoryVideo(null);
      setHistoryError(error.message);
      setHistoryLoading(false);
      return;
    }

    const videos = (data ?? [])
      .filter(file => file.name.toLowerCase().endsWith('.mp4'))
      .map(file => {
        const { data: publicData } = supabase.storage.from('videos').getPublicUrl(file.name);
        return {
          id: file.id ?? file.name,
          name: file.name,
          url: publicData.publicUrl,
          createdAt: file.created_at ?? file.updated_at ?? new Date().toISOString(),
          size: file.metadata?.size as number | undefined,
        };
      });

    setHistoryItems(videos);
    setSelectedHistoryVideo(videos[0] ?? null);
    setHistoryLoading(false);
  };

  useEffect(() => {
    if (panelMode === 'history') {
      loadVideoHistory();
    }
  }, [panelMode]);

  const startPolling = (id: string) => {
    videoUploadedRef.current = false;
    setElapsedSeconds(0);

    // Elapsed timer
    elapsedRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);

    // Rotate status messages
    statusMsgRef.current = setInterval(() => {
      setStatusMsgIdx(i => (i + 1) % POLLING_STATUS_MESSAGES.length);
    }, 4000);

    // Poll every 5 seconds
    pollingRef.current = setInterval(async () => {
      if (videoUploadedRef.current) return;
      try {
        const task = await checkVideoTask(id);
        setProgress(task.progress);

        if (task.status === 'succeeded' && task.videoUrl) {
          if (videoUploadedRef.current) return;
          videoUploadedRef.current = true;
          stopPolling();
          setVideoUrl(task.videoUrl);
          setTaskStatus('succeeded');
          if (panelMode === 'history') loadVideoHistory();
        } else if (task.status === 'failed') {
          stopPolling();
          setErrorMsg(task.error ?? 'Video generation failed');
          setTaskStatus('failed');
        }
        // still starting/processing — continue polling
      } catch (err) {
        stopPolling();
        setErrorMsg(err instanceof Error ? err.message : 'Polling error');
        setTaskStatus('failed');
      }
    }, 5000);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || taskStatus === 'creating' || taskStatus === 'polling') return;

    stopPolling();
    setTaskStatus('creating');
    setVideoUrl(null);
    setErrorMsg(null);
    setPredictionId(null);
    setProgress(0);
    setStatusMsgIdx(0);

    try {
      const task = await createVideoTask({ prompt: prompt.trim(), style, duration, aspectRatio: ratio });
      setPredictionId(task.id);
      setTaskStatus('polling');
      startPolling(task.id);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to start video generation');
      setTaskStatus('failed');
    }
  };

  const handleReset = () => {
    stopPolling();
    setTaskStatus('idle');
    setVideoUrl(null);
    setErrorMsg(null);
    setPredictionId(null);
    setProgress(0);
  };

  const handleDownload = (url = videoUrl, name?: string) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = name ?? `mockj-video-${Date.now()}.mp4`;
    a.target = '_blank';
    a.click();
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const isLoading = taskStatus === 'creating' || taskStatus === 'polling';

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const formatSize = (size?: number) => {
    if (!size) return 'Video file';
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[hsl(224_20%_6%)] md:flex-row md:overflow-hidden">
      {/* Left — Controls */}
      <div className="flex w-full shrink-0 flex-col border-b border-border bg-[hsl(224_20%_5%)] md:h-full md:w-80 md:border-b-0 md:border-r md:overflow-y-auto">
        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[hsl(191_97%_55%_/_0.1)] border border-[hsl(191_97%_55%_/_0.3)] flex items-center justify-center shrink-0">
              <Video className="w-4 h-4 text-[hsl(191_97%_55%)]" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Video Studio
              </h2>
              <p className="text-[10px] text-muted-foreground">Powered by OpenAI Sora 2</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-[hsl(224_15%_9%)] p-1">
            {([
              { mode: 'generate' as const, label: 'Generate', icon: Sparkles },
              { mode: 'history' as const, label: 'Video History', icon: History },
            ]).map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setPanelMode(mode)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition-all duration-200',
                  panelMode === mode
                    ? 'border border-[hsl(191_97%_55%_/_0.4)] bg-[hsl(191_97%_55%_/_0.13)] text-[hsl(191_97%_60%)]'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Prompt */}
          {panelMode === 'generate' && <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Scene Description</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="A majestic eagle soaring over snow-capped mountains at golden hour..."
              rows={4}
              disabled={isLoading}
              className="w-full bg-[hsl(224_15%_9%)] border border-border rounded-xl px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none focus:border-[hsl(191_97%_55%_/_0.5)] focus:shadow-[0_0_12px_hsl(191_97%_55%_/_0.08)] transition-all duration-200 leading-relaxed disabled:opacity-50"
            />
            <div className="flex flex-col gap-1.5">
              {PROMPT_IDEAS.map(idea => (
                <button
                  key={idea}
                  onClick={() => setPrompt(idea)}
                  disabled={isLoading}
                  className="text-[10px] px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-[hsl(191_97%_55%_/_0.35)] hover:bg-[hsl(191_97%_55%_/_0.04)] transition-all duration-150 text-left leading-relaxed disabled:opacity-50"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>}

          {/* Style */}
          {panelMode === 'generate' && <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Visual Style</label>
            <div className="grid grid-cols-2 gap-1.5">
              {STYLES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  disabled={isLoading}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 disabled:opacity-50',
                    style === s.value
                      ? 'bg-[hsl(191_97%_55%_/_0.12)] border-[hsl(191_97%_55%_/_0.45)] text-[hsl(191_97%_55%)]'
                      : 'border-border text-muted-foreground hover:border-[hsl(224_15%_22%)] hover:text-foreground'
                  )}
                >
                  <span>{s.emoji}</span> {s.label}
                </button>
              ))}
            </div>
          </div>}

          {/* Duration */}
          {panelMode === 'generate' && <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Duration</label>
            <div className="grid grid-cols-3 gap-1.5">
              {DURATIONS.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  disabled={isLoading}
                  className={cn(
                    'py-2 rounded-lg text-xs font-medium border transition-all duration-200 disabled:opacity-50',
                    duration === d.value
                      ? 'bg-[hsl(191_97%_55%_/_0.12)] border-[hsl(191_97%_55%_/_0.45)] text-[hsl(191_97%_55%)]'
                      : 'border-border text-muted-foreground hover:border-[hsl(224_15%_22%)] hover:text-foreground'
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>}

          {/* Aspect Ratio */}
          {panelMode === 'generate' && <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-1.5">
              {RATIOS.map(r => (
                <button
                  key={r.value}
                  onClick={() => setRatio(r.value)}
                  disabled={isLoading}
                  className={cn(
                    'py-2 rounded-lg text-xs font-medium border transition-all duration-200 disabled:opacity-50',
                    ratio === r.value
                      ? 'bg-[hsl(191_97%_55%_/_0.12)] border-[hsl(191_97%_55%_/_0.45)] text-[hsl(191_97%_55%)]'
                      : 'border-border text-muted-foreground hover:border-[hsl(224_15%_22%)] hover:text-foreground'
                  )}
                >
                  <div className="text-[9px] opacity-70">{r.desc}</div>
                  <div className="font-bold">{r.label}</div>
                </button>
              ))}
            </div>
          </div>}

          {panelMode === 'history' && (
            <div className="space-y-3 rounded-xl border border-[hsl(191_97%_55%_/_0.18)] bg-[hsl(191_97%_55%_/_0.05)] p-4">
              <div className="flex items-start gap-3">
                <Film className="mt-0.5 h-4 w-4 text-[hsl(191_97%_60%)]" />
                <div>
                  <p className="text-xs font-bold text-foreground">Saved Sora videos</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                    Loads generated MP4 files from the Supabase <span className="font-semibold text-[hsl(191_97%_62%)]">videos</span> bucket.
                  </p>
                </div>
              </div>
              <button
                onClick={loadVideoHistory}
                disabled={historyLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[hsl(191_97%_55%_/_0.3)] px-3 py-2 text-xs font-semibold text-[hsl(191_97%_62%)] transition hover:bg-[hsl(191_97%_55%_/_0.08)] disabled:opacity-50"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', historyLoading && 'animate-spin')} />
                Refresh History
              </button>
            </div>
          )}
        </div>

        {/* Generate button */}
        {panelMode === 'generate' && <div className="sticky bottom-0 z-20 mt-auto border-t border-border bg-[hsl(224_20%_5%_/_0.96)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur md:static">
          {isLoading ? (
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-all duration-200"
            >
              <AlertCircle className="w-4 h-4" /> Cancel Generation
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.97]',
                prompt.trim()
                  ? 'bg-[hsl(191_97%_55%)] text-[hsl(224_20%_6%)] hover:bg-[hsl(191_97%_65%)] shadow-[0_0_20px_hsl(191_97%_55%_/_0.3)]'
                  : 'bg-[hsl(224_15%_12%)] text-muted-foreground cursor-not-allowed'
              )}
            >
              <Sparkles className="w-4 h-4" /> Generate Video
            </button>
          )}
        </div>}
      </div>

      {/* Right — Preview */}
      <div className="flex min-h-[70svh] flex-1 flex-col items-center justify-center bg-[hsl(224_20%_6%)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6 md:min-h-0 md:overflow-y-auto md:p-8">
        {panelMode === 'history' && (
          <div className="flex h-full w-full max-w-6xl flex-col gap-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Video History
                </h3>
                <p className="text-xs text-muted-foreground">
                  {historyItems.length} saved video{historyItems.length === 1 ? '' : 's'} in the videos bucket
                </p>
              </div>
              <button
                onClick={loadVideoHistory}
                disabled={historyLoading}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground sm:mt-0"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', historyLoading && 'animate-spin')} />
                Refresh
              </button>
            </div>

            {selectedHistoryVideo && (
              <div className="overflow-hidden rounded-2xl border border-[hsl(191_97%_55%_/_0.28)] bg-black shadow-[0_0_40px_hsl(191_97%_55%_/_0.1)]">
                <video
                  key={selectedHistoryVideo.url}
                  src={selectedHistoryVideo.url}
                  controls
                  playsInline
                  className="h-[58svh] w-full object-contain md:h-[42vh]"
                />
              </div>
            )}

            {historyLoading && (
              <div className="flex min-h-64 items-center justify-center rounded-2xl border border-border bg-[hsl(224_15%_9%)]">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-[hsl(191_97%_55%)]" />
                  Loading videos...
                </div>
              </div>
            )}

            {!historyLoading && historyError && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center">
                <AlertCircle className="mx-auto mb-2 h-6 w-6 text-destructive" />
                <p className="text-sm font-semibold text-destructive">Could not load video history</p>
                <p className="mt-1 text-xs text-muted-foreground">{historyError}</p>
              </div>
            )}

            {!historyLoading && !historyError && historyItems.length === 0 && (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-border bg-[hsl(224_15%_9%)] p-6 text-center">
                <History className="mb-3 h-8 w-8 text-[hsl(191_97%_55%_/_0.55)]" />
                <p className="text-sm font-semibold text-foreground">No saved videos yet</p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                  Generate a Sora video and MockJ will store the finished MP4 in the Supabase videos bucket.
                </p>
              </div>
            )}

            {!historyLoading && historyItems.length > 0 && (
              <div className="grid max-h-[80svh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                {historyItems.map(item => (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedHistoryVideo(item)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedHistoryVideo(item);
                      }
                    }}
                    className={cn(
                      'group cursor-pointer overflow-hidden rounded-xl border bg-[hsl(224_15%_9%)] text-left transition hover:-translate-y-0.5 hover:border-[hsl(191_97%_55%_/_0.38)] focus:outline-none focus:ring-2 focus:ring-[hsl(191_97%_55%_/_0.45)]',
                      selectedHistoryVideo?.id === item.id ? 'border-[hsl(191_97%_55%_/_0.55)]' : 'border-border'
                    )}
                  >
                    <div className="relative aspect-video bg-black">
                      <video
                        src={item.url}
                        preload="metadata"
                        muted
                        playsInline
                        className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/18">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(191_97%_55%_/_0.9)] shadow-[0_0_24px_hsl(191_97%_55%_/_0.45)]">
                          <Play className="ml-0.5 h-4 w-4 text-[hsl(224_20%_6%)]" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground">{item.name}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {formatSize(item.size)} · {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleDownload(item.url, item.name);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(191_97%_55%_/_0.32)] px-2.5 py-1.5 text-[10px] font-semibold text-[hsl(191_97%_62%)] transition hover:bg-[hsl(191_97%_55%_/_0.1)]"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {panelMode === 'generate' && (
        <>
        {/* IDLE */}
        {taskStatus === 'idle' && (
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-[hsl(191_97%_55%_/_0.08)] border border-[hsl(191_97%_55%_/_0.2)] flex items-center justify-center mx-auto mb-4">
              <Video className="w-7 h-7 text-[hsl(191_97%_55%_/_0.5)]" />
            </div>
            <h3 className="font-semibold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Your studio is ready
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Describe a scene and let Sora AI bring it to life as a real video.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(191_97%_55%_/_0.08)] border border-[hsl(191_97%_55%_/_0.2)]">
              <Clock className="w-3 h-3 text-[hsl(191_97%_55%)]" />
              <span className="text-[11px] text-[hsl(191_97%_55%)]">Generation takes 1–3 minutes</span>
            </div>
          </div>
        )}

        {/* LOADING */}
        {(taskStatus === 'creating' || taskStatus === 'polling') && (
          <div className="w-full max-w-lg space-y-5 animate-message-in md:max-w-xl">
            {/* Animated video placeholder */}
            <div
              className="w-full animate-shimmer rounded-2xl overflow-hidden border border-[hsl(191_97%_55%_/_0.15)] flex items-center justify-center"
              style={{ aspectRatio: ratio.replace(':', '/'), maxHeight: 'min(68svh, 460px)', minHeight: '220px' }}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full border-2 border-[hsl(191_97%_55%_/_0.3)] border-t-[hsl(191_97%_55%)] animate-spin" />
              </div>
            </div>

            {/* Status */}
            <div className="bg-[hsl(224_15%_9%)] border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[hsl(191_97%_55%)] animate-spin" />
                  <span className="text-sm font-medium text-foreground">Generating with Sora 2</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatElapsed(elapsedSeconds)}
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="h-1.5 bg-[hsl(224_15%_14%)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[hsl(191_97%_55%)] to-[hsl(191_97%_70%)] rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(5, progress || (taskStatus === 'polling' ? Math.min(90, elapsedSeconds * 1.5) : 5))}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground transition-all duration-500">
                  {POLLING_STATUS_MESSAGES[statusMsgIdx]}
                </p>
              </div>

              {predictionId && (
                <p className="text-[10px] text-muted-foreground/40 font-mono">
                  Task: {predictionId.slice(0, 16)}...
                </p>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground/50 text-center">
              Video generation typically takes 1–3 minutes. You can close this tab and come back.
            </p>
          </div>
        )}

        {/* SUCCEEDED */}
        {taskStatus === 'succeeded' && videoUrl && (
          <div className="w-full max-w-3xl animate-message-in space-y-4">
            <div className="relative h-[68svh] overflow-hidden rounded-2xl border border-[hsl(191_97%_55%_/_0.3)] bg-black shadow-[0_0_40px_hsl(191_97%_55%_/_0.1)] md:h-auto">
              <video
                ref={videoRef}
                src={videoUrl}
                loop
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="h-full w-full object-contain md:h-auto"
                style={{ maxHeight: 'min(72svh, 560px)' }}
              />
              {/* Play overlay when paused */}
              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-all duration-200 group"
                >
                  <div className="w-16 h-16 rounded-full bg-[hsl(191_97%_55%_/_0.9)] flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-[0_0_30px_hsl(191_97%_55%_/_0.5)]">
                    <Play className="w-7 h-7 text-[hsl(224_20%_6%)] ml-1" />
                  </div>
                </button>
              )}
              {isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-all duration-150"
                >
                  <Pause className="w-3.5 h-3.5 text-white" />
                </button>
              )}
              {/* Success badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(191_97%_55%_/_0.15)] border border-[hsl(191_97%_55%_/_0.4)] backdrop-blur-sm">
                <CheckCircle2 className="w-3 h-3 text-[hsl(191_97%_55%)]" />
                <span className="text-[10px] font-semibold text-[hsl(191_97%_55%)]">MockJ · Generated by Sora 2</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">"{prompt}"</p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                  {STYLES.find(s => s.value === style)?.label} · {duration} · {ratio}
                  {' · '}{formatElapsed(elapsedSeconds)} to generate
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-[hsl(224_15%_24%)] transition-all duration-150"
                >
                  <RefreshCw className="w-3 h-3" /> New
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[hsl(191_97%_55%_/_0.12)] border border-[hsl(191_97%_55%_/_0.35)] text-[hsl(191_97%_55%)] hover:bg-[hsl(191_97%_55%_/_0.22)] transition-all duration-150"
                >
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAILED */}
        {taskStatus === 'failed' && (
          <div className="w-full max-w-lg animate-message-in space-y-4">
            <div className="p-5 rounded-2xl border border-destructive/30 bg-destructive/5 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
              <p className="text-sm text-destructive font-medium">Video generation failed</p>
              <p className="text-xs text-muted-foreground">{errorMsg}</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-[hsl(191_97%_55%_/_0.3)] text-[hsl(191_97%_55%)] hover:bg-[hsl(191_97%_55%_/_0.08)] transition-all duration-150"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
