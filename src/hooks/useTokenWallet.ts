import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { AuthUser } from '@/types/auth';

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
const REFERRAL_KEY = 'mockj_referral_store_v1';
const PENDING_REFERRAL_KEY = 'mockj_pending_referral_code_v1';
const PUBLIC_REFERRAL_ORIGIN = 'https://mockk.online';
const STARTER_BALANCE = 1000;
export const REFERRAL_BONUS = 250;
const REFERRAL_MILESTONE = 25;

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

interface ReferralRecord {
  code: string;
  owner: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
  referrals: number;
  tokensEarned: number;
  appliedOwners: string[];
}

interface ReferralStore {
  codes: Record<string, ReferralRecord>;
  appliedByOwner: Record<string, { code: string; appliedAt: string; bonus: number }>;
}

export interface ReferralStats {
  code: string;
  link: string;
  totalReferrals: number;
  tokensEarned: number;
  untilVip: number;
  appliedCode: string | null;
}

export type ReferralApplyResult =
  | { ok: true; message: string; code: string; bonus: number }
  | { ok: false; reason: 'account-required' | 'empty' | 'not-found' | 'self' | 'already-applied'; message: string };

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

function creditWallet(owner: string, amount: number): WalletRecord {
  const store = loadStore();
  const now = new Date().toISOString();
  const wallet = store[owner] ?? { balance: STARTER_BALANCE, createdAt: now, updatedAt: now };
  const updated = { ...wallet, balance: wallet.balance + amount, updatedAt: now };
  store[owner] = updated;
  saveStore(store);
  return updated;
}

function loadReferralStore(): ReferralStore {
  try {
    const store = JSON.parse(localStorage.getItem(REFERRAL_KEY) ?? '{}') as Partial<ReferralStore>;
    return {
      codes: store.codes ?? {},
      appliedByOwner: store.appliedByOwner ?? {},
    };
  } catch {
    return { codes: {}, appliedByOwner: {} };
  }
}

function saveReferralStore(store: ReferralStore) {
  localStorage.setItem(REFERRAL_KEY, JSON.stringify(store));
}

function referralHash(input: string): string {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().padStart(5, '0').slice(0, 5);
}

function referralBase(user: AuthUser): string {
  const source = user.username || user.email?.split('@')[0] || 'MOCKJ';
  return source.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 8) || 'MOCKJ';
}

export function normalizeReferralCode(rawCode: string): string {
  let value = rawCode.trim();
  if (!value) return '';

  try {
    const url = new URL(value);
    const segments = url.pathname.split('/').filter(Boolean);
    const refIndex = segments.findIndex(segment => segment.toLowerCase() === 'ref');
    if (refIndex >= 0 && segments[refIndex + 1]) {
      value = segments[refIndex + 1];
    }
  } catch {
    // Raw codes are valid too.
  }

  return decodeURIComponent(value).trim().replace(/[^a-z0-9-]/gi, '').toUpperCase();
}

export function referralLinkForCode(code: string): string {
  return `${PUBLIC_REFERRAL_ORIGIN}/ref/${encodeURIComponent(normalizeReferralCode(code))}`;
}

export function storePendingReferralCode(rawCode: string) {
  const code = normalizeReferralCode(rawCode);
  if (code) localStorage.setItem(PENDING_REFERRAL_KEY, code);
}

export function consumePendingReferralCode(): string | null {
  const code = localStorage.getItem(PENDING_REFERRAL_KEY);
  if (code) localStorage.removeItem(PENDING_REFERRAL_KEY);
  return code;
}

function referralCodeForUser(user: AuthUser): string {
  return `${referralBase(user)}-${referralHash(user.id)}`;
}

function isReferralCodeShape(code: string): boolean {
  return /^[A-Z0-9]{2,8}-[A-Z0-9]{5}$/.test(code);
}

function ensureReferralRecord(owner: string, user: AuthUser): ReferralRecord {
  const store = loadReferralStore();
  const code = referralCodeForUser(user);
  const now = new Date().toISOString();
  const existing = store.codes[code];
  const record: ReferralRecord = existing
    ? { ...existing, owner, displayName: user.username || user.email, updatedAt: now }
    : {
        code,
        owner,
        displayName: user.username || user.email,
        createdAt: now,
        updatedAt: now,
        referrals: 0,
        tokensEarned: 0,
        appliedOwners: [],
      };

  store.codes[code] = record;
  saveReferralStore(store);
  return record;
}

