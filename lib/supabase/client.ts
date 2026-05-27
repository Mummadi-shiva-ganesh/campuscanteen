import { createBrowserClient } from "@supabase/ssr";
import { env, isMockMode } from "@/lib/env";
import { createBrowserMockClient } from "@/lib/supabase/mock-client";

export function createClient() {
  if (isMockMode) {
    return createBrowserMockClient() as any;
  }

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
