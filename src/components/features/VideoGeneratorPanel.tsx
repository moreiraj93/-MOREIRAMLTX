import { useState, useEffect, useRef } from 'react';
import { Video, RefreshCw, Sparkles, Download, Play, Pause, Clock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { VideoGenRequest } from '@/types/chat';
import { createVideoTask, checkVideoTask } from '@/lib/mockAI';
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

export default function VideoGeneratorPanel() {
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

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `mocka-video-${Date.now()}.mp4`;
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

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left — Controls */}
      <div className="w-80 shrink-0 border-r border-border bg-[hsl(224_20%_5%)] flex flex-col overflow-y-auto">
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

          {/* Prompt */}
          <div className="space-y-2">
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
          </div>

          {/* Style */}
          <div className="space-y-2">
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
          </div>

          {/* Duration */}
          <div className="space-y-2">
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
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
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
          </div>
        </div>

        {/* Generate button */}
        <div className="mt-auto p-4 border-t border-border">
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
        </div>
      </div>

      {/* Right — Preview */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[hsl(224_20%_6%)] overflow-y-auto">
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
          <div className="w-full max-w-lg space-y-5 animate-message-in">
            {/* Animated video placeholder */}
            <div
              className="w-full animate-shimmer rounded-2xl overflow-hidden border border-[hsl(191_97%_55%_/_0.15)] flex items-center justify-center"
              style={{ aspectRatio: ratio.replace(':', '/'), maxHeight: '400px', minHeight: '200px' }}
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
          <div className="w-full max-w-lg animate-message-in space-y-4">
            <div className="rounded-2xl overflow-hidden border border-[hsl(191_97%_55%_/_0.3)] shadow-[0_0_40px_hsl(191_97%_55%_/_0.1)] bg-black relative">
              <video
                ref={videoRef}
                src={videoUrl}
                loop
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full object-contain"
                style={{ maxHeight: '450px' }}
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
      </div>
    </div>
  );
}
