"use server";

import { cookies } from "next/headers";

export type FirebaseSessionPayload = {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
};

/** Persist Firebase identity in an httpOnly cookie so Server Actions can read it reliably. */
export async function syncFirebaseSession(user: FirebaseSessionPayload) {
  const cookieStore = await cookies();
  const encoded = Buffer.from(JSON.stringify(user)).toString("base64");

  cookieStore.set("sb-mock-session", encoded, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  // Remove stale Supabase Auth cookies that may carry invalid bearer tokens
  for (const { name } of cookieStore.getAll()) {
    if (name.includes("-auth-token")) {
      cookieStore.delete(name);
    }
  }
}

export async function clearFirebaseSession() {
  const cookieStore = await cookies();
  cookieStore.delete("sb-mock-session");
}
