import { createServerClient } from '@supabase/ssr';
import { createClient } from './server';

export async function getAuthenticatedSupabaseClient(request?: Request) {
  const supabase = await createClient();
  const authHeader = request?.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (bearerToken) {
    const { data: { user }, error } = await supabase.auth.getUser(bearerToken);
    if (user && !error) {
      const tokenClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          global: {
            headers: { Authorization: `Bearer ${bearerToken}` }
          },
          cookies: { getAll: () => [], setAll: () => {} }
        }
      );
      return { supabase: tokenClient, user };
    }
    return { supabase, user: null };
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}
