"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerUser } from "@/lib/supabase/auth-server";
import { onboardingSchema, type OnboardingInput } from "@/validators/onboarding";

export async function onboardUser(input: OnboardingInput) {
  const validation = onboardingSchema.safeParse(input);
  if (!validation.success) {
    throw new Error(validation.error.errors[0]?.message || "Validation failed");
  }

  const { fullName, rollNumber, year, branch, phone } = validation.data;

  const user = await resolveServerUser();
  if (!user) {
    throw new Error("Unauthorized user. Please log in first.");
  }

  const supabase = createAdminClient();

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

  return { success: true };
}
