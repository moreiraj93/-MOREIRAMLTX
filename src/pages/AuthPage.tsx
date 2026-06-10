import { useEffect, useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import logoImg from '@/assets/mockj-logo.png';
import { useAuthActions } from '@/hooks/useAuthActions';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset' | 'update-password'>(() => {
    if (typeof window === 'undefined') return 'login';
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'password' || window.location.hash.includes('type=recovery')) {
      return 'update-password';
    }
    return params.get('mode') === 'signup' ? 'signup' : 'login';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { sendOtp, verifyOtpAndSetPassword, signInWithPassword, signInWithGoogle, resetPassword, updatePassword, loading, otpSent, setOtpSent } =
    useAuthActions();

  useEffect(() => {
    if (!authLoading && user) navigate('/');
  }, [authLoading, navigate, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await signInWithPassword(email, password);
  };

  const handleSignupStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendOtp(email);
  };

  const handleSignupStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyOtpAndSetPassword(email, otp, password, username);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    await resetPassword(email);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePassword(password);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[hsl(191_97%_55%_/_0.06)] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-[hsl(265_80%_65%_/_0.05)] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/">
            <div className="w-14 h-14 rounded-2xl overflow-hidden mb-4 ring-2 ring-[hsl(191_97%_55%_/_0.3)] animate-pulse-glow cursor-pointer">
              <img src={logoImg} alt="MockJ" className="w-full h-full object-cover" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {mode === 'login'
              ? 'Welcome back 👋'
              : mode === 'signup'
              ? 'Join MockJ 🔥'
              : mode === 'reset'
              ? 'Reset password'
              : 'Set new password'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'login'
              ? 'Sign in to your MockJ account'
              : mode === 'signup'
              ? 'Create your account to get started'
              : mode === 'reset'
              ? 'Send a recovery link to your email'
              : 'Choose a new password for your account'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[hsl(224_20%_7%)] border border-border rounded-2xl p-6 shadow-xl">
          {/* Mode Toggle */}
          {mode !== 'update-password' && (
          <div className="flex rounded-xl border border-border p-1 mb-6 bg-[hsl(224_20%_5%)]">
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setOtpSent(false); }}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  mode === m
                    ? 'bg-[hsl(191_97%_55%)] text-[hsl(224_20%_6%)]'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
          )}

          {mode !== 'update-password' && mode !== 'reset' && (
            <div className="mb-5 space-y-4">
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-white text-[hsl(224_20%_6%)] font-semibold py-2.5 rounded-xl text-sm hover:bg-white/90 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="font-black">G</span>}
                Continue with Google
              </button>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">or use email</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <InputField
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                icon={<Mail className="w-4 h-4" />}
                placeholder="you@example.com"
                required
              />
              <InputField
                label="Password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                icon={<Lock className="w-4 h-4" />}
                placeholder="Your password"
                required
                suffix={
                  <button type="button" onClick={() => setShowPass(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              <button
                type="button"
                onClick={() => setMode('reset')}
                className="text-xs font-medium text-muted-foreground hover:text-[hsl(191_97%_65%)] transition-colors"
              >
                Forgot password?
              </button>
              <SubmitButton loading={loading} label="Sign In" />
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <InputField
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                icon={<Mail className="w-4 h-4" />}
                placeholder="you@example.com"
                required
              />
              <SubmitButton loading={loading} label="Send Reset Link" />
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to sign in
              </button>
            </form>
          )}

          {mode === 'update-password' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <InputField
                label="New Password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                icon={<Lock className="w-4 h-4" />}
                placeholder="Min. 6 characters"
                required
                suffix={
                  <button type="button" onClick={() => setShowPass(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              <SubmitButton loading={loading} label="Update Password" />
            </form>
          )}

          {/* Signup Form — Step 1: Email */}
          {mode === 'signup' && !otpSent && (
            <form onSubmit={handleSignupStep1} className="space-y-4">
              <InputField
                label="Username"
                type="text"
                value={username}
                onChange={setUsername}
                icon={<User className="w-4 h-4" />}
                placeholder="Your username"
              />
              <InputField
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                icon={<Mail className="w-4 h-4" />}
                placeholder="you@example.com"
                required
              />
              <InputField
                label="Password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                icon={<Lock className="w-4 h-4" />}
                placeholder="Min. 6 characters"
                required
                suffix={
                  <button type="button" onClick={() => setShowPass(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              <SubmitButton loading={loading} label="Send Verification Code" />
            </form>
          )}

          {/* Signup Form — Step 2: OTP */}
          {mode === 'signup' && otpSent && (
            <form onSubmit={handleSignupStep2} className="space-y-4">
              <div className="p-3 rounded-lg bg-[hsl(191_97%_55%_/_0.08)] border border-[hsl(191_97%_55%_/_0.25)] text-sm text-[hsl(191_97%_75%)]">
                OTP sent to <strong>{email}</strong>. Check your inbox 📬
              </div>
              <InputField
                label="Verification Code (4 digits)"
                type="text"
                value={otp}
                onChange={setOtp}
                icon={<Lock className="w-4 h-4" />}
                placeholder="Enter 4-digit code"
                required
                maxLength={4}
              />
              <SubmitButton loading={loading} label="Verify & Create Account" />
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By continuing, you agree to MockJ's terms of service.
        </p>
      </div>
    </div>
  );
}

function InputField({
  label,
  type,
  value,
  onChange,
  icon,
  placeholder,
  required,
  suffix,
  maxLength,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  placeholder: string;
  required?: boolean;
  suffix?: React.ReactNode;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <div className="flex items-center gap-2 bg-[hsl(224_15%_10%)] border border-border rounded-xl px-3 py-2.5 focus-within:border-[hsl(191_97%_55%_/_0.5)] transition-colors">
        <span className="text-muted-foreground shrink-0">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
        />
        {suffix}
      </div>
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-[hsl(191_97%_55%)] text-[hsl(224_20%_6%)] font-semibold py-2.5 rounded-xl text-sm hover:bg-[hsl(191_97%_65%)] transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {label} <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  );
}
