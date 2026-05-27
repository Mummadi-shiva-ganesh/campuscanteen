"use server";

import { createClient } from "@/lib/supabase/server";
import { menuItemSchema, type MenuItemInput } from "@/validators/menu";

// Helper: Ensure the requesting user is an admin
async function ensureAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Unauthorized. Please log in.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    throw new Error("Forbidden. Admin rights required.");
  }

  return { supabase, user };
}

// 1. Fetch all menu items
export async function getMenuItems() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch menu items: ${error.message}`);
  }

  return data;
}

// 2. Create menu item
export async function createMenuItem(input: MenuItemInput) {
  const { supabase } = await ensureAdmin();

  const validation = menuItemSchema.safeParse(input);
  if (!validation.success) {
    throw new Error(validation.error.errors[0]?.message || "Validation failed");
  }

  const item = validation.data;
  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      name: item.name,
      description: item.description,
      image_url: item.imageUrl,
      category: item.category,
      price: item.price,
      prep_time: item.prepTime,
      is_veg: item.isVeg,
      is_special: item.isSpecial,
      available: item.available,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create item: ${error.message}`);
  }

  return data;
}

// 3. Update menu item
export async function updateMenuItem(id: string, input: MenuItemInput) {
  const { supabase } = await ensureAdmin();

  const validation = menuItemSchema.safeParse(input);
  if (!validation.success) {
    throw new Error(validation.error.errors[0]?.message || "Validation failed");
  }

  const item = validation.data;
  const { data, error } = await supabase
    .from("menu_items")
    .update({
      name: item.name,
      description: item.description,
      image_url: item.imageUrl,
      category: item.category,
      price: item.price,
      prep_time: item.prepTime,
      is_veg: item.isVeg,
      is_special: item.isSpecial,
      available: item.available,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update item: ${error.message}`);
  }

  return data;
}

// 4. Delete menu item
export async function deleteMenuItem(id: string) {
  const { supabase } = await ensureAdmin();

  const { error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete item: ${error.message}`);
  }

  return { success: true };
}

// 5. Toggle Item Availability
export async function toggleItemAvailability(id: string, available: boolean) {
  const { supabase } = await ensureAdmin();

  const { data, error } = await supabase
    .from("menu_items")
    .update({ available })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update availability: ${error.message}`);
  }

  return data;
}

// 6. Toggle Item Special Status
export async function toggleItemSpecial(id: string, isSpecial: boolean) {
  const { supabase } = await ensureAdmin();

  const { data, error } = await supabase
    .from("menu_items")
    .update({ is_special: isSpecial })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update special status: ${error.message}`);
  }

  return data;
}
