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
  sourceImageDataUrl?: string; // for image editing
}

export interface VideoGenRequest {
  prompt: string;
  duration: '5s' | '10s' | '15s';
  style: 'cinematic' | 'animation' | 'documentary' | 'abstract';
}

export interface VideoTask {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed';
  progress: number;
  videoUrl?: string;
  error?: string;
}
