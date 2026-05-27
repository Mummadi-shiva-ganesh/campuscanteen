"use server";

import { createClient } from "@/lib/supabase/server";

export interface OrderInputItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CreateOrderInput {
  items: OrderInputItem[];
  paymentMethod: "wallet" | "upi" | "cod";
}

// 1. Create a new order
export async function createOrder(input: CreateOrderInput) {
  console.log("=== [DEBUG createOrder] STARTING ORDER CREATION ===");
  console.log("Input payload:", JSON.stringify(input, null, 2));

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  console.log("Auth User fetch result:", JSON.stringify(user), "Error:", authError);

  if (authError || !user) {
    throw new Error("Unauthorized. Please log in.");
  }

  if (!input.items || input.items.length === 0) {
    throw new Error("Cart is empty");
  }

  // Fetch all menu items from the database to check prices & availability
  const itemIds = input.items.map(item => item.id);
  console.log("Item IDs to query:", itemIds);

  const { data: dbItems, error: menuError } = await supabase
    .from("menu_items")
    .select("id, name, price, available")
    .in("id", itemIds);

  console.log("Database menu items fetched:", JSON.stringify(dbItems), "Error:", menuError);

  if (menuError || !dbItems) {
    throw new Error(`Failed to verify menu items: ${menuError?.message || "Not found"}`);
  }

  // Create a map for quick lookup
  const dbItemsMap = new Map(dbItems.map(item => [item.id, item]));

  // Verify availability and calculate actual pricing
  let calculatedSubtotal = 0;
  for (const item of input.items) {
    const dbItem = dbItemsMap.get(item.id);
    if (!dbItem) {
      throw new Error(`Item "${item.name}" is no longer available in our menu.`);
    }
    if (!dbItem.available) {
      throw new Error(`Item "${dbItem.name}" is currently sold out.`);
    }
    calculatedSubtotal += Number(dbItem.price) * item.quantity;
  }

  // Apply math (5% GST + ₹10 Packaging)
  const gst = Math.round(calculatedSubtotal * 0.05 * 100) / 100;
  const packaging = 10;
  const totalAmount = Math.round((calculatedSubtotal + gst + packaging) * 100) / 100;

  console.log(`Subtotal: ${calculatedSubtotal}, GST: ${gst}, Packaging: ${packaging}, Total: ${totalAmount}`);

  // Generate unique booking ID: CC-XXXXXX
  const bookingId = `CC-${Math.floor(100000 + Math.random() * 900000)}`;

  // Pickup deadline is current time + 15 min preparation + 30 min buffer = 45 mins from now
  const pickupDeadline = new Date(Date.now() + 45 * 60 * 1000).toISOString();

  let paymentStatus: "pending" | "paid" | "failed" = "pending";

  // Wallet payment deduction check
  if (input.paymentMethod === "wallet") {
    console.log("Processing Wallet payment check for user:", user.id);
    // 1. Fetch user's current wallet balance
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    console.log("Wallet profile query result:", JSON.stringify(profile), "Error:", profileError);

    if (profileError || !profile) {
      throw new Error(`Could not retrieve user wallet details: ${profileError?.message || "Profile not found"}`);
    }

    if (Number(profile.wallet_balance) < totalAmount) {
      throw new Error(`Insufficient wallet balance. You need ₹${totalAmount} but only have ₹${profile.wallet_balance}.`);
    }

    // 2. Perform wallet debit transaction.
    console.log("Inserting wallet transaction debit...");
    const { data: txData, error: txError } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: user.id,
        type: "debit",
        amount: totalAmount,
        description: `Order payment for ${bookingId}`,
      })
      .select();

    console.log("Wallet transaction insert result:", JSON.stringify(txData), "Error:", txError);

    if (txError) {
      throw new Error(`Wallet transaction failed: ${txError.message}`);
    }

    paymentStatus = "paid";
  } else if (input.paymentMethod === "upi") {
    // Simulated UPI is treated as paid upon checkout confirmation
    paymentStatus = "paid";
  } else {
    // COD is paid at counter
    paymentStatus = "pending";
  }

  // Insert Order
  console.log("Inserting order into database, bookingId:", bookingId);
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      booking_id: bookingId,
      user_id: user.id,
      total_amount: totalAmount,
      payment_method: input.paymentMethod,
      payment_status: paymentStatus,
      order_status: "Pending",
      qr_code: bookingId,
      preparation_time: 15,
      pickup_deadline: pickupDeadline,
    })
    .select()
    .single();

  console.log("Order insert result:", JSON.stringify(order), "Error:", orderError);

  if (orderError || !order) {
    throw new Error(`Failed to create order: ${orderError?.message || "Order insertion failed"}`);
  }

  // Insert Order Items
  console.log("Inserting order items...");
  const orderItemsInsert = input.items.map(item => {
    const dbItem = dbItemsMap.get(item.id)!;
    return {
      order_id: order.id,
      menu_item_id: item.id,
      quantity: item.quantity,
      price: Number(dbItem.price),
    };
  });

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemsInsert);

  console.log("Order items insert result error:", itemsError);

  if (itemsError) {
    throw new Error(`Failed to save order items: ${itemsError.message}`);
  }

  // Create an automatic notification for the student
  console.log("Inserting notification...");
  await supabase
    .from("notifications")
    .insert({
      user_id: user.id,
      title: "Order Placed!",
      message: `Your order ${bookingId} has been placed. Current status: Pending.`,
    });

  console.log("=== [DEBUG createOrder] ORDER CREATION SUCCESSFUL ===");
  return order;
}

