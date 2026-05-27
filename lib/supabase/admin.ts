import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { isJwtShaped } from "@/lib/supabase/auth-server";

/** Service-role client for server-side DB access (bypasses RLS; never sends a user JWT). */
export function createAdminClient(): SupabaseClient {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing. Add it in Vercel → Settings → Environment Variables (use the service_role secret from Supabase → Project Settings → API).",
    );
  }
  if (!isJwtShaped(key)) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not a valid Supabase JWT (expected 3 dot-separated parts). Copy the service_role key from Supabase → Project Settings → API.",
    );
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
