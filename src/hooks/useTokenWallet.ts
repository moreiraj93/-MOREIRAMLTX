import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type TokenAction = 'chat' | 'image' | 'video';
export type TokenCatalogId =
  | 'chat-basic'
  | 'chat-premium'
  | 'image-standard'
  | 'image-hd'
  | 'image-ultra-real'
  | 'video-4s'
  | 'video-8s'
  | 'video-12s'
  | 'voice-message'
  | 'voice-clone';

const WALLET_KEY = 'mockj_token_wallet_v1';
const STARTER_BALANCE = 1000;

export const TOKEN_COSTS: Record<TokenAction, number> = {
  chat: 5,
  image: 50,
  video: 300,
};

export interface TokenCatalogItem {
  id: TokenCatalogId;
  action?: TokenAction;
  label: string;
  shortLabel: string;
  cost: number;
  category: 'chat' | 'image' | 'video' | 'voice';
  description: string;
}

export const TOKEN_COST_CATALOG: TokenCatalogItem[] = [
  { id: 'chat-basic', action: 'chat', label: 'Chat - Basic', shortLabel: 'Basic chat', cost: 5, category: 'chat', description: 'Standard MockJ chat response.' },
  { id: 'chat-premium', action: 'chat', label: 'Chat - Premium', shortLabel: 'Premium chat', cost: 10, category: 'chat', description: 'Deeper reasoning and richer Project Brain context.' },
  { id: 'image-standard', action: 'image', label: 'Image - Standard', shortLabel: 'Standard image', cost: 50, category: 'image', description: 'Fast MLTXPRO visual generation.' },
  { id: 'image-hd', action: 'image', label: 'Image - HD', shortLabel: 'HD image', cost: 100, category: 'image', description: 'Sharper creator-grade image output.' },
  { id: 'image-ultra-real', action: 'image', label: 'Image - Ultra Real', shortLabel: 'Ultra real image', cost: 150, category: 'image', description: 'Premium realism and detail pass.' },
  { id: 'video-4s', action: 'video', label: 'Video - 4 seconds', shortLabel: '4 second video', cost: 300, category: 'video', description: 'Short MockJ motion clip.' },
  { id: 'video-8s', action: 'video', label: 'Video - 8 seconds', shortLabel: '8 second video', cost: 600, category: 'video', description: 'Standard MockJ motion clip.' },
  { id: 'video-12s', action: 'video', label: 'Video - 12 seconds', shortLabel: '12 second video', cost: 900, category: 'video', description: 'Extended MockJ motion clip.' },
  { id: 'voice-message', label: 'Voice Message', shortLabel: 'Voice message', cost: 25, category: 'voice', description: 'Spoken MockJ reply output.' },
  { id: 'voice-clone', label: 'Voice Clone', shortLabel: 'Voice clone', cost: 250, category: 'voice', description: 'Custom MLTXPRO voice identity setup.' },
];

interface WalletRecord {
  balance: number;
  createdAt: string;
  updatedAt: string;
}

type WalletStore = Record<string, WalletRecord>;

function walletOwner(userId?: string | null): string | null {
  return userId ? `user:${userId}` : null;
}

function loadStore(): WalletStore {
  try {
    return JSON.parse(localStorage.getItem(WALLET_KEY) ?? '{}') as WalletStore;
  } catch {
    return {};
  }
}

function saveStore(store: WalletStore) {
  localStorage.setItem(WALLET_KEY, JSON.stringify(store));
}

function ensureWallet(owner: string): WalletRecord {
  const store = loadStore();
  if (store[owner]) return store[owner];

  const now = new Date().toISOString();
  const wallet = { balance: STARTER_BALANCE, createdAt: now, updatedAt: now };
  store[owner] = wallet;
  saveStore(store);
  return wallet;
}

function catalogCost(id: TokenCatalogId): number {
  return TOKEN_COST_CATALOG.find(item => item.id === id)?.cost ?? 0;
}

export function useTokenWallet() {
  const { user } = useAuth();
  const owner = useMemo(() => walletOwner(user?.id), [user?.id]);
  const [balance, setBalance] = useState(() => owner ? ensureWallet(owner).balance : 0);

  useEffect(() => {
    setBalance(owner ? ensureWallet(owner).balance : 0);
  }, [owner]);

  const canSpendTokens = useCallback(
    (action: TokenAction) => {
      if (!owner) return false;
      return ensureWallet(owner).balance >= TOKEN_COSTS[action];
    },
    [owner]
  );

  const spendTokens = useCallback(
    (action: TokenAction) => {
      if (!owner) return false;
      const store = loadStore();
      const wallet = store[owner] ?? ensureWallet(owner);
      const cost = TOKEN_COSTS[action];

      if (wallet.balance < cost) return false;

      const updated = {
        ...wallet,
        balance: wallet.balance - cost,
        updatedAt: new Date().toISOString(),
      };
      store[owner] = updated;
      saveStore(store);
      setBalance(updated.balance);
      return true;
    },
    [owner]
  );

  const canSpendCatalogItem = useCallback(
    (id: TokenCatalogId) => {
      if (!owner) return false;
      return ensureWallet(owner).balance >= catalogCost(id);
    },
    [owner]
  );

  const spendCatalogItem = useCallback(
    (id: TokenCatalogId) => {
      if (!owner) return false;
      const cost = catalogCost(id);
      const store = loadStore();
      const wallet = store[owner] ?? ensureWallet(owner);

      if (wallet.balance < cost) return false;

      const updated = {
        ...wallet,
        balance: wallet.balance - cost,
        updatedAt: new Date().toISOString(),
      };
      store[owner] = updated;
      saveStore(store);
      setBalance(updated.balance);
      return true;
    },
    [owner]
  );

  return {
    tokenBalance: balance,
    tokenCosts: TOKEN_COSTS,
    tokenCatalog: TOKEN_COST_CATALOG,
    tokenWalletReady: Boolean(owner),
    canSpendTokens,
    spendTokens,
    canSpendCatalogItem,
    spendCatalogItem,
    starterBalance: STARTER_BALANCE,
  };
}
