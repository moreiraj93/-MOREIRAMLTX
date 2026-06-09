import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type LimitedAction = 'chat' | 'image' | 'video';

interface DailyUsage {
  date: string; // YYYY-MM-DD
  chat: number;
  image: number;
  video: number;
}

const STORAGE_KEY = 'mockj_daily_usage';

const FREE_LIMITS: Record<LimitedAction, number> = {
  chat: 10,
  image: 10,
  video: 1,
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadUsage(): DailyUsage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: todayStr(), chat: 0, image: 0, video: 0 };
    const parsed: DailyUsage = JSON.parse(raw);
    // Reset if it's a new day
    if (parsed.date !== todayStr()) {
      return { date: todayStr(), chat: 0, image: 0, video: 0 };
    }
    return { date: parsed.date, chat: parsed.chat ?? 0, image: parsed.image ?? 0, video: parsed.video ?? 0 };
  } catch {
    return { date: todayStr(), chat: 0, image: 0, video: 0 };
  }
}

function saveUsage(usage: DailyUsage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

export function useUsageLimits() {
  const { subscription } = useAuth();

  const getRemaining = useCallback(
    (action: LimitedAction): number => {
      if (subscription.subscribed) return Infinity;
      const usage = loadUsage();
      return Math.max(0, FREE_LIMITS[action] - usage[action]);
    },
    [subscription.subscribed]
  );

  /**
   * Returns true if the action is allowed (and increments the counter).
   * Returns false if the free limit is reached (does NOT increment).
   */
  const consumeOrBlock = useCallback(
    (action: LimitedAction): boolean => {
      if (subscription.subscribed) return true;
      const usage = loadUsage();
      if (usage[action] >= FREE_LIMITS[action]) return false;
      saveUsage({ ...usage, [action]: usage[action] + 1 });
      return true;
    },
    [subscription.subscribed]
  );

  const getLimitLabel = (action: LimitedAction): string => {
    const remaining = getRemaining(action);
    if (remaining === Infinity) return '';
    if (action === 'image') return `${remaining}/${FREE_LIMITS.image} free images left today`;
    return `${remaining}/${FREE_LIMITS[action]} free ${action === 'chat' ? 'messages' : action === 'image' ? 'images' : 'videos'} left today`;
  };

  const getLimit = (action: LimitedAction) => FREE_LIMITS[action];

  return { consumeOrBlock, getRemaining, getLimitLabel, getLimit };
}
