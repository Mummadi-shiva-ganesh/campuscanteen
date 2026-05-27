import { z } from "zod";

const getEnv = () => {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const rawMock = process.env.NEXT_PUBLIC_MOCK_SUPABASE || "";
  const rawRazorpay = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

  // 1. Validate URL
  let supabaseUrl = rawUrl.trim();
  if (!supabaseUrl || !supabaseUrl.startsWith("http")) {
    console.warn(`[WARNING] NEXT_PUBLIC_SUPABASE_URL is missing or invalid (received: "${rawUrl}"). Falling back to local emulator.`);
    supabaseUrl = "http://127.0.0.1:54321";
  }

  // 2. Validate Anon Key
  let supabaseAnonKey = rawAnonKey.trim();
  const isProduction = process.env.NODE_ENV === "production";
  if (!supabaseAnonKey || supabaseAnonKey.length < 10) {
    if (isProduction) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Set it in Vercel environment variables.",
      );
    }
    console.warn(
      `[WARNING] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or too short. Falling back to dummy key.`,
    );
    supabaseAnonKey = "dummy";
  }

  // 3. Validate Service Role Key
  let serviceRoleKey = rawServiceKey.trim();
  if (!serviceRoleKey || serviceRoleKey.length < 10) {
    console.warn(`[INFO] SUPABASE_SERVICE_ROLE_KEY is not defined or is empty. Optional bypassing of RLS is disabled.`);
    serviceRoleKey = "";
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey || undefined,
    NEXT_PUBLIC_MOCK_SUPABASE: rawMock.trim(),
    NEXT_PUBLIC_RAZORPAY_KEY_ID: rawRazorpay.trim() || undefined,
  };
};

export const env = getEnv();

/** Helper: true when Mock Supabase Mode is active */
export const isMockMode = env.NEXT_PUBLIC_MOCK_SUPABASE === "true";

