import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AuthUser } from '@/types/auth';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

function mapUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email!,
    username:
      user.user_metadata?.username ||
      user.user_metadata?.full_name ||
      user.email!.split('@')[0],
    avatar: user.user_metadata?.avatar_url,
  };
}

export function useAuthActions() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const sendOtp = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setOtpSent(true);
      toast.success('OTP sent! Check your email 📬');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send OTP');
      setLoading(false);
    }
    setLoading(false);
  };

  const verifyOtpAndSetPassword = async (
    email: string,
    token: string,
    password: string,
    username?: string
  ) => {
    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (verifyError) throw verifyError;

      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password,
        data: { username: username || email.split('@')[0] },
      });
      if (updateError) throw updateError;
      if (!updateData.user) throw new Error('No user returned after verification');

      login(mapUser(updateData.user));
      toast.success('Account created! Welcome to MockJ 🔥');
      navigate('/');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Verification failed');
      setLoading(false);
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('No user returned');

      login(mapUser(data.user));
      toast.success('Welcome back 🔥');
      navigate('/');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  return { sendOtp, verifyOtpAndSetPassword, signInWithPassword, loading, otpSent, setOtpSent };
}
