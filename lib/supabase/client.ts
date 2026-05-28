import { createBrowserClient } from "@supabase/ssr";
import { env, isMockMode } from "@/lib/env";
import { createBrowserMockClient } from "@/lib/supabase/mock-client";

/**
 * Creates a Supabase client for the browser.
 *
 * If a custom JWT is provided, it will be attached to the realtime
 * connection via `supabase.realtime.accessToken`. This resolves the
 * PGRST301 stale‑token issue when using realtime subscriptions.
 *
 * @param customJwt - Optional JWT string to use for realtime auth.
 */
export function createClient(customJwt?: string) {
  if (isMockMode) {
    return createBrowserMockClient() as any;
  }

  const supabase = createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Attach the custom JWT to the realtime client if supplied.
  if (customJwt) {
    // @ts-ignore - `accessToken` is a runtime property injected by Supabase.
    supabase.realtime.accessToken = customJwt;
  }

  return supabase;
}
