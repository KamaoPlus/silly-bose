import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gsactdpoyhlampexhcsw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bG14O0KtYsp8pKzPC36G-A_H47C8wtR';

console.log('[Supabase Init] URL:', supabaseUrl, 'AnonKey present:', Boolean(supabaseAnonKey));

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
