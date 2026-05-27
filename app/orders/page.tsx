"use client"

import { motion } from "framer-motion"
import { ClipboardList, Clock, CheckCircle, Package, ChevronRight, Search, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { getOrders } from "@/features/orders/actions"
import { useAuthStore } from "@/features/auth/store"

const getStatusConfig = (status: string) => {
  switch (status) {
    case "Pending":
      return { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "Pending" }
    case "Preparing":
      return { icon: Clock, color: "text-primary", bg: "bg-primary/10", label: "Preparing" }
    case "Ready":
      return { icon: Package, color: "text-success", bg: "bg-success/10", label: "Ready for Pickup" }
    case "Completed":
      return { icon: CheckCircle, color: "text-muted-foreground", bg: "bg-muted", label: "Completed" }
    case "Cancelled":
      return { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Cancelled" }
    default:
      return { icon: ClipboardList, color: "text-muted-foreground", bg: "bg-muted", label: status }
  }
}

export default function OrdersPage() {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")
  const [searchQuery, setSearchQuery] = useState("")

  const { profile, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  // Fetch student orders using React Query
  const { data: dbOrders = [], isLoading, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders(),
    enabled: !!profile,
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    const timeStr = date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    })

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${timeStr}`
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${timeStr}`
    } else {
      return `${date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      })}, ${timeStr}`
    }
  }

  const filteredOrders = dbOrders.filter((order) => {
    const matchesSearch = order.booking_id.toLowerCase().includes(searchQuery.toLowerCase())
    const isActive = order.order_status === "Pending" || order.order_status === "Preparing" || order.order_status === "Ready"
    const isCompleted = order.order_status === "Completed" || order.order_status === "Cancelled"

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && isActive) ||
      (filter === "completed" && isCompleted)
    return matchesSearch && matchesFilter
  })

  const activeCount = dbOrders.filter((o) => 
    o.order_status === "Pending" || o.order_status === "Preparing" || o.order_status === "Ready"
  ).length

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-28 pb-32 md:pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Your Orders</h1>
            <p className="text-muted-foreground mt-1">
              {isLoading 
                ? "Loading your orders..." 
                : activeCount > 0 
                ? `${activeCount} active order${activeCount > 1 ? "s" : ""}` 
                : "No active orders"}
            </p>
          </motion.div>

          {/* Search & Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4 mb-6"
          >
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-muted border-0"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2">
              {[
                { id: "all", label: "All Orders" },
                { id: "active", label: "Active" },
                { id: "completed", label: "Completed" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as "all" | "active" | "completed")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filter === f.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Fetching orders...</p>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="text-center py-16 bg-card border rounded-2xl p-6">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-1">Failed to load orders</h3>
              <p className="text-sm text-muted-foreground">Please check your internet connection and try again.</p>
            </div>
          )}

          {/* Orders List */}
          {!isLoading && !isError && (
            <div className="space-y-4">
              {filteredOrders.map((order, index) => {
                const statusConfig = getStatusConfig(order.order_status)
                const StatusIcon = statusConfig.icon
                const itemsList = order.order_items?.map((item: any) => 
                  `${item.menu_items?.name || "Unknown Item"} x${item.quantity}`
                ) || []

                const isClickable = order.order_status !== "Completed" && order.order_status !== "Cancelled"

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <Link href={isClickable ? `/confirmation?orderId=${order.id}` : "#"}>
                      <motion.div
                        whileHover={isClickable ? { scale: 1.01 } : undefined}
                        whileTap={isClickable ? { scale: 0.99 } : undefined}
                        className={`bg-card rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-all ${
                          !isClickable ? "opacity-75 cursor-default" : "cursor-pointer"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className={`w-12 h-12 rounded-xl ${statusConfig.bg} flex items-center justify-center shrink-0`}>
                              <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-foreground">{order.booking_id}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  order.order_status === "Pending"
                                    ? "bg-amber-100 text-amber-700"
                                    : order.order_status === "Preparing"
                                    ? "bg-primary/10 text-primary"
                                    : order.order_status === "Ready"
                                    ? "bg-success/10 text-success"
                                    : "bg-muted text-muted-foreground"
                                }`}>
                                  {statusConfig.label}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{formatDate(order.created_at)}</p>
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                                {itemsList.join(", ")}
                              </p>
                              {(order.order_status === "Pending" || order.order_status === "Preparing") && (
                                <p className="text-xs text-primary font-medium mt-2 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  Ready in ~{order.preparation_time || 15} mins
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="font-bold text-foreground">₹{order.total_amount}</span>
                            {isClickable && (
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && filteredOrders.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-card rounded-2xl border border-border"
            >
              <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                <ClipboardList className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No orders found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "Try a different search term"
                  : "Your order history will appear here"}
              </p>
              <Link href="/menu">
                <Button className="rounded-full px-8">Order Now</Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      <div className="h-20 md:hidden" />
    </main>
  )
}
