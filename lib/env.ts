import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_MOCK_SUPABASE: z.string().optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),
});

// For safety, compile-time check that parsing works
const getEnv = () => {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_MOCK_SUPABASE: process.env.NEXT_PUBLIC_MOCK_SUPABASE,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });

  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    // Fallback during build process to prevent compile failure
    if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error("Invalid environment variables");
    }
    return {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "dummy",
      SUPABASE_SERVICE_ROLE_KEY: undefined,
      NEXT_PUBLIC_MOCK_SUPABASE: process.env.NEXT_PUBLIC_MOCK_SUPABASE,
    };
  }

  return result.data;
};

export const env = getEnv();

/** Helper: true when Mock Supabase Mode is active */
export const isMockMode = env.NEXT_PUBLIC_MOCK_SUPABASE === "true";
