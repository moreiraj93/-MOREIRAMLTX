export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
  mediaPrompt?: string;
  timestamp: Date;
  streaming?: boolean;
  userAvatar?: string; // custom avatar URL for user messages
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  mode: ChatMode;
}

export type ChatMode = 'chat' | 'image' | 'video';

export interface ImageGenRequest {
  prompt: string;
  style: 'realistic' | 'artistic' | 'anime' | 'sketch' | 'cyberpunk' | 'watercolor' | 'oil' | '3d';
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3';
  quality?: string;
  modelVersion?: string;
  sourceImageDataUrl?: string; // for image editing
  charConsistency?: boolean;
  facePreservation?: boolean;
  addWatermark?: boolean;
  privateMode?: boolean;
}

export type VideoStyle = 'cinematic' | 'animation' | 'documentary' | 'abstract';
export type VideoDuration = '4s' | '8s' | '12s';
export type VideoAspectRatio = '16:9' | '9:16' | '1:1';

export interface VideoGenRequest {
  prompt: string;
  duration: VideoDuration;
  style: VideoStyle;
  aspectRatio?: VideoAspectRatio;
}

export interface VideoTask {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed';
  progress: number;
  videoUrl?: string;
  error?: string;
}
