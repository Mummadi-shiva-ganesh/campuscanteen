"use server";

import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, type OnboardingInput } from "@/validators/onboarding";

export async function onboardUser(input: OnboardingInput) {
  // Validate schema first
  const validation = onboardingSchema.safeParse(input);
  if (!validation.success) {
    throw new Error(validation.error.errors[0]?.message || "Validation failed");
  }

  const { fullName, rollNumber, year, branch, phone } = validation.data;
  const supabase = await createClient();

  // Retrieve authenticated user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Unauthorized user. Please log in first.");
  }

  // Update public user profile database record
  const { error: profileError } = await supabase
    .from("users")
    .update({
      full_name: fullName,
      roll_number: rollNumber,
      year: year,
      branch: branch,
      phone: phone,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("Profile update error:", profileError);
    throw new Error(`Failed to update profile: ${profileError.message}`);
  }

  // Update Supabase Auth user metadata so session cookie updates instantly
  // Update Supabase Auth user metadata if logged in via mock auth (e.g. sandbox developer bypass)
  try {
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        onboarding_completed: true,
      },
    });
    if (authUpdateError) {
      console.warn("Supabase Auth metadata update failed (may be bypassed for Firebase users):", authUpdateError.message);
    }
  } catch (err: any) {
    console.warn("Bypassing Supabase auth updateUser:", err.message);
  }

  return { success: true };
}
