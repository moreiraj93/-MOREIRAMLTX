import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Keep non-auth routes usable in local/dev previews even when Supabase env vars
// are not available. Real auth/data flows still require configured values.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
);

export { isSupabaseConfigured };
