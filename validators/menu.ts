import { z } from "zod";

export const menuItemSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").trim(),
  description: z.string().min(5, "Description must be at least 5 characters").trim(),
  imageUrl: z.string().url("Please provide a valid image URL").or(z.string().emoji("Please provide an emoji icon as backup")).or(z.string().min(1, "Please provide an image URL or emoji")),
  category: z.string().min(1, "Please select a category"),
  price: z.coerce.number().positive("Price must be a positive number"),
  prepTime: z.string().min(1, "Prep time is required (e.g. 15 min)").trim(),
  isVeg: z.boolean().default(true),
  isSpecial: z.boolean().default(false),
  available: z.boolean().default(true),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;