// 2. Fetch order history for the current user
export async function getOrders() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized. Please log in.");
  }

  // Select orders and join with order items and menu items
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        quantity,
        price,
        menu_items (
          name
        )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  return data;
}

// 3. Fetch a specific order details by ID
export async function getOrderById(id: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized. Please log in.");
  }

  // Query order by booking_id OR uuid id
  const query = id.startsWith("CC-") 
    ? supabase.from("orders").select(`
        *,
        order_items (
          id,
          quantity,
          price,
          menu_items (
            name
          )
        )
      `).eq("booking_id", id).single()
    : supabase.from("orders").select(`
        *,
        order_items (
          id,
          quantity,
          price,
          menu_items (
            name
          )
        )
      `).eq("id", id).single();

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch order details: ${error.message}`);
  }

  // Basic security check: user must own the order or be an admin
  if (data.user_id !== user.id) {
    // Check if current user is admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      throw new Error("Forbidden. You cannot view this order.");
    }
  }

  return data;
}

// 4. Cancel a pending order (user-initiated)
export async function cancelOrder(orderId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized. Please log in.");
  }

  // 1. Get the order details
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error("Order not found.");
  }

  // Basic security: Must be owner
  if (order.user_id !== user.id) {
    throw new Error("Unauthorized to cancel this order.");
  }

  // Check if it's pending
  if (order.order_status !== "Pending") {
    throw new Error("Only pending orders can be cancelled.");
  }

  // Update order status to 'Cancelled'
  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({
      order_status: "Cancelled",
      payment_status: order.payment_method === "cod" ? "failed" : "refunded"
    })
    .eq("id", orderId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to cancel order: ${updateError.message}`);
  }

  // If payment was not COD (wallet/upi), refund 100% back to wallet
  if (order.payment_method !== "cod") {
    const { error: refundError } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: user.id,
        type: "credit",
        amount: Number(order.total_amount),
        description: `Refund for cancelled order ${order.booking_id}`,
      });

    if (refundError) {
      console.error("Refund failed for order:", orderId, refundError);
    }
  }

  // Create automatic notification for student
  await supabase
    .from("notifications")
    .insert({
      user_id: user.id,
      title: "Order Cancelled",
      message: `Your order ${order.booking_id} has been cancelled successfully. Refund processed to your wallet.`,
    });

  return updatedOrder;
}

// 5. Fetch all orders (admin view)
export async function getAllOrders() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized. Please log in.");
  }

  // Ensure admin role
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Forbidden. Admin rights required.");
  }

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      users (
        full_name,
        email,
        roll_number
      ),
      order_items (
        id,
        quantity,
        price,
        menu_items (
          name
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch all orders: ${error.message}`);
  }

  return data;
}

// 6. Update order status (admin status control)
export async function updateOrderStatus(
  orderId: string, 
  status: "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled"
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized. Please log in.");
  }

  // Ensure admin role
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Forbidden. Admin rights required.");
  }

  // Get current order status
  const { data: originalOrder, error: fetchErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchErr || !originalOrder) {
    throw new Error("Order not found.");
  }

  // Update order status
  const updates: any = { order_status: status };
  if (status === "Completed") {
    updates.payment_status = "paid";
  } else if (status === "Cancelled") {
    updates.payment_status = originalOrder.payment_method === "cod" ? "failed" : "refunded";
  }

  const { data: order, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update status: ${error.message}`);
  }

  // If transitioning to Cancelled and order was paid, perform refund
  if (status === "Cancelled" && originalOrder.payment_status === "paid" && originalOrder.payment_method !== "cod") {
    const { error: refundError } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: originalOrder.user_id,
        type: "credit",
        amount: Number(originalOrder.total_amount),
        description: `Admin Refund: Order ${originalOrder.booking_id} cancelled`,
      });

    if (refundError) {
      console.error("Refund failed for admin cancellation of:", orderId, refundError);
    }
  }

  // Notify student
  await supabase
    .from("notifications")
    .insert({
      user_id: order.user_id,
      title: `Order Status: ${status}`,
      message: `Your order ${order.booking_id} status has been updated to ${status}.`,
    });

  return order;
}

// 7. Scan QR and Complete Order (admin scanner checkout)
export async function verifyAndCompleteOrder(bookingId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized. Please log in.");
  }

  // Ensure admin
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Forbidden. Admin rights required.");
  }

  // Find order
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("*")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (orderErr || !order) {
    throw new Error(`Order "${bookingId}" not found.`);
  }

  if (order.order_status === "Completed") {
    throw new Error(`Order "${bookingId}" is already picked up and completed.`);
  }

  if (order.order_status === "Cancelled") {
    throw new Error(`Order "${bookingId}" was cancelled and cannot be fulfilled.`);
  }

  // Update order status to Completed
  const { data: updatedOrder, error: updateErr } = await supabase
    .from("orders")
    .update({
      order_status: "Completed",
      payment_status: "paid" // Ensure it is marked as paid
    })
    .eq("id", order.id)
    .select()
    .single();

  if (updateErr) {
    throw new Error(`Failed to complete order verification: ${updateErr.message}`);
  }

  // Notify student
  await supabase
    .from("notifications")
    .insert({
      user_id: order.user_id,
      title: "Order Picked Up!",
      message: `Your order ${bookingId} has been successfully verified and picked up at the counter.`,
    });

  return updatedOrder;
}
