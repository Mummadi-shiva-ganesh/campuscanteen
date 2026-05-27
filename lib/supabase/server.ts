import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env, isMockMode } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerUser } from "@/lib/supabase/auth-server";
import { createServerMockClient } from "@/lib/supabase/mock-server";

function attachUserShim(client: SupabaseClient, user: User) {
  client.auth.getUser = async () => ({ data: { user }, error: null });
}

export async function createClient() {
  if (isMockMode) {
    const cookieStore = await cookies();

    return createServerMockClient(
      () => {
        const allCookies = cookieStore.getAll();
        return allCookies.map((c) => `${c.name}=${c.value}`).join("; ");
      },
      (user) => {
        try {
          if (user) {
            const encoded = Buffer.from(JSON.stringify(user)).toString("base64");
            cookieStore.set("sb-mock-session", encoded, {
              path: "/",
              maxAge: 60 * 60 * 24 * 7,
              httpOnly: false,
              sameSite: "lax",
            });
          } else {
            cookieStore.delete("sb-mock-session");
          }
        } catch {
          // setAll may fail when called from a Server Component (read-only context)
        }
      },
    ) as unknown as SupabaseClient;
  }

  const user = await resolveServerUser();

  // Firebase (or any authenticated server request): use service role only.
  // Never use createServerClient with user cookies — stale tokens cause PGRST301.
  if (user) {
    const client = createAdminClient();
    attachUserShim(client, user);
    return client;
  }

  const cookieStore = await cookies();
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // ignored in read-only Server Component context
          }
        },
      },
    },
  );
}
