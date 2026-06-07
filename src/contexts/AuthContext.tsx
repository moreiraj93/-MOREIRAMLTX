import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { postAuthedApi } from '@/lib/api';
import { AuthUser, SubscriptionState } from '@/types/auth';

interface AuthContextType {
  user: AuthUser | null;
  subscription: SubscriptionState;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  refreshSubscription: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const defaultSub: SubscriptionState = {
  subscribed: false,
  productId: null,
  subscriptionEnd: null,
  tier: 'free',
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  subscription: defaultSub,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshSubscription: async () => {},
  refreshUser: async () => {},
});

function mapSupabaseUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email!,
    username:
      user.user_metadata?.username ||
      user.user_metadata?.full_name ||
      user.email!.split('@')[0],
    avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSub);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setSubscription(defaultSub);
      return;
    }
    let data: {
      subscribed?: boolean;
      product_id?: string | null;
      subscription_end?: string | null;
      tier?: 'free' | 'pro' | 'sale';
    } | null = null;
    try {
      data = await postAuthedApi('/api/check-subscription');
    } catch (error) {
      console.error('Subscription check failed:', error);
      return;
    }
    setSubscription({
      subscribed: data.subscribed ?? false,
      productId: data.product_id ?? null,
      subscriptionEnd: data.subscription_end ?? null,
      tier: data.tier ?? 'free',
    });
  };

  const login = (authUser: AuthUser) => {
    setUser(authUser);
    checkSubscription();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSubscription(defaultSub);
  };

  const refreshSubscription = async () => {
    await checkSubscription();
  };

  const refreshUser = async () => {
    const { data: { user: supaUser } } = await supabase.auth.getUser();
    if (supaUser) setUser(mapSupabaseUser(supaUser));
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session?.user) {
        login(mapSupabaseUser(session.user));
      }
      if (mounted) setLoading(false);
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        if (event === 'SIGNED_IN' && session?.user) {
          login(mapSupabaseUser(session.user));
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          logout();
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(mapSupabaseUser(session.user));
        }
      }
    );

    // Periodic subscription refresh (every 60s)
    const interval = setInterval(checkSubscription, 60_000);

    return () => {
      mounted = false;
      authSub.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, subscription, loading, login, logout, refreshSubscription, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
