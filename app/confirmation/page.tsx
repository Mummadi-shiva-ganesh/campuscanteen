"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Download, Home, Clock, MapPin, CheckCircle, Copy, Share2, Loader2, AlertCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import Link from "next/link"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { getOrderById, cancelOrder } from "@/features/orders/actions"
import { useAuthStore } from "@/features/auth/store"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderIdParam = searchParams.get("orderId")
  const refreshProfile = useAuthStore((state) => state.refreshProfile)

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const fetchOrder = async () => {
    if (!orderIdParam) {
      setError("No order ID provided.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await getOrderById(orderIdParam)
      setOrder(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to load order.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [orderIdParam])

  const copyOrderId = () => {
    if (!order) return
    navigator.clipboard.writeText(order.booking_id)
    setCopied(true)
    toast.success("Order ID copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCancelOrder = async () => {
    if (!order) return
    if (confirm("Are you sure you want to cancel this order? You will receive a 100% refund in your wallet.")) {
      try {
        setCancelling(true)
        await cancelOrder(order.id)
        toast.success("Order cancelled and refund processed!")
        await refreshProfile()
        await fetchOrder()
      } catch (err: any) {
        toast.error(err.message || "Could not cancel order.")
      } finally {
        setCancelling(false)
      }
    }
  }

  const handleDownloadQR = () => {
    const svg = document.getElementById("order-qr-code")
    if (!svg) return
    
    const svgString = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
    const URL = window.URL || window.webkitURL || window
    const blobURL = URL.createObjectURL(svgBlob)
    
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = 300
      canvas.height = 300
      const context = canvas.getContext("2d")
      if (context) {
        context.fillStyle = "#FFFFFF"
        context.fillRect(0, 0, 300, 300)
        context.drawImage(image, 10, 10, 280, 280)
        const png = canvas.toDataURL("image/png")
        const downloadLink = document.createElement("a")
        downloadLink.href = png
        downloadLink.download = `Canteen_QR_${order.booking_id}.png`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
        toast.success("QR Code downloaded!")
      }
    }
    image.src = blobURL
  }

  const handleShare = () => {
    if (!order) return
    if (navigator.share) {
      navigator.share({
        title: `Campus Canteen Order ${order.booking_id}`,
        text: `Check out my order ${order.booking_id} from Campus Canteen!`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Share link copied to clipboard!")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground">Retrieving order details...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 text-center space-y-6 pt-16">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Order Not Found</h2>
          <p className="text-muted-foreground mt-2">{error || "This order does not exist or you do not have permission to view it."}</p>
        </div>
        <Link href="/menu">
          <Button className="rounded-xl px-6 h-12">Back to Menu</Button>
        </Link>
      </div>
    )
  }

  // Calculate status steps completed/active flags
  const status = order.order_status // 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'
  
  const statusSteps = [
    { 
      id: "confirmed", 
      label: "Order Confirmed", 
      completed: status !== "Cancelled", 
      active: status === "Pending" 
    },
    { 
      id: "preparing", 
      label: "Preparing", 
      completed: status === "Preparing" || status === "Ready" || status === "Completed", 
      active: status === "Preparing" 
    },
    { 
      id: "ready", 
      label: "Ready for Pickup", 
      completed: status === "Ready" || status === "Completed", 
      active: status === "Ready" 
    },
  ]

  const formattedTime = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const formattedDate = new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })

  // Mathematical details
  const totalAmount = Number(order.total_amount)
  const packagingFee = 10
  const subtotal = order.order_items.reduce((sum: number, item: any) => sum + (Number(item.price) * item.quantity), 0)
  const gstTax = Math.round(subtotal * 0.05 * 100) / 100

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6">
      {/* Success Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${
            status === "Cancelled" ? "bg-destructive/10" : "bg-success/10"
          }`}
        >
          {status === "Cancelled" ? (
            <AlertCircle className="w-10 h-10 text-destructive" />
          ) : (
            <CheckCircle className="w-10 h-10 text-success" />
          )}
        </motion.div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {status === "Cancelled" ? "Order Cancelled" : "Order Confirmed!"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {status === "Cancelled" 
            ? "This order was cancelled and refunded."
            : status === "Ready"
            ? "Your order is ready! Show the QR code at the counter to collect."
            : "Show this QR code at the counter to collect your order"}
        </p>
      </motion.div>

      {/* QR Code Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-3xl border border-border shadow-lg overflow-hidden"
      >
        {/* QR Code Section */}
        <div className={`p-8 flex flex-col items-center border-b border-border bg-gradient-to-br ${
          status === "Cancelled" 
            ? "from-destructive/5 to-secondary" 
            : "from-primary/5 to-secondary"
        }`}>
          <div className="bg-white p-4 rounded-2xl shadow-md border border-muted">
            <QRCodeSVG 
              id="order-qr-code" 
              value={order.booking_id} 
              size={180} 
              className={status === "Cancelled" ? "opacity-30" : ""}
            />
          </div>
          
          {/* Order ID */}
          <div className="mt-6 flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Order ID:</span>
            <span className="font-mono font-semibold text-foreground">{order.booking_id}</span>
            <button 
              onClick={copyOrderId}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Order Status */}
        {status !== "Cancelled" ? (
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold text-foreground mb-4">Order Status</h3>
            <div className="flex items-center justify-between">
              {statusSteps.map((step, index) => {
                const stepActive = step.active
                const stepCompleted = step.completed
                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        stepCompleted
                          ? stepActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-success text-success-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {stepCompleted && !stepActive ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-semibold">{index + 1}</span>
                        )}
                      </div>
                      <span className={`text-xs mt-2 text-center whitespace-nowrap ${
                        stepActive ? "text-primary font-medium" : "text-muted-foreground"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={`w-12 sm:w-16 h-0.5 mx-1 ${
                        stepCompleted ? "bg-success" : "bg-muted"
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="p-6 border-b border-border bg-destructive/5 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-destructive shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-destructive">Cancelled & Refunded</p>
              <p className="text-muted-foreground">The transaction has been reversed. Check your wallet history.</p>
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="p-6 space-y-4">
          {/* Time & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order Placed</p>
                <p className="font-semibold text-foreground text-sm">{formattedDate}, {formattedTime}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pickup Location</p>
                <p className="font-semibold text-foreground text-sm">Main Canteen, Counter 1</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="pt-4 border-t border-border">
            <h4 className="font-medium text-foreground mb-3">Order Items</h4>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.menu_items?.name || "Unknown Item"} <span className="text-foreground font-semibold">x{item.quantity}</span>
                  </span>
                  <span className="text-foreground">₹{Number(item.price) * item.quantity}</span>
                </div>
              ))}
            </div>
            
            <div className="h-px bg-border my-4" />

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span>₹{gstTax}</span>
              </div>
              <div className="flex justify-between">
                <span>Packing & Handling</span>
                <span>₹{packagingFee}</span>
              </div>
            </div>

            <div className="flex justify-between mt-4 pt-4 border-t border-border">
              <span className="font-semibold text-foreground">
                {order.payment_status === "refunded" ? "Total Refunded" : "Total Paid"}
              </span>
              <span className="font-bold text-lg text-primary">₹{totalAmount}</span>
            </div>

            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Payment Mode</span>
              <span className="uppercase font-medium">{order.payment_method}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 space-y-3"
      >
        {status !== "Cancelled" && (
          <Button onClick={handleDownloadQR} className="w-full h-12 rounded-xl gap-2">
            <Download className="w-5 h-5" />
            Download QR Code
          </Button>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={handleShare} className="h-12 rounded-xl gap-2">
            <Share2 className="w-4 h-4" />
            Share Receipt
          </Button>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full h-12 rounded-xl gap-2">
              <Home className="w-4 h-4" />
              Home
            </Button>
          </Link>
        </div>

        {/* User-initiated cancellation button */}
        {status === "Pending" && (
          <Button 
            variant="destructive" 
            disabled={cancelling}
            onClick={handleCancelOrder}
            className="w-full h-12 rounded-xl gap-2 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border border-destructive/20"
          >
            {cancelling ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
            Cancel Order (100% Wallet Refund)
          </Button>
        )}
      </motion.div>

      {/* Help Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-sm text-muted-foreground mt-6"
      >
        Having issues? Contact support at the canteen counter or call +91 98765 43210
      </motion.p>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-32 md:pb-20">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading confirmation screen...</p>
          </div>
        }>
          <ConfirmationContent />
        </Suspense>
      </div>
      <div className="h-20 md:hidden" />
    </main>
  )
}
