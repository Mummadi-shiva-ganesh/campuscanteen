import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env, isMockMode } from "@/lib/env";
import { parseSessionFromCookieString } from "@/lib/supabase/mock-shared";

export async function updateSession(request: NextRequest) {
  // ── Mock Mode: read session directly from cookie, no network calls ──
  if (isMockMode) {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const mockUser = parseSessionFromCookieString(cookieHeader);

    // Build a minimal user object compatible with the middleware consumer
    const user = mockUser
      ? {
          id: mockUser.id,
          email: mockUser.email,
          user_metadata: mockUser.user_metadata ?? {},
          app_metadata: mockUser.app_metadata ?? {},
        }
      : null;

    return {
      user,
      supabase: null, // Not used in the middleware consumer
      supabaseResponse: NextResponse.next({ request }),
    };
  }

  // ── Real Supabase Mode ──
  let supabaseResponse = NextResponse.next({
    request,
  });

  let user = null;

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Read Firebase session from cookie if available in real mode
  const mockSessionCookie = request.cookies.get("sb-mock-session");
  if (mockSessionCookie) {
    try {
      const decoded = JSON.parse(atob(mockSessionCookie.value));
      if (decoded) {
        user = {
          id: decoded.id,
          email: decoded.email,
          user_metadata: decoded.user_metadata ?? {},
          app_metadata: decoded.app_metadata ?? {},
        };
        // Mock standard getUser call
        supabase.auth.getUser = async () => {
          return { data: { user }, error: null } as any;
        };
      }
    } catch {}
  }

  // Fallback if no mock session found
  if (!user) {
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {}
  }

  // Return the user and the response
  return { user, supabase, supabaseResponse };
}
