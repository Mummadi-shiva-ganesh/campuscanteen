import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"

import { isMockMode } from "@/lib/env"
import { createServerMockClient } from "@/lib/supabase/mock-server"

// Create a service-role client that bypasses Row Level Security (RLS)
function getServiceClient() {
  if (isMockMode) {
    return createServerMockClient() as any
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables")
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function GET(request: Request) {
  try {
    // 1. Secret Key authorization check
    const { searchParams } = new URL(request.url)
    const querySecret = searchParams.get("secret")
    
    // Header checks
    const authHeader = request.headers.get("authorization")
    const headerSecret = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null

    const expectedSecret = process.env.CRON_SECRET

    // If a secret is configured in env, require it
    if (expectedSecret) {
      if (querySecret !== expectedSecret && headerSecret !== expectedSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    } else {
      // In local dev, we can allow running without a secret if not set, but log a warning
      console.warn("CRON_SECRET env variable is not set. Permitting sandbox trigger.")
    }

    const supabase = getServiceClient()
    const now = new Date().toISOString()

    // 2. Fetch all orders that are Pending/Preparing and have passed their pickup_deadline
    const { data: expiredOrders, error: fetchError } = await supabase
      .from("orders")
      .select("id, booking_id, user_id, total_amount, payment_method, order_status, payment_status")
      .in("order_status", ["Pending", "Preparing"])
      .lt("pickup_deadline", now)

    if (fetchError) {
      console.error("Cron fetch error:", fetchError)
      return NextResponse.json({ error: "Failed to fetch expired orders", details: fetchError.message }, { status: 500 })
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return NextResponse.json({ message: "No expired orders found to cancel.", processed: 0 })
    }

    const results = []

    // 3. Process each expired order
    for (const order of expiredOrders) {
      const isCod = order.payment_method === "cod"
      const refundAmount = isCod ? 0 : Math.round(Number(order.total_amount) * 0.8 * 100) / 100

      // Update Order Status
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          order_status: "Cancelled",
          payment_status: isCod ? "failed" : "refunded",
        })
        .eq("id", order.id)

      if (updateError) {
        console.error(`Failed to cancel order ${order.booking_id}:`, updateError)
        results.push({ orderId: order.id, bookingId: order.booking_id, status: "failed", error: updateError.message })
        continue
      }

      // If not COD, insert a credit wallet transaction (80% refund)
      if (!isCod && refundAmount > 0) {
        const { error: refundError } = await supabase
          .from("wallet_transactions")
          .insert({
            user_id: order.user_id,
            type: "credit",
            amount: refundAmount,
            description: `Auto-refund (80%) for uncollected order ${order.booking_id}`,
          })

        if (refundError) {
          console.error(`Refund failed for order ${order.booking_id}:`, refundError)
          // Log and continue (admin can audit and fix since order is marked refunded)
        }
      }

      // Insert user notification
      const notificationTitle = "Order Auto-Cancelled"
      const notificationMessage = isCod
        ? `Your COD order ${order.booking_id} was cancelled as it was not collected before the deadline.`
        : `Your order ${order.booking_id} was cancelled as it was not collected before the deadline. An 80% refund (₹${refundAmount.toFixed(2)}) has been credited to your wallet.`

      const { error: notifyError } = await supabase
        .from("notifications")
        .insert({
          user_id: order.user_id,
          title: notificationTitle,
          message: notificationMessage,
        })

      if (notifyError) {
        console.error(`Failed to notify user for order ${order.booking_id}:`, notifyError)
      }

      results.push({
        orderId: order.id,
        bookingId: order.booking_id,
        status: "cancelled",
        refunded: !isCod,
        refundAmount,
      })
    }

    return NextResponse.json({
      message: `Successfully processed ${results.filter(r => r.status === "cancelled").length} expired orders.`,
      processed: expiredOrders.length,
      results,
    })
  } catch (error: any) {
    console.error("Cron route error:", error)
    return NextResponse.json({ error: "Internal server error", message: error.message }, { status: 500 })
  }
}
