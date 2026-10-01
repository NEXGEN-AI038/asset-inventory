import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Invite / password-reset emails send people back here with tokens in the URL.
// Read what kind of link it was BEFORE the client consumes (and clears) it.
function readAuthLink(): { type: 'invite' | 'recovery' | null; error: string | null } {
  if (typeof window === 'undefined') return { type: null, error: null };
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(window.location.search);
  const type = params.get('type');
  const rawError = params.get('error_description') || query.get('error_description');
  return {
    type: type === 'invite' || type === 'recovery' ? type : null,
    error: rawError ? rawError.replace(/\+/g, ' ') : null,
  };
}

export const initialAuthLink = readAuthLink();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
});
