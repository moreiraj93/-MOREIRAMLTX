import { Conversation, Message, ChatMode } from '@/types/chat';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'mocka_conversations';

// ── Local helpers ─────────────────────────────────────────────────────────────

function parseConversation(c: Conversation): Conversation {
  return {
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
    messages: (c.messages ?? []).map((m: Message) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })),
  };
}

// ── Local (localStorage) ─────────────────────────────────────────────────────

export function saveConversationsLocal(conversations: Conversation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function loadConversationsLocal(): Conversation[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return parsed.map(parseConversation);
  } catch {
    return [];
  }
}

// ── Supabase (cloud) ─────────────────────────────────────────────────────────

export async function loadConversationsFromCloud(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('Failed to load conversations from cloud:', error.message);
    return loadConversationsLocal();
  }

  return (data ?? []).map(row => parseConversation({
    id: row.id,
    title: row.title,
    mode: row.mode as ChatMode,
    messages: row.messages ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function upsertConversationToCloud(conv: Conversation): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('conversations')
    .upsert({
      id: conv.id,
      user_id: user.id,
      title: conv.title,
      mode: conv.mode,
      messages: conv.messages,
      created_at: conv.createdAt.toISOString(),
      updated_at: conv.updatedAt.toISOString(),
    }, { onConflict: 'id' });

  if (error) {
    console.error('Failed to upsert conversation:', error.message);
  }
}

export async function deleteConversationFromCloud(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete conversation from cloud:', error.message);
  }
}

/**
 * Save all conversations: cloud for auth users, localStorage for guests.
 * Also always writes to localStorage as a local cache.
 */
export async function saveConversations(conversations: Conversation[]): Promise<void> {
  saveConversationsLocal(conversations);
}

/**
 * Load conversations: cloud for auth users, localStorage for guests.
 * Falls back to localStorage on cloud error.
 */
export async function loadConversations(userId?: string | null): Promise<Conversation[]> {
  if (userId) {
    return loadConversationsFromCloud();
  }
  return loadConversationsLocal();
}

// ── Conversation CRUD ─────────────────────────────────────────────────────────

export function createConversation(mode: ChatMode = 'chat'): Conversation {
  return {
    id: crypto.randomUUID(),
    title: 'New Chat',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    mode,
  };
}

export function generateTitle(firstMessage: string): string {
  const words = firstMessage.trim().split(' ').slice(0, 6).join(' ');
  return words.length < firstMessage.length ? words + '…' : words;
}

// ── Image Generation History ──────────────────────────────────────────────────

const IMG_HISTORY_KEY = 'mockj_image_history';

export interface ImageHistoryItem {
  id: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  quality: string;
  mode: 'generate' | 'edit';
  imageUrl: string;
  createdAt: string;
}

export async function saveImageGeneration(item: Omit<ImageHistoryItem, 'id' | 'createdAt'>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { error } = await supabase.from('image_generations').insert({
      user_id: user.id,
      prompt: item.prompt,
      style: item.style,
      aspect_ratio: item.aspectRatio,
      quality: item.quality,
      mode: item.mode,
      image_url: item.imageUrl,
    });
    if (error) console.error('Failed to save image generation:', error.message);
  } else {
    // Guest: store in localStorage (cap at 50)
    const all = loadImageHistoryLocal();
    const entry: ImageHistoryItem = {
      id: crypto.randomUUID(),
      ...item,
      createdAt: new Date().toISOString(),
    };
    const updated = [entry, ...all].slice(0, 50);
    localStorage.setItem(IMG_HISTORY_KEY, JSON.stringify(updated));
  }
}

export function loadImageHistoryLocal(): ImageHistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(IMG_HISTORY_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export async function loadImageHistory(): Promise<ImageHistoryItem[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data, error } = await supabase
      .from('image_generations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Failed to load image history:', error.message);
      return loadImageHistoryLocal();
    }

    return (data ?? []).map(row => ({
      id: row.id,
      prompt: row.prompt,
      style: row.style,
      aspectRatio: row.aspect_ratio,
      quality: row.quality,
      mode: row.mode as 'generate' | 'edit',
      imageUrl: row.image_url,
      createdAt: row.created_at,
    }));
  }

  return loadImageHistoryLocal();
}

export async function deleteImageGeneration(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await supabase.from('image_generations').delete().eq('id', id);
  } else {
    const all = loadImageHistoryLocal().filter(i => i.id !== id);
    localStorage.setItem(IMG_HISTORY_KEY, JSON.stringify(all));
  }
}
