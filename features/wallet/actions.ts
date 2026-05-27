"use server";

import { createClient } from "@/lib/supabase/server";

// 1. Fetch wallet transaction logs for the authenticated user
export async function getWalletTransactions() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error("Unauthorized. Please log in.");
  }

  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return data;
}

// 2. Add money to the wallet (simulated transaction)
export async function addWalletFunds(amount: number, description: string = "Valute Top-up") {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized. Please log in.");
  }

  // Record a credit transaction. The database trigger handles incrementing users.wallet_balance!
  const { data, error } = await supabase
    .from("wallet_transactions")
    .insert({
      user_id: user.id,
      type: "credit",
      amount,
      description,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to process transaction: ${error.message}`);
  }

  return data;
}

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

// 3. Fetch all wallet transactions (Admin only)
export async function getAllWalletTransactions() {
  const { supabase } = await ensureAdmin();

  const { data, error } = await supabase
    .from("wallet_transactions")
    .select(`
      *,
      users (
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return data;
}

// 4. Fetch Payment Settings
export async function getPaymentSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch payment settings: ${error.message}`);
  }

  return data;
}

// 5. Update Payment Settings (Admin only)
export async function updatePaymentSettings(id: string, upiId: string, merchantName: string) {
  const { supabase } = await ensureAdmin();

  const { data, error } = await supabase
    .from("payment_settings")
    .update({ upi_id: upiId, merchant_name: merchantName })
    .eq("id", id)
    .select()
    .maybeSingle(); // In case it returns single row

  if (error) {
    throw new Error(`Failed to update payment settings: ${error.message}`);
  }

  return data;
}
