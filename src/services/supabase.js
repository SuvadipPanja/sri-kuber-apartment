import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Silent background keep-alive ping to keep database active on app load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    supabase.from('config').select('id').limit(1).then(() => {}).catch(() => {});
  }, 2000);
}
