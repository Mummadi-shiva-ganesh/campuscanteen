import { z } from "zod";

export const onboardingSchema = z.object({
  fullName: z
    .string()
    .min(3, "Full name must be at least 3 characters")
    .max(50, "Full name must be less than 50 characters")
    .trim(),
  rollNumber: z
    .string()
    .min(3, "Roll number must be at least 3 characters")
    .toUpperCase()
    .trim(),
  year: z.coerce
    .number()
    .int()
    .min(1, "Year must be at least 1")
    .max(5, "Year must be at most 5"),
  branch: z
    .string()
    .min(2, "Branch must be at least 2 characters (e.g. CSE, ECE)")
    .toUpperCase()
    .trim(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number starting with 6-9"),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