function catalogCost(id: TokenCatalogId): number {
  return TOKEN_COST_CATALOG.find(item => item.id === id)?.cost ?? 0;
}

export function useTokenWallet() {
  const { user } = useAuth();
  const owner = useMemo(() => walletOwner(user?.id), [user?.id]);
  const [balance, setBalance] = useState(() => owner ? ensureWallet(owner).balance : 0);
  const [referralVersion, setReferralVersion] = useState(0);

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

  const addTokens = useCallback(
    (amount: number) => {
      if (!owner || amount <= 0) return false;
      const updated = creditWallet(owner, amount);
      setBalance(updated.balance);
      return true;
    },
    [owner]
  );

  const referralStats = useMemo<ReferralStats | null>(() => {
    if (!owner || !user) return null;

    const record = ensureReferralRecord(owner, user);
    const store = loadReferralStore();
    const applied = store.appliedByOwner[owner];

    return {
      code: record.code,
      link: referralLinkForCode(record.code),
      totalReferrals: record.referrals,
      tokensEarned: record.tokensEarned,
      untilVip: Math.max(REFERRAL_MILESTONE - record.referrals, 0),
      appliedCode: applied?.code ?? null,
    };
  }, [owner, referralVersion, user]);

  const applyReferralCode = useCallback(
    (rawCode: string): ReferralApplyResult => {
      if (!owner || !user) {
        return {
          ok: false,
          reason: 'account-required',
          message: 'Create a free account before applying a referral code.',
        };
      }

      const code = normalizeReferralCode(rawCode);
      if (!code) {
        return { ok: false, reason: 'empty', message: 'Enter a referral code first.' };
      }

      const ownRecord = ensureReferralRecord(owner, user);
      const store = loadReferralStore();

      if (ownRecord.code === code) {
        return { ok: false, reason: 'self', message: 'You cannot apply your own referral code.' };
      }

      if (store.appliedByOwner[owner]) {
        return {
          ok: false,
          reason: 'already-applied',
          message: `Referral code ${store.appliedByOwner[owner].code} is already applied to this account.`,
        };
      }

      const now = new Date().toISOString();
      const target = store.codes[code];

      if (!target) {
        if (!isReferralCodeShape(code)) {
          return { ok: false, reason: 'not-found', message: 'Enter a valid MockJ referral code.' };
        }

        store.appliedByOwner[owner] = { code, appliedAt: now, bonus: REFERRAL_BONUS };
        saveReferralStore(store);
        const updatedCurrentWallet = creditWallet(owner, REFERRAL_BONUS);
        setBalance(updatedCurrentWallet.balance);
        setReferralVersion(version => version + 1);

        return {
          ok: true,
          code,
          bonus: REFERRAL_BONUS,
          message: `${REFERRAL_BONUS} MLTX referral bonus added.`,
        };
      }

      if (target.owner === owner) {
        return { ok: false, reason: 'self', message: 'You cannot apply your own referral code.' };
      }

      store.appliedByOwner[owner] = { code, appliedAt: now, bonus: REFERRAL_BONUS };
      store.codes[code] = {
        ...target,
        referrals: target.referrals + 1,
        tokensEarned: target.tokensEarned + REFERRAL_BONUS,
        updatedAt: now,
        appliedOwners: Array.from(new Set([...(target.appliedOwners ?? []), owner])),
      };
      saveReferralStore(store);

      const updatedCurrentWallet = creditWallet(owner, REFERRAL_BONUS);
      creditWallet(target.owner, REFERRAL_BONUS);
      setBalance(updatedCurrentWallet.balance);
      setReferralVersion(version => version + 1);

      return {
        ok: true,
        code,
        bonus: REFERRAL_BONUS,
        message: `${REFERRAL_BONUS} MLTX referral bonus added.`,
      };
    },
    [owner, user]
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
    addTokens,
    referralStats,
    referralBonus: REFERRAL_BONUS,
    applyReferralCode,
    starterBalance: STARTER_BALANCE,
  };
}
