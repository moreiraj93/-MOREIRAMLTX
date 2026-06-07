import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type TokenAction = 'chat' | 'image' | 'video';

const WALLET_KEY = 'mockj_token_wallet_v1';
const STARTER_BALANCE = 7711;

export const TOKEN_COSTS: Record<TokenAction, number> = {
  chat: 1,
  image: 25,
  video: 100,
};

interface WalletRecord {
  balance: number;
  createdAt: string;
  updatedAt: string;
}

type WalletStore = Record<string, WalletRecord>;

function walletOwner(userId?: string | null) {
  return userId ? `user:${userId}` : 'guest';
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

export function useTokenWallet() {
  const { user } = useAuth();
  const owner = useMemo(() => walletOwner(user?.id), [user?.id]);
  const [balance, setBalance] = useState(() => ensureWallet(owner).balance);

  useEffect(() => {
    setBalance(ensureWallet(owner).balance);
  }, [owner]);

  const canSpendTokens = useCallback(
    (action: TokenAction) => {
      return ensureWallet(owner).balance >= TOKEN_COSTS[action];
    },
    [owner]
  );

  const spendTokens = useCallback(
    (action: TokenAction) => {
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

  return {
    tokenBalance: balance,
    tokenCosts: TOKEN_COSTS,
    canSpendTokens,
    spendTokens,
    starterBalance: STARTER_BALANCE,
  };
}
