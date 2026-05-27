import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, isMockMode } from "@/lib/env";
import { createServerMockClient } from "@/lib/supabase/mock-server";

export async function createClient() {
  if (isMockMode) {
    const cookieStore = await cookies();

    return createServerMockClient(
      // Cookie getter: read the raw sb-mock-session cookie value
      () => {
        const allCookies = cookieStore.getAll();
        return allCookies.map((c) => `${c.name}=${c.value}`).join("; ");
      },
      // Cookie setter: write the session cookie
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
    ) as any;
  }

  const cookieStore = await cookies();

  // In production / real mode, use the service role key if available to bypass RLS for server-side actions
  const activeKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const client = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    activeKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  // If user is authenticated via Firebase (stored in sb-mock-session cookie),
  // override the client's auth methods so Server Actions recognise their authenticated session.
  const mockSessionCookie = cookieStore.get("sb-mock-session");
  if (mockSessionCookie) {
    try {
      const decoded = JSON.parse(Buffer.from(mockSessionCookie.value, "base64").toString("utf-8"));
      if (decoded) {
        client.auth.getUser = async () => {
          return { data: { user: decoded }, error: null };
        };
        client.auth.getSession = async () => {
          const session = { access_token: "mock-session", refresh_token: "mock-refresh", user: decoded };
          return { data: { session }, error: null };
        };
      }
    } catch {}
  }

  return client;
}
