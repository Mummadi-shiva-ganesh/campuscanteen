import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { parseSessionFromCookieString } from "@/lib/supabase/mock-shared";

export function isJwtShaped(value: string): boolean {
  return value.split(".").length === 3;
}

function parseFirebaseUserFromCookieStore(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): User | null {
  const sessionCookie = cookieStore.get("sb-mock-session");
  if (!sessionCookie) return null;

  let rawValue = sessionCookie.value;
  try {
    rawValue = decodeURIComponent(rawValue);
  } catch {
    // use raw value
  }

  const mockUser = parseSessionFromCookieString(`sb-mock-session=${rawValue}`);
  if (!mockUser) return null;

  return mockUser as User;
}

/** Resolve the signed-in user on the server (Firebase cookie or Supabase Auth session). */
export async function resolveServerUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const firebaseUser = parseFirebaseUserFromCookieStore(cookieStore);
  if (firebaseUser) return firebaseUser;

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // read-only in this helper
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
