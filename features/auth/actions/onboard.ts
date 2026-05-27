"use server";

import { createClient } from "@/lib/supabase/server";
// Removed direct resolveServerUser import; using createClient for auth
import { onboardingSchema, type OnboardingInput } from "@/validators/onboarding";

export async function onboardUser(input: OnboardingInput) {
  const validation = onboardingSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || "Validation failed" };
  }

  const { fullName, rollNumber, year, branch, phone } = validation.data;

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized user. Please log in first." };
    }

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
      return { success: false, error: `Failed to update profile: ${profileError.message}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred during onboarding." };
  }
}
