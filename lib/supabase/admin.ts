import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { isJwtShaped } from "@/lib/supabase/auth-server";

/** Service-role client for server-side DB access (bypasses RLS; never sends a user JWT). */
export function createAdminClient(): SupabaseClient {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!key || !isJwtShaped(key)) {
    console.error(
      "[createAdminClient] FATAL: SUPABASE_SERVICE_ROLE_KEY is missing or invalid. Current value preview:", 
      key ? `${key.slice(0, 10)}...` : "undefined"
    );
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing or invalid. Go to Vercel → Settings → Environment Variables and add the service_role key from Supabase → Project Settings → API."
    );
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
