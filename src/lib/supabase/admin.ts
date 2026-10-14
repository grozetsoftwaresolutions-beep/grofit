import { createClient } from '@supabase/supabase-js';

// Server-only administrative client for authorized lifecycle operations (e.g. account deletion)
// Never import this file into client components or expose the service role key to the browser.
export function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin configuration missing (SUPABASE_SERVICE_ROLE_KEY).');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
